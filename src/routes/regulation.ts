import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { pool } from '../db/pool';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { TOPIC_TAXONOMY, matchTopics } from '../utils/topicTaxonomy';
import { buildDefaultTemplate, bumpVersion, buildTemplateForType } from '../utils/policyHelpers';
import { generateWordDoc, generatePdfDoc, generateExcelDoc } from '../utils/exportHelpers';

const router = Router();

// Tüm regulation endpoint'leri kimlik doğrulama gerektirir
router.use(requireAuth);

const UPLOADS_DIR = path.join(__dirname, '../../uploads/regulation');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (_req: Request, file: Express.Multer.File, cb: (err: Error | null, filename: string) => void) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

const POLICY_FILES_DIR = path.join(__dirname, '../../uploads/policy-files');
if (!fs.existsSync(POLICY_FILES_DIR)) fs.mkdirSync(POLICY_FILES_DIR, { recursive: true });

const policyFileStorage = multer.diskStorage({
  destination: POLICY_FILES_DIR,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});
const uploadPolicyFile = multer({
  storage: policyFileStorage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.pdf', '.docx', '.doc', '.xlsx', '.txt', '.png', '.jpg', '.jpeg'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  }
});

const Anthropic = require('@anthropic-ai/sdk');
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' });

// ── Parse uploaded document text ───────────────────────────────────────────────
async function extractTextFromFile(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.pdf') {
    const pdfParse = require('pdf-parse');
    const buf = fs.readFileSync(filePath);
    const result = await pdfParse(buf);
    return result.text;
  }
  if (ext === '.docx') {
    const mammoth = require('mammoth');
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }
  if (ext === '.txt') {
    return fs.readFileSync(filePath, 'utf8');
  }
  return '';
}

// ── Build policy HTML ──────────────────────────────────────────────────────────
function buildPolicyHTML(standard: any, policies: any[]): string {
  const date = new Date().toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' });
  const toc = policies.map((p: any, i: number) =>
    `<li><a href="#pol-${i}">${p.refNo} — ${p.controlTitle}</a></li>`
  ).join('');

  const sections = policies.map((p: any, i: number) => {
    const procedures = (p.procedures || []).map((pr: any, si: number) => `
      <div class="procedure-step">
        <div class="step-header">${si + 1}. ${pr.title || ''}</div>
        <p>${pr.description || ''}</p>
        ${pr.responsible ? `<p><strong>Sorumlu:</strong> ${pr.responsible}</p>` : ''}
        ${(pr.inputs || []).length ? `<p><strong>Girdiler:</strong> ${pr.inputs.join(', ')}</p>` : ''}
        ${(pr.outputs || []).length ? `<p><strong>Çıktılar:</strong> ${pr.outputs.join(', ')}</p>` : ''}
      </div>`).join('');

    const responsibilities = (p.responsibilities || []).map((r: any) =>
      `<tr><td>${r.role || ''}</td><td>${r.duties || ''}</td></tr>`
    ).join('');

    const measurements = (p.measurementCriteria || []).map((m: string) => `<li>${m}</li>`).join('');
    const related = (p.relatedDocuments || []).map((d: string) => `<li>${d}</li>`).join('');

    return `
    <div class="policy-section" id="pol-${i}">
      <div class="policy-section-header">
        <span class="ref-tag">${p.refNo}</span>
        <h2>${p.controlTitle}</h2>
      </div>
      <div class="doc-title">${p.documentTitle || p.controlTitle + ' Politikası'}</div>
      <table class="meta-table">
        <tr><td>Yayın Tarihi</td><td>${p.generatedAt || date}</td></tr>
        <tr><td>Gözden Geçirme</td><td>${p.reviewPeriod || 'Yıllık'}</td></tr>
        <tr><td>Durum</td><td>Aktif</td></tr>
      </table>
      <h3>1. Amaç</h3><p>${p.purpose || ''}</p>
      <h3>2. Kapsam</h3><p>${p.scope || ''}</p>
      <h3>3. Politika Beyanı</h3><p>${(p.policyStatement || '').replace(/\n/g, '</p><p>')}</p>
      <h3>4. Prosedürler</h3>${procedures || '<p>—</p>'}
      <h3>5. Sorumluluklar</h3>
      ${responsibilities ? `<table class="resp-table"><thead><tr><th>Rol</th><th>Sorumluluk</th></tr></thead><tbody>${responsibilities}</tbody></table>` : '<p>—</p>'}
      <h3>6. Ölçüm Kriterleri</h3><ul>${measurements || '<li>—</li>'}</ul>
      <h3>7. İstisna Yönetimi</h3><p>${p.exceptions || '—'}</p>
      <h3>8. Uyumsuzluk</h3><p>${p.compliance || '—'}</p>
      <h3>9. İlgili Dokümanlar</h3><ul>${related || '<li>—</li>'}</ul>
      <div class="page-break"></div>
    </div>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8"/>
<title>${standard.name} — Politika ve Prosedür Dokümanları</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',Arial,sans-serif;font-size:11pt;color:#1a1a1a;background:#fff;line-height:1.6;padding:40px}
  .cover{text-align:center;padding:80px 40px;border-bottom:3px solid #1a5276;margin-bottom:60px}
  .cover-logo{font-size:48px;margin-bottom:16px}
  .cover-title{font-size:24pt;font-weight:700;color:#1a5276;margin-bottom:8px}
  .cover-sub{font-size:14pt;color:#555;margin-bottom:32px}
  .cover-meta{font-size:10pt;color:#777;border-top:1px solid #ddd;padding-top:16px;margin-top:32px}
  .toc{page-break-after:always;margin-bottom:40px}
  .toc h2{color:#1a5276;border-bottom:2px solid #1a5276;padding-bottom:8px;margin-bottom:16px}
  .toc ol{padding-left:20px}
  .toc li{margin-bottom:6px;font-size:10pt}
  .toc a{color:#1a5276;text-decoration:none}
  .policy-section{margin-bottom:40px}
  .policy-section-header{display:flex;align-items:center;gap:12px;margin-bottom:8px;padding:12px 16px;background:#f0f5fb;border-left:4px solid #1a5276;border-radius:4px}
  .ref-tag{background:#1a5276;color:#fff;padding:3px 10px;border-radius:4px;font-family:monospace;font-size:10pt;white-space:nowrap}
  .policy-section-header h2{font-size:14pt;color:#1a5276}
  .doc-title{font-size:11pt;font-style:italic;color:#555;margin-bottom:12px}
  .meta-table{width:100%;border-collapse:collapse;margin-bottom:20px;font-size:9pt}
  .meta-table td{padding:5px 10px;border:1px solid #ddd}
  .meta-table td:first-child{font-weight:600;background:#f8f8f8;width:180px}
  h3{font-size:11pt;color:#1a5276;margin:20px 0 8px;border-bottom:1px solid #e0e8f0;padding-bottom:4px}
  p{margin-bottom:10px;text-align:justify}
  ul,ol{padding-left:20px;margin-bottom:10px}
  li{margin-bottom:4px}
  .procedure-step{background:#f9f9f9;border:1px solid #e0e0e0;border-radius:4px;padding:12px 16px;margin-bottom:10px}
  .step-header{font-weight:700;color:#2c3e50;margin-bottom:6px}
  .resp-table{width:100%;border-collapse:collapse;margin-bottom:10px;font-size:10pt}
  .resp-table th,.resp-table td{padding:7px 12px;border:1px solid #ddd;text-align:left}
  .resp-table th{background:#1a5276;color:#fff;font-weight:600}
  .resp-table tr:nth-child(even) td{background:#f5f8fc}
  .page-break{page-break-after:always;height:40px;border-bottom:1px dashed #ccc;margin-bottom:40px}
  @media print{
    .cover{page-break-after:always}
    .toc{page-break-after:always}
    .page-break{page-break-after:always;border:none}
    body{padding:20px}
  }
</style>
</head>
<body>
<div class="cover">
  <div class="cover-logo">${standard.icon || '📋'}</div>
  <div class="cover-title">${standard.name}</div>
  <div class="cover-sub">Politika ve Prosedür Dokümanları</div>
  <p style="color:#555;margin-top:16px">${standard.description || ''}</p>
  <div class="cover-meta">
    <strong>Yayın Tarihi:</strong> ${date} &nbsp;|&nbsp;
    <strong>Versiyon:</strong> ${standard.version || '1.0'} &nbsp;|&nbsp;
    <strong>Toplam Politika:</strong> ${policies.length}
  </div>
</div>
<div class="toc">
  <h2>İçindekiler</h2>
  <ol>${toc}</ol>
</div>
${sections}
</body>
</html>`;
}

// ── GET /standards ─────────────────────────────────────────────────────────────
router.get('/standards', async (req: Request, res: Response) => {
  const tenantId = req.tenantId || 1;
  try {
    const result = await pool.query(
      `SELECT s.*,
        (SELECT COUNT(*) FROM controls c WHERE c.standard_id = s.id AND c.tenant_id = s.tenant_id) as control_count_db,
        (SELECT COUNT(*) FROM controls c WHERE c.standard_id = s.id AND c.tenant_id = s.tenant_id AND c.type = 'ZORUNLU') as mandatory_count_db
       FROM standards s
       WHERE s.tenant_id = $1
       ORDER BY s.created_at`,
      [tenantId]
    );

    const standards = result.rows.map(s => ({
      id: s.id,
      name: s.name,
      shortName: s.short_name,
      category: s.category,
      version: s.version,
      publishedBy: s.published_by,
      description: s.description,
      refFormat: s.ref_format,
      controlCount: parseInt(s.control_count_db) || s.control_count || 0,
      mandatoryCount: parseInt(s.mandatory_count_db) || 0,
      status: s.status,
      color: s.color,
      icon: s.icon,
      generatedAt: s.generated_at,
      hasControls: parseInt(s.control_count_db) > 0,
    }));

    res.json(standards);
  } catch (err: any) {
    console.error('[Regulation] standards error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /standards/:id ─────────────────────────────────────────────────────────
router.get('/standards/:id', async (req: Request, res: Response) => {
  const tenantId = req.tenantId || 1;
  try {
    const result = await pool.query(
      'SELECT * FROM standards WHERE id = $1 AND tenant_id = $2',
      [req.params.id, tenantId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Standard bulunamadı' });
      return;
    }

    const s = result.rows[0];
    const ctrlResult = await pool.query(
      'SELECT * FROM controls WHERE standard_id = $1 AND tenant_id = $2 ORDER BY ref_no',
      [req.params.id, tenantId]
    );

    res.json({
      id: s.id, name: s.name, shortName: s.short_name,
      category: s.category, version: s.version, publishedBy: s.published_by,
      description: s.description, refFormat: s.ref_format,
      controlCount: ctrlResult.rowCount, status: s.status,
      color: s.color, icon: s.icon, generatedAt: s.generated_at,
      controls: ctrlResult.rows.map(c => ({
        ...c, refNo: c.ref_no, keywords: c.keywords || [],
      })),
      hasControls: ctrlResult.rowCount! > 0,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /standards/:id/controls ────────────────────────────────────────────────
router.get('/standards/:id/controls', async (req: Request, res: Response) => {
  const tenantId = req.tenantId || 1;
  const { category, priority, type, q } = req.query as Record<string, string>;

  try {
    let query = 'SELECT * FROM controls WHERE standard_id = $1 AND tenant_id = $2';
    const params: any[] = [req.params.id, tenantId];
    let idx = 3;

    if (category) { query += ` AND category = $${idx++}`; params.push(category); }
    if (type)     { query += ` AND type = $${idx++}`;     params.push(type); }
    if (priority) { query += ` AND priority ILIKE $${idx++}`; params.push(`%${priority}%`); }
    if (q) {
      query += ` AND (title ILIKE $${idx} OR description ILIKE $${idx} OR ref_no ILIKE $${idx})`;
      params.push(`%${q}%`);
      idx++;
    }
    query += ' ORDER BY ref_no';

    const result = await pool.query(query, params);
    const controls = result.rows.map(c => ({ ...c, refNo: c.ref_no, keywords: c.keywords || [] }));
    res.json({ standardId: req.params.id, total: controls.length, controls });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /standards/upload ─────────────────────────────────────────────────────
router.post('/standards/upload', requireAuth, upload.single('document'), async (req: Request, res: Response) => {
  if (!req.file) { res.status(400).json({ error: 'Dosya yüklenmedi' }); return; }

  const { standardName, standardId, version, category } = req.body;
  if (!standardName || !standardId) {
    res.status(400).json({ error: 'standardName ve standardId zorunludur' });
    return;
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(503).json({ error: 'ANTHROPIC_API_KEY yapılandırılmamış' });
    return;
  }

  const tenantId = req.tenantId!;

  try {
    const text = await extractTextFromFile(req.file.path);
    if (!text || text.length < 100) {
      res.status(400).json({ error: 'Dosya içeriği okunamadı veya çok kısa' });
      return;
    }

    const truncated = text.slice(0, 60000);
    const prompt = `Aşağıda "${standardName}" standardının tam metni verilmiştir.

Bu metni analiz ederek kapsamlı bir kontrol listesi oluştur.
Her kontrol için şu alanları doldur:
- refNo: Standardın orijinal referans numarası
- category: Ana kategori/bölüm adı (Türkçe)
- title: Kontrol başlığı (Türkçe - kısa, net)
- description: Kontrol açıklaması (Türkçe - 1-3 cümle)
- type: "ZORUNLU" veya "TAVSİYE"
- priority: "🔴 KRİTİK", "🟠 YÜKSEK", "🟡 ORTA" veya "🟢 DÜŞÜK"
- keywords: Anahtar kelimeler dizisi (5-10 kelime)

Yanıtı SADECE geçerli JSON formatında ver:
{
  "standardId": "${standardId}",
  "standardName": "${standardName}",
  "generatedAt": "${new Date().toISOString().split('T')[0]}",
  "controls": [
    {
      "refNo": "...",
      "category": "...",
      "title": "...",
      "description": "...",
      "type": "ZORUNLU",
      "priority": "🔴 KRİTİK",
      "keywords": ["...", "..."]
    }
  ]
}

STANDART METNİ:
${truncated}`;

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 8192,
      messages: [{ role: 'user', content: prompt }],
    });

    const rawText = message.content[0].text.trim();
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Claude geçerli JSON döndürmedi');
    const parsed = JSON.parse(jsonMatch[0]);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Upsert standard
      await client.query(
        `INSERT INTO standards (id, tenant_id, name, short_name, category, version, published_by, description, ref_format, control_count, status, color, icon, generated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         ON CONFLICT (id, tenant_id) DO UPDATE SET
           name = EXCLUDED.name, control_count = EXCLUDED.control_count,
           status = EXCLUDED.status, generated_at = EXCLUDED.generated_at`,
        [
          standardId, tenantId, standardName,
          standardName.split(' ').slice(0, 2).join(' '),
          category || 'Diğer', version || '—', 'Yüklendi',
          `${standardName} — doküman yüklenerek oluşturuldu.`,
          '—', parsed.controls.length, 'UPLOADED', '#555555', '📋',
          parsed.generatedAt || new Date().toISOString().split('T')[0],
        ]
      );

      // Insert controls
      for (const ctrl of parsed.controls) {
        await client.query(
          `INSERT INTO controls (tenant_id, standard_id, ref_no, category, title, description, type, priority, keywords)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (tenant_id, standard_id, ref_no) DO UPDATE SET
             category = EXCLUDED.category, title = EXCLUDED.title,
             description = EXCLUDED.description, type = EXCLUDED.type,
             priority = EXCLUDED.priority, keywords = EXCLUDED.keywords`,
          [
            tenantId, standardId, ctrl.refNo, ctrl.category,
            ctrl.title, ctrl.description, ctrl.type, ctrl.priority,
            ctrl.keywords || [],
          ]
        );
      }

      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    res.json({
      success: true,
      standardId,
      controlCount: parsed.controls.length,
      message: `${parsed.controls.length} kontrol başarıyla oluşturuldu`,
    });
  } catch (err: any) {
    console.error('[Regulation] Upload error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /standards/:id ──────────────────────────────────────────────────────
router.delete('/standards/:id', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const tenantId = req.tenantId!;
  try {
    // Cascade: controls, policies, policy_versions are FK cascaded
    await pool.query('DELETE FROM standards WHERE id = $1 AND tenant_id = $2', [req.params.id, tenantId]);
    res.json({ success: true, message: 'Standart silindi' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /compliance-matrix (keyword tabanlı, API key gerektirmez) ─────────────
router.post('/compliance-matrix', requireAuth, async (req: Request, res: Response) => {
  const { features, selectedStandards } = req.body;
  const tenantId = req.tenantId!;

  if (!features || !Array.isArray(features) || features.length === 0) {
    res.status(400).json({ error: '"features" dizisi zorunludur' });
    return;
  }

  try {
    let standardsQuery = `
      SELECT s.id, s.name, s.short_name, s.color, s.icon,
             array_agg(row_to_json(c)) FILTER (WHERE c.id IS NOT NULL) as controls_json
      FROM standards s
      LEFT JOIN controls c ON c.standard_id = s.id AND c.tenant_id = s.tenant_id
      WHERE s.tenant_id = $1`;
    const params: any[] = [tenantId];

    if (selectedStandards && selectedStandards.length > 0) {
      standardsQuery += ` AND s.id = ANY($2)`;
      params.push(selectedStandards);
    }
    standardsQuery += ' GROUP BY s.id, s.name, s.short_name, s.color, s.icon HAVING COUNT(c.id) > 0';

    const stdResult = await pool.query(standardsQuery, params);

    if (stdResult.rows.length === 0) {
      res.status(400).json({ error: 'Seçili standartlar için kontrol listesi bulunamadı' });
      return;
    }

    // ── Tokenizer: metni küçük harfe çevir, anlamlı kelimelere böl ─────────────
    const tokenize = (text: string): string[] => {
      return text
        .toLowerCase()
        .replace(/[^\wışğüöçĞÜŞİÖÇ\s]/gi, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2);
    };

    // ── Kontrol skoru: feature ile ne kadar örtüşüyor (0-100) ──────────────────
    const scoreControl = (ctrl: any, featureTokens: string[]): number => {
      const titleTokens    = tokenize(ctrl.title || '');
      const descTokens     = tokenize(ctrl.description || '');
      const keywordTokens  = (ctrl.keywords || []).flatMap((k: string) => tokenize(k));
      const allSearchable  = new Set([...titleTokens, ...descTokens, ...keywordTokens]);

      let score = 0;
      for (const ft of featureTokens) {
        if (titleTokens.includes(ft))   score += 3;  // başlık eşleşmesi en değerli
        else if (keywordTokens.includes(ft)) score += 2;  // keyword eşleşmesi
        else if (descTokens.includes(ft))    score += 1;  // açıklama eşleşmesi
      }
      // normalize: maksimum olası puan feature token sayısı × 3
      return featureTokens.length > 0 ? Math.min(100, Math.round((score / (featureTokens.length * 3)) * 100)) : 0;
    };

    // ── Uyum seviyesi etiketleri ────────────────────────────────────────────────
    const complianceLabel = (score: number) => {
      if (score >= 60) return 'TAM';
      if (score >= 30) return 'KISMI';
      return 'EKSİK';
    };
    const overallStatus = (compliantCount: number, total: number) => {
      const ratio = total > 0 ? compliantCount / total : 0;
      if (ratio >= 0.6) return '✅ UYUMLU';
      if (ratio >= 0.3) return '⚠️ KISMI UYUMLU';
      return '❌ UYUMSUZ';
    };

    // ── Her feature için matris satırı oluştur ──────────────────────────────────
    const matrixRows = features.map((feature: string, idx: number) => {
      const featureTokens = tokenize(feature);
      const compliantStandards: any[] = [];
      const nonCompliantStandards: any[] = [];

      for (const std of stdResult.rows) {
        const controls = (std.controls_json || []).filter(Boolean);
        const scored = controls
          .map((c: any) => ({ ...c, score: scoreControl(c, featureTokens) }))
          .sort((a: any, b: any) => b.score - a.score);

        const matched   = scored.filter((c: any) => c.score >= 30);
        const unmatched = scored.filter((c: any) => c.score < 30);
        const avgScore  = matched.length > 0
          ? Math.round(matched.reduce((s: number, c: any) => s + c.score, 0) / matched.length)
          : 0;
        const level = complianceLabel(avgScore);

        if (matched.length > 0) {
          compliantStandards.push({
            standardId:      std.id,
            standardName:    std.name,
            references:      matched.slice(0, 5).map((c: any) => c.ref_no),
            complianceLevel: level,
            matchedControls: matched.length,
            score:           avgScore,
            notes:           `${matched.length} kontrol eşleşti (ort. skor: ${avgScore})`,
          });
        } else {
          nonCompliantStandards.push({
            standardId:      std.id,
            standardName:    std.name,
            missingControls: unmatched.slice(0, 3).map((c: any) => c.ref_no),
            notes:           'Eşleşen kontrol bulunamadı',
          });
        }
      }

      const totalStds    = compliantStandards.length + nonCompliantStandards.length;
      const tamCnt       = compliantStandards.filter(s => s.complianceLevel === 'TAM').length;
      const kismiCnt     = compliantStandards.filter(s => s.complianceLevel === 'KISMI').length;
      // TAM eşleşmeler tam puan, KISMI yarım puan sayılır
      const weightedCompliant = tamCnt + kismiCnt * 0.5;

      return {
        feature,
        featureIndex:         idx + 1,
        compliantStandards,
        nonCompliantStandards,
        overallStatus:        overallStatus(weightedCompliant, totalStds),
        recommendation:       compliantStandards.length > 0
          ? `Bu özellik ${compliantStandards.map(s => s.standardName).join(', ')} standartlarıyla uyumlu.`
          : 'İlgili kontroller tanımlanmamış. Detaylı inceleme gerekebilir.',
      };
    });

    // ── Özet istatistikler ──────────────────────────────────────────────────────
    let fullyCompliant = 0, partiallyCompliant = 0, nonCompliant = 0;
    matrixRows.forEach((row: any) => {
      if (row.overallStatus.includes('✅'))       fullyCompliant++;
      else if (row.overallStatus.includes('⚠️')) partiallyCompliant++;
      else                                         nonCompliant++;
    });

    const result = {
      generatedAt: new Date().toISOString(),
      mode:        'keyword',
      features,
      matrix:      matrixRows,
      summary:     { totalFeatures: features.length, fullyCompliant, partiallyCompliant, nonCompliant },
    };

    await pool.query(
      'INSERT INTO matrix_cache (tenant_id, matrix_data, created_by_user_id) VALUES ($1, $2, $3)',
      [tenantId, JSON.stringify(result), req.user!.sub]
    );

    res.json(result);
  } catch (err: any) {
    console.error('[Regulation] Matrix error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /last-matrix ───────────────────────────────────────────────────────────
router.get('/last-matrix', async (req: Request, res: Response) => {
  const tenantId = req.tenantId || 1;
  try {
    const result = await pool.query(
      'SELECT matrix_data FROM matrix_cache WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 1',
      [tenantId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Henüz uyum matrisi oluşturulmamış' });
      return;
    }
    res.json(result.rows[0].matrix_data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /export/controls/:id ───────────────────────────────────────────────────
router.get('/export/controls/:id', async (req: Request, res: Response) => {
  const tenantId = req.tenantId || 1;
  const { id } = req.params;

  try {
    const stdResult = await pool.query(
      'SELECT * FROM standards WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );
    if (stdResult.rows.length === 0) {
      res.status(404).json({ error: 'Standart bulunamadı' });
      return;
    }

    const ctrlResult = await pool.query(
      'SELECT * FROM controls WHERE standard_id = $1 AND tenant_id = $2 ORDER BY ref_no',
      [id, tenantId]
    );

    const standard = { ...stdResult.rows[0], name: stdResult.rows[0].name, shortName: stdResult.rows[0].short_name };
    const controls = ctrlResult.rows.map(c => ({ ...c, refNo: c.ref_no }));

    const buf = await generateExcelDoc(standard, controls);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${id}-kontrol-listesi.xlsx"`);
    res.send(buf);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /export/matrix ─────────────────────────────────────────────────────────
router.get('/export/matrix', async (req: Request, res: Response) => {
  const tenantId = req.tenantId || 1;

  try {
    const result = await pool.query(
      'SELECT matrix_data FROM matrix_cache WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 1',
      [tenantId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Uyum matrisi bulunamadı' });
      return;
    }

    const data = result.rows[0].matrix_data;
    const XLSX = require('xlsx');
    const wb = XLSX.utils.book_new();

    const allStandards = new Set<string>();
    (data.matrix || []).forEach((item: any) => {
      (item.compliantStandards || []).forEach((s: any) => allStandards.add(s.standardId + '|' + s.standardName));
      (item.nonCompliantStandards || []).forEach((s: any) => allStandards.add(s.standardId + '|' + s.standardName));
    });
    const stdList = [...allStandards].map(s => ({ id: s.split('|')[0], name: s.split('|')[1] }));

    const headers = [null, '#', 'ÖZELLIK / KONTROL', 'GENEL DURUM', ...stdList.map(s => s.name), 'ÖNERİ'];
    const rows = [
      [null, 'UYUMLULUK MATRİSİ'],
      [null, `Oluşturma: ${new Date(data.generatedAt).toLocaleString('tr-TR')}`],
      [],
      headers,
    ];

    (data.matrix || []).forEach((item: any, i: number) => {
      const row: any[] = [null, i + 1, item.feature, item.overallStatus];
      stdList.forEach(std => {
        const compliant = (item.compliantStandards || []).find((s: any) => s.standardId === std.id);
        const nonCompliant = (item.nonCompliantStandards || []).find((s: any) => s.standardId === std.id);
        if (compliant) row.push(`${compliant.complianceLevel}\n${compliant.references.join(', ')}`);
        else if (nonCompliant) row.push(`EKSIK\n${(nonCompliant.missingControls || []).join(', ')}`);
        else row.push('—');
      });
      row.push(item.recommendation || '');
      rows.push(row);
    });

    rows.push([], [null, 'ÖZET']);
    rows.push([null, 'Tam Uyumlu', data.summary.fullyCompliant]);
    rows.push([null, 'Kısmen Uyumlu', data.summary.partiallyCompliant]);
    rows.push([null, 'Uyumsuz', data.summary.nonCompliant]);
    rows.push([null, 'TOPLAM', data.summary.totalFeatures]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const colWidths = [{ wch: 3 }, { wch: 5 }, { wch: 45 }, { wch: 20 }];
    stdList.forEach(() => colWidths.push({ wch: 25 }));
    colWidths.push({ wch: 40 });
    ws['!cols'] = colWidths;
    XLSX.utils.book_append_sheet(wb, ws, 'Uyum Matrisi');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Uyum-Matrisi.xlsx"');
    res.send(buf);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /export/policy-doc/:standardId/:refNo — tek politika indir ────────────
router.get('/export/policy-doc/:standardId/:refNo', async (req: Request, res: Response) => {
  const tenantId = req.tenantId || 1;
  const { standardId, refNo } = req.params;
  const decodedRef = decodeURIComponent(refNo);

  try {
    const stdResult = await pool.query(
      'SELECT * FROM standards WHERE id = $1 AND tenant_id = $2',
      [standardId, tenantId]
    );
    if (stdResult.rows.length === 0) { res.status(404).json({ error: 'Standart bulunamadı' }); return; }
    const standard = { ...stdResult.rows[0], shortName: stdResult.rows[0].short_name };

    const polResult = await pool.query(
      `SELECT p.*, pv.document, pv.version as ver_version, pv.created_at as ver_created_at, pv.created_by
       FROM policies p
       JOIN policy_versions pv ON pv.policy_id = p.id AND pv.version = p.current_version
       WHERE p.tenant_id = $1 AND p.standard_id = $2 AND p.ref_no = $3`,
      [tenantId, standardId, decodedRef]
    );

    if (polResult.rows.length === 0) {
      res.status(404).json({ error: 'Politika bulunamadı. Önce politikayı oluşturun.' });
      return;
    }

    const p = polResult.rows[0];
    const policies = [{
      ...p.document,
      refNo: p.ref_no,
      controlTitle: p.control_title,
      currentVersion: p.current_version,
      lastModifiedBy: p.last_modified_by,
      generatedAt: p.last_modified_at ? new Date(p.last_modified_at).toLocaleDateString('tr-TR') : null,
    }];

    const buf = await generateWordDoc(standard, policies);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${standardId}-${decodedRef.replace(/\./g,'-')}.docx"`);
    res.send(buf);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /export/policy-doc/:standardId ────────────────────────────────────────
router.get('/export/policy-doc/:standardId', async (req: Request, res: Response) => {
  const tenantId = req.tenantId || 1;
  const { standardId } = req.params;
  const format = (req.query.format as string) || 'html';

  try {
    const stdResult = await pool.query(
      'SELECT * FROM standards WHERE id = $1 AND tenant_id = $2',
      [standardId, tenantId]
    );
    if (stdResult.rows.length === 0) {
      res.status(404).json({ error: 'Standart bulunamadı' });
      return;
    }

    const standard = { ...stdResult.rows[0], shortName: stdResult.rows[0].short_name };

    // Get all policies with their latest version document
    const polResult = await pool.query(
      `SELECT p.*, pv.document, pv.version as ver_version, pv.created_at as ver_created_at, pv.created_by
       FROM policies p
       JOIN policy_versions pv ON pv.policy_id = p.id AND pv.version = p.current_version
       WHERE p.tenant_id = $1 AND p.standard_id = $2
       ORDER BY p.ref_no`,
      [tenantId, standardId]
    );

    if (polResult.rows.length === 0) {
      res.status(404).json({ error: 'Henüz hiç politika oluşturulmamış. Önce politikaları oluşturun.' });
      return;
    }

    const policies = polResult.rows.map(p => ({
      ...p.document,
      refNo: p.ref_no,
      controlTitle: p.control_title,
      currentVersion: p.current_version,
      lastModifiedBy: p.last_modified_by,
      generatedAt: p.last_modified_at ? new Date(p.last_modified_at).toLocaleDateString('tr-TR') : null,
    }));

    if (format === 'word') {
      const buf = await generateWordDoc(standard, policies);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${standardId}-politikalar.docx"`);
      res.send(buf);
      return;
    }

    if (format === 'pdf') {
      const buf = await generatePdfDoc(standard, policies);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${standardId}-politikalar.pdf"`);
      res.send(buf);
      return;
    }

    if (format === 'excel') {
      const ctrlResult = await pool.query(
        'SELECT * FROM controls WHERE standard_id = $1 AND tenant_id = $2',
        [standardId, tenantId]
      );
      const buf = await generateExcelDoc(standard, ctrlResult.rows);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${standardId}-politikalar.xlsx"`);
      res.send(buf);
      return;
    }

    // Default: HTML
    const html = buildPolicyHTML(standard, policies);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${standardId}-politika-prosedur.html"`);
    res.send(html);
  } catch (err: any) {
    console.error('[Regulation] Export policy-doc error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /cross-reference ───────────────────────────────────────────────────────
router.get('/cross-reference', async (req: Request, res: Response) => {
  const tenantId = req.tenantId || 1;
  try {
    const ctrlResult = await pool.query(
      `SELECT c.ref_no, c.title, c.category, c.keywords, c.type, c.priority,
              c.standard_id, s.short_name, s.icon, s.color
       FROM controls c
       JOIN standards s ON s.id = c.standard_id AND s.tenant_id = c.tenant_id
       WHERE c.tenant_id = $1`,
      [tenantId]
    );

    const controls = ctrlResult.rows.map(c => ({
      refNo: c.ref_no, title: c.title, category: c.category,
      keywords: c.keywords || [], type: c.type, priority: c.priority,
      standardId: c.standard_id, standardName: c.short_name,
      icon: c.icon, color: c.color,
    }));

    const result = TOPIC_TAXONOMY.map(topic => {
      const standardMatches: Record<string, any> = {};

      controls.forEach(c => {
        if (matchTopics(c).includes(topic.slug)) {
          if (!standardMatches[c.standardId]) {
            standardMatches[c.standardId] = {
              standardId: c.standardId, standardName: c.standardName,
              icon: c.icon, color: c.color, controlCount: 0, sampleControls: [],
            };
          }
          standardMatches[c.standardId].controlCount++;
          if (standardMatches[c.standardId].sampleControls.length < 3) {
            standardMatches[c.standardId].sampleControls.push({ refNo: c.refNo, title: c.title });
          }
        }
      });

      const standardList = Object.values(standardMatches).sort((a, b) => b.controlCount - a.controlCount);
      return {
        ...topic,
        standardCount: standardList.length,
        totalControls: standardList.reduce((s, m) => s + m.controlCount, 0),
        standards: standardList,
      };
    });

    res.json(result.sort((a, b) => b.standardCount - a.standardCount));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /cross-reference/:slug ─────────────────────────────────────────────────
router.get('/cross-reference/:slug', async (req: Request, res: Response) => {
  const topic = TOPIC_TAXONOMY.find(t => t.slug === req.params.slug);
  if (!topic) { res.status(404).json({ error: 'Konu bulunamadı' }); return; }

  const tenantId = req.tenantId || 1;
  try {
    const ctrlResult = await pool.query(
      `SELECT c.*, s.name as std_name, s.short_name, s.icon, s.color
       FROM controls c
       JOIN standards s ON s.id = c.standard_id AND s.tenant_id = c.tenant_id
       WHERE c.tenant_id = $1`,
      [tenantId]
    );

    const groups: Record<string, any> = {};
    ctrlResult.rows.forEach(c => {
      const ctrl = { refNo: c.ref_no, title: c.title, category: c.category, description: c.description || '', keywords: c.keywords || [], type: c.type, priority: c.priority };
      if (matchTopics(ctrl).includes(topic.slug)) {
        if (!groups[c.standard_id]) {
          groups[c.standard_id] = {
            standardId: c.standard_id, standardName: c.std_name,
            shortName: c.short_name, icon: c.icon, color: c.color, controls: [],
          };
        }
        groups[c.standard_id].controls.push(ctrl);
      }
    });

    const groupList = Object.values(groups).sort((a, b) => b.controls.length - a.controls.length);
    res.json({
      topic,
      standardCount: groupList.length,
      totalControls: groupList.reduce((s, g) => s + g.controls.length, 0),
      standards: groupList,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /domains ────────────────────────────────────────────────────────────────
router.get('/domains', async (req: Request, res: Response) => {
  const tenantId = req.tenantId || 1;
  try {
    const domainResult = await pool.query(
      'SELECT * FROM industry_domains WHERE tenant_id = $1 ORDER BY sort_order',
      [tenantId]
    );

    const stdResult = await pool.query(
      'SELECT id, name, short_name, icon, color, control_count FROM standards WHERE tenant_id = $1',
      [tenantId]
    );
    const stdMap: Record<string, any> = {};
    stdResult.rows.forEach(s => {
      stdMap[s.id] = { id: s.id, name: s.name, shortName: s.short_name, icon: s.icon, color: s.color, controlCount: s.control_count };
    });

    const result = domainResult.rows.map(d => ({
      id: d.id,
      name: d.name,
      icon: d.icon,
      color: d.color,
      description: d.description,
      primaryStandards: (d.primary_standards || []).map((id: string) => stdMap[id]).filter(Boolean),
      supportingStandards: (d.supporting_standards || []).map((id: string) => stdMap[id]).filter(Boolean),
    }));

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /policy/template ──────────────────────────────────────────────────────
router.post('/policy/template', async (req: Request, res: Response) => {
  const { standardId, refNo, controlTitle, controlDescription, category, useAI, docType } = req.body;
  if (!standardId || !refNo) { res.status(400).json({ error: 'Eksik alan' }); return; }

  if (useAI && process.env.ANTHROPIC_API_KEY) {
    const prompt = `Sen deneyimli bir BT uyum uzmanısın. "${controlTitle}" (${refNo}) kontrolü için kapsamlı bir politika ve prosedür dokümanı hazırla.
Standart: ${standardId.toUpperCase()} | Kategori: ${category || ''} | Açıklama: ${controlDescription || ''}
YALNIZCA geçerli JSON döndür:
{"documentTitle":"...","purpose":"...","scope":"...","policyStatement":"... (paragraflar \\n ile ayrılsın)","procedures":[{"stepNo":1,"title":"...","description":"...","responsible":"...","inputs":["..."],"outputs":["..."]}],"responsibilities":[{"role":"...","duties":"..."}],"measurementCriteria":["..."],"relatedDocuments":["..."],"exceptions":"...","compliance":"...","reviewPeriod":"Yıllık"}`;
    try {
      const msg = await anthropic.messages.create({
        model: 'claude-opus-4-6', max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      });
      const match = msg.content[0].text.trim().match(/\{[\s\S]*\}/);
      if (!match) throw new Error('Geçersiz JSON');
      return res.json({ document: JSON.parse(match[0]), source: 'ai' });
    } catch (e: any) {
      console.error('[Policy] Template AI error:', e.message);
    }
  }

  const docTypeVal = docType || 'policy';
  const document = buildTemplateForType(docTypeVal, controlTitle, controlDescription, category);
  res.json({ document, source: 'default' });
});

// ── POST /policy/save ──────────────────────────────────────────────────────────
router.post('/policy/save', requireAuth, async (req: Request, res: Response) => {
  const { standardId, refNo, controlTitle, document, note, docType } = req.body;
  const docTypeVal = ['policy','procedure','checklist','raci','revision'].includes(docType) ? docType : 'policy';
  if (!standardId || !refNo || !document) {
    res.status(400).json({ error: 'standardId, refNo ve document zorunlu' });
    return;
  }

  const tenantId = req.tenantId!;
  const author = req.user!.fullName;
  const userId = req.user!.sub;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Upsert policy
    const existingResult = await client.query(
      'SELECT id, current_version FROM policies WHERE tenant_id = $1 AND standard_id = $2 AND ref_no = $3 AND doc_type = $4',
      [tenantId, standardId, refNo, docTypeVal]
    );

    let policyId: number;
    let newVersion: string;

    // Compute next_review_date from document
    const reviewPeriod: string = (document as any)?.reviewPeriod || '';
    const explicitDate: string = (document as any)?.nextReviewDate || '';
    let nextReviewDate: string | null = null;
    if (explicitDate) {
      nextReviewDate = explicitDate;
    } else if (reviewPeriod) {
      const monthMap: Record<string, number> = { 'Yıllık': 12, '6 Aylık': 6, '2 Yıllık': 24, '3 Yıllık': 36 };
      const months = monthMap[reviewPeriod];
      if (months) {
        const d = new Date();
        d.setMonth(d.getMonth() + months);
        nextReviewDate = d.toISOString().split('T')[0];
      }
    }

    if (existingResult.rows.length === 0) {
      newVersion = '1.0';
      const insertResult = await client.query(
        `INSERT INTO policies (tenant_id, standard_id, ref_no, control_title, current_version, last_modified_by, last_modified_at, doc_type, next_review_date)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, $8)
         RETURNING id`,
        [tenantId, standardId, refNo, controlTitle || '', newVersion, author, docTypeVal, nextReviewDate]
      );
      policyId = insertResult.rows[0].id;
    } else {
      const existing = existingResult.rows[0];
      policyId = existing.id;
      newVersion = bumpVersion(existing.current_version);
      await client.query(
        `UPDATE policies SET current_version = $1, last_modified_by = $2, last_modified_at = NOW(),
         control_title = $3, next_review_date = COALESCE($5, next_review_date) WHERE id = $4`,
        [newVersion, author, controlTitle || existing.control_title, policyId, nextReviewDate]
      );
    }

    // Insert policy version
    await client.query(
      `INSERT INTO policy_versions (policy_id, version, created_by, created_by_user_id, note, document)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (policy_id, version) DO UPDATE SET
         document = EXCLUDED.document, created_by = EXCLUDED.created_by`,
      [policyId, newVersion, author, userId, note || '', JSON.stringify(document)]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      version: newVersion,
      docType: docTypeVal,
      policy: {
        id: policyId, tenantId, standardId, refNo,
        controlTitle, currentVersion: newVersion, lastModifiedBy: author, docType: docTypeVal,
      },
    });
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('[Policy] Save error:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ── POST /policy/generate ──────────────────────────────────────────────────────
router.post('/policy/generate', requireAuth, async (req: Request, res: Response) => {
  const { standardId, refNo, controlTitle, controlDescription, category } = req.body;
  if (!standardId || !refNo) { res.status(400).json({ error: 'standardId ve refNo zorunlu' }); return; }
  if (!process.env.ANTHROPIC_API_KEY) { res.status(503).json({ error: 'ANTHROPIC_API_KEY yapılandırılmamış' }); return; }

  const tenantId = req.tenantId!;
  const author = req.user!.fullName;
  const userId = req.user!.sub;

  try {
    // Check if already exists
    const existing = await pool.query(
      `SELECT p.*, pv.document FROM policies p
       JOIN policy_versions pv ON pv.policy_id = p.id AND pv.version = p.current_version
       WHERE p.tenant_id = $1 AND p.standard_id = $2 AND p.ref_no = $3`,
      [tenantId, standardId, refNo]
    );

    if (existing.rows.length > 0) {
      const p = existing.rows[0];
      res.json({
        standardId: p.standard_id, refNo: p.ref_no,
        controlTitle: p.control_title, currentVersion: p.current_version,
        lastModifiedBy: p.last_modified_by, cached: true,
        versions: [{ version: p.current_version, document: p.document }],
      });
      return;
    }

    // Generate with AI
    let docData: any;
    let source = 'default';
    const prompt = `Sen deneyimli bir BT uyum uzmanısın. "${controlTitle}" (${refNo}) kontrolü için kapsamlı politika hazırla. Standart: ${standardId.toUpperCase()} | Açıklama: ${controlDescription || ''}
YALNIZCA geçerli JSON: {"documentTitle":"...","purpose":"...","scope":"...","policyStatement":"...","procedures":[{"stepNo":1,"title":"...","description":"...","responsible":"...","inputs":["..."],"outputs":["..."]}],"responsibilities":[{"role":"...","duties":"..."}],"measurementCriteria":["..."],"relatedDocuments":["..."],"exceptions":"...","compliance":"...","reviewPeriod":"Yıllık"}`;

    try {
      const msg = await anthropic.messages.create({
        model: 'claude-opus-4-6', max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      });
      const match = msg.content[0].text.trim().match(/\{[\s\S]*\}/);
      if (match) { docData = JSON.parse(match[0]); source = 'ai'; }
      else throw new Error('No JSON');
    } catch {
      docData = buildDefaultTemplate({ title: controlTitle, description: controlDescription, category });
    }

    // Save
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const insertResult = await client.query(
        `INSERT INTO policies (tenant_id, standard_id, ref_no, control_title, current_version, last_modified_by, last_modified_at)
         VALUES ($1, $2, $3, $4, '1.0', $5, NOW()) RETURNING id`,
        [tenantId, standardId, refNo, controlTitle || '', `Sistem (${source === 'ai' ? 'Claude AI' : 'Varsayılan'})`]
      );
      const policyId = insertResult.rows[0].id;
      await client.query(
        `INSERT INTO policy_versions (policy_id, version, created_by, created_by_user_id, note, document)
         VALUES ($1, '1.0', $2, $3, $4, $5)`,
        [policyId, author, userId, `${source === 'ai' ? 'Claude AI' : 'Varsayılan'} şablon ile otomatik oluşturuldu`, JSON.stringify(docData)]
      );
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    res.json({
      standardId, refNo, controlTitle, currentVersion: '1.0',
      lastModifiedBy: author,
      versions: [{ version: '1.0', document: docData }],
    });
  } catch (err: any) {
    console.error('[Policy] Generate error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /policy/status/:standardId ────────────────────────────────────────────
router.get('/policy/status/:standardId', async (req: Request, res: Response) => {
  const tenantId = req.tenantId || 1;
  try {
    const totalResult = await pool.query(
      'SELECT COUNT(*) FROM controls WHERE standard_id = $1 AND tenant_id = $2',
      [req.params.standardId, tenantId]
    );
    const genResult = await pool.query(
      'SELECT COUNT(*) FROM policies WHERE standard_id = $1 AND tenant_id = $2',
      [req.params.standardId, tenantId]
    );
    res.json({
      total: parseInt(totalResult.rows[0].count),
      generated: parseInt(genResult.rows[0].count),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /policy/:standardId/:refNo ─────────────────────────────────────────────
router.get('/policy/:standardId/:refNo', async (req: Request, res: Response) => {
  const tenantId = req.tenantId || 1;
  const refNo = decodeURIComponent(req.params.refNo);

  try {
    const result = await pool.query(`
      SELECT p.id, p.doc_type, p.current_version, p.last_modified_by, p.last_modified_at,
             COALESCE(
               json_agg(
                 json_build_object(
                   'version', pv.version,
                   'createdAt', pv.created_at,
                   'createdBy', pv.created_by,
                   'note', pv.note,
                   'document', pv.document
                 ) ORDER BY pv.created_at DESC
               ) FILTER (WHERE pv.id IS NOT NULL),
               '[]'::json
             ) as versions
      FROM policies p
      LEFT JOIN policy_versions pv ON pv.policy_id = p.id
      WHERE p.tenant_id = $1 AND p.standard_id = $2 AND p.ref_no = $3
      GROUP BY p.id, p.doc_type, p.current_version, p.last_modified_by, p.last_modified_at
    `, [tenantId, req.params.standardId, refNo]);

    const docs: Record<string, any> = {
      policy: null, procedure: null, checklist: null, raci: null, revision: null,
    };

    for (const row of result.rows) {
      const key = row.doc_type as string;
      if (Object.prototype.hasOwnProperty.call(docs, key)) {
        docs[key] = {
          id: row.id,
          docType: key,
          currentVersion: row.current_version,
          lastModifiedBy: row.last_modified_by,
          lastModifiedAt: row.last_modified_at,
          versions: row.versions || [],
        };
      }
    }

    // Backward compatibility — expose top-level fields from 'policy' doc
    const leg = docs.policy;
    res.json({
      ...docs,
      standardId: req.params.standardId,
      refNo,
      controlTitle: leg?.versions?.[0]?.document?.documentTitle,
      currentVersion: leg?.currentVersion,
      lastModifiedBy: leg?.lastModifiedBy,
      lastModifiedAt: leg?.lastModifiedAt,
      versions: leg?.versions || [],
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Policy Files ──────────────────────────────────────────────────────────────
router.post('/policy/files/upload', uploadPolicyFile.single('file'), async (req: Request, res: Response) => {
  const tenantId = req.tenantId || 1;
  const { standardId, refNo, note, uploadedBy } = req.body;
  if (!req.file) { res.status(400).json({ error: 'Dosya bulunamadı' }); return; }
  if (!standardId || !refNo) { res.status(400).json({ error: 'standardId ve refNo zorunlu' }); return; }
  try {
    const result = await pool.query(
      `INSERT INTO policy_files (tenant_id, standard_id, ref_no, filename, stored_name, mimetype, file_size, uploaded_by, note)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [tenantId, standardId, refNo, req.file.originalname, req.file.filename, req.file.mimetype, req.file.size, uploadedBy || 'Sistem', note || '']
    );
    res.json({ success: true, file: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/policy/files/download/:fileId', async (req: Request, res: Response) => {
  const tenantId = req.tenantId || 1;
  try {
    const result = await pool.query(
      'SELECT * FROM policy_files WHERE id=$1 AND tenant_id=$2',
      [req.params.fileId, tenantId]
    );
    if (result.rows.length === 0) { res.status(404).json({ error: 'Dosya bulunamadı' }); return; }
    const file = result.rows[0];
    const filePath = path.join(POLICY_FILES_DIR, file.stored_name);
    if (!fs.existsSync(filePath)) { res.status(404).json({ error: 'Dosya diskten silinmiş' }); return; }
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.filename)}"`);
    res.setHeader('Content-Type', file.mimetype || 'application/octet-stream');
    res.sendFile(filePath);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/policy/files/:standardId/:refNo', async (req: Request, res: Response) => {
  const tenantId = req.tenantId || 1;
  const { standardId, refNo } = req.params;
  try {
    const result = await pool.query(
      `SELECT id, filename, mimetype, file_size, uploaded_by, note, uploaded_at
       FROM policy_files WHERE tenant_id=$1 AND standard_id=$2 AND ref_no=$3 ORDER BY uploaded_at DESC`,
      [tenantId, standardId, decodeURIComponent(refNo)]
    );
    res.json({ files: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/policy/files/:fileId', async (req: Request, res: Response) => {
  const tenantId = req.tenantId || 1;
  try {
    const result = await pool.query(
      'DELETE FROM policy_files WHERE id=$1 AND tenant_id=$2 RETURNING stored_name',
      [req.params.fileId, tenantId]
    );
    if (result.rows.length === 0) { res.status(404).json({ error: 'Dosya bulunamadı' }); return; }
    const filePath = path.join(POLICY_FILES_DIR, result.rows[0].stored_name);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ── CONTROL COMPLETIONS ───────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

// GET /controls/completion/:standardId — fetch all completion statuses
router.get('/controls/completion/:standardId', requireAuth, async (req: Request, res: Response) => {
  const tenantId = req.tenantId || 1;
  try {
    const result = await pool.query(
      `SELECT ref_no, is_completed, completed_at, completed_by, notes
       FROM control_completions
       WHERE tenant_id = $1 AND standard_id::varchar = $2`,
      [tenantId, req.params.standardId]
    );
    const map: Record<string, any> = {};
    for (const row of result.rows) {
      map[row.ref_no] = {
        isCompleted: row.is_completed,
        completedAt: row.completed_at,
        completedBy: row.completed_by,
        notes: row.notes,
      };
    }
    res.json({ completions: map });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /controls/completion — upsert single control completion
router.patch('/controls/completion', requireAuth, async (req: Request, res: Response) => {
  const tenantId = req.tenantId || 1;
  const { standardId, refNo, isCompleted, notes } = req.body;
  if (!standardId || !refNo) { res.status(400).json({ error: 'standardId ve refNo zorunlu' }); return; }
  const completedBy = req.user!.fullName;
  try {
    const result = await pool.query(
      `INSERT INTO control_completions (tenant_id, standard_id, ref_no, is_completed, completed_at, completed_by, notes, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       ON CONFLICT (tenant_id, standard_id, ref_no)
       DO UPDATE SET is_completed = $4, completed_at = $5, completed_by = $6, notes = $7, updated_at = NOW()
       RETURNING *`,
      [tenantId, standardId, refNo, isCompleted, isCompleted ? new Date() : null, completedBy, notes || '']
    );
    res.json({ success: true, completion: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /report/completion — full completion report (all standards)
router.get('/report/completion', requireAuth, async (req: Request, res: Response) => {
  const tenantId = req.tenantId || 1;
  try {
    // Get all standards with controls
    const stdsResult = await pool.query(
      `SELECT s.id, s.name, s.short_name, s.icon, s.color,
              COUNT(c.id) AS total_controls
       FROM standards s
       LEFT JOIN controls c ON c.standard_id = s.id AND c.tenant_id = $1
       WHERE s.tenant_id = $1
       GROUP BY s.id, s.name, s.short_name, s.icon, s.color ORDER BY s.name`,
      [tenantId]
    );

    // Get all completions
    const compResult = await pool.query(
      `SELECT standard_id, ref_no, is_completed, completed_at, completed_by
       FROM control_completions
       WHERE tenant_id = $1`,
      [tenantId]
    );

    // Group completions by standard
    const compMap: Record<number, { completed: number; total: number; items: any[] }> = {};
    for (const row of compResult.rows) {
      if (!compMap[row.standard_id]) compMap[row.standard_id] = { completed: 0, total: 0, items: [] };
      compMap[row.standard_id].items.push(row);
      if (row.is_completed) compMap[row.standard_id].completed++;
    }

    const standards = stdsResult.rows.map((s: any) => {
      const comp = compMap[s.id] || { completed: 0, total: 0, items: [] };
      const total = parseInt(s.total_controls) || 0;
      return {
        id: s.id,
        name: s.name,
        shortName: s.short_name,
        icon: s.icon,
        color: s.color,
        totalControls: total,
        completedControls: comp.completed,
        rate: total > 0 ? Math.round((comp.completed / total) * 100) : 0,
      };
    });

    // Get all controls with their completion status
    const ctrlResult = await pool.query(
      `SELECT c.standard_id, c.ref_no, c.title, c.category, c.type, c.priority,
              cc.is_completed, cc.completed_at, cc.completed_by
       FROM controls c
       LEFT JOIN control_completions cc ON cc.tenant_id = $1
         AND cc.standard_id::varchar = c.standard_id
         AND cc.ref_no = c.ref_no
       WHERE c.tenant_id = $1
       ORDER BY c.standard_id, c.ref_no`,
      [tenantId]
    );

    const totalControls = ctrlResult.rowCount || 0;
    const totalCompleted = ctrlResult.rows.filter((r: any) => r.is_completed).length;

    res.json({
      summary: { totalControls, totalCompleted, totalIncomplete: totalControls - totalCompleted, rate: totalControls > 0 ? Math.round((totalCompleted / totalControls) * 100) : 0 },
      standards,
      controls: ctrlResult.rows,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ── UPCOMING REVIEWS (ALERTS) ────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

// GET /alerts/upcoming — policies with review dates approaching (30/60/90 days) or overdue
router.get('/alerts/upcoming', requireAuth, async (req: Request, res: Response) => {
  const tenantId = req.tenantId || 1;
  try {
    const result = await pool.query(
      `SELECT p.id, p.standard_id, p.ref_no, p.control_title, p.doc_type,
              p.current_version, p.last_modified_by, p.last_modified_at, p.next_review_date,
              s.name AS standard_name, s.icon AS standard_icon,
              pv.document
       FROM policies p
       JOIN standards s ON s.id = p.standard_id AND s.tenant_id = $1
       LEFT JOIN policy_versions pv ON pv.policy_id = p.id AND pv.version = p.current_version
       WHERE p.tenant_id = $1
         AND p.next_review_date IS NOT NULL
         AND p.next_review_date <= CURRENT_DATE + INTERVAL '90 days'
       ORDER BY p.next_review_date ASC`,
      [tenantId]
    );

    const today = new Date();
    const alerts = result.rows.map((row: any) => {
      const reviewDate = new Date(row.next_review_date);
      const daysUntil = Math.ceil((reviewDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      let urgency: 'overdue' | 'critical' | 'warning' | 'info';
      if (daysUntil < 0)  urgency = 'overdue';
      else if (daysUntil <= 7)  urgency = 'critical';
      else if (daysUntil <= 30) urgency = 'warning';
      else urgency = 'info';
      return {
        id: row.id,
        standardId: row.standard_id,
        standardName: row.standard_name,
        standardIcon: row.standard_icon,
        refNo: row.ref_no,
        controlTitle: row.control_title,
        docType: row.doc_type,
        currentVersion: row.current_version,
        lastModifiedBy: row.last_modified_by,
        nextReviewDate: row.next_review_date,
        daysUntil,
        urgency,
      };
    });

    const overdue  = alerts.filter((a: any) => a.urgency === 'overdue').length;
    const critical = alerts.filter((a: any) => a.urgency === 'critical').length;
    const warning  = alerts.filter((a: any) => a.urgency === 'warning').length;

    res.json({ alerts, summary: { overdue, critical, warning, total: alerts.length } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
