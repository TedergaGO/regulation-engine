'use strict';

const express = require('express');
const router  = express.Router();
const path    = require('path');
const fs      = require('fs');
const multer  = require('multer');
const XLSX    = require('xlsx');
const Anthropic = require('@anthropic-ai/sdk');

// ── Paths ───────────────────────────────────────────────────────────────────
const DATA_DIR     = path.join(__dirname, '..', 'data', 'regulation');
const CONTROLS_DIR = path.join(DATA_DIR, 'controls');
const UPLOADS_DIR  = path.join(__dirname, '..', 'uploads', 'regulation');
const META_FILE    = path.join(DATA_DIR, 'standards-meta.json');
const MATRIX_FILE  = path.join(DATA_DIR, 'last-matrix.json');
const DOMAINS_FILE   = path.join(DATA_DIR, 'industry-domains.json');
const POLICIES_DIR   = path.join(DATA_DIR, 'policies');
if (!fs.existsSync(POLICIES_DIR)) fs.mkdirSync(POLICIES_DIR, { recursive: true });

// ── Topic Taxonomy ────────────────────────────────────────────────────────────
const TOPIC_TAXONOMY = [
  { slug: 'incident-response',       name: 'Olay Müdahalesi',              icon: '🚨', color: '#E74C3C',
    keywords: ['incident', 'olay müdahale', 'olay yönetimi', 'csirt', 'isirt', 'containment', 'kontrol altına', 'siber olay', 'müdahale ekibi', 'post-incident', 'pir', 'playbook', 'runbook', 'müdahale planı'] },
  { slug: 'access-control',          name: 'Erişim Kontrolü',              icon: '🔐', color: '#8E44AD',
    keywords: ['erişim kontrolü', 'access control', 'rbac', 'least privilege', 'yetkilendirme', 'authorization', 'privilege', 'idor', 'erişim yönetimi', 'erişim kısıtlama'] },
  { slug: 'identity-authentication', name: 'Kimlik Doğrulama & IAM',       icon: '👤', color: '#2980B9',
    keywords: ['kimlik doğrulama', 'authentication', 'mfa', 'oturum', 'session', 'iam', 'sso', 'parola', 'password', 'brute force', 'bcrypt', 'argon2', 'kullanıcı kaydı', 'hesap yönetimi'] },
  { slug: 'cryptography',            name: 'Kriptografi & Şifreleme',      icon: '🔒', color: '#16A085',
    keywords: ['kriptografi', 'şifreleme', 'encryption', 'tls', 'aes', 'ssl', 'hsts', 'sertifika', 'certificate', 'kriptografik', 'https', 'transit şifreleme'] },
  { slug: 'vulnerability-management',name: 'Zafiyet & Yama Yönetimi',     icon: '🛠️', color: '#E67E22',
    keywords: ['zafiyet', 'vulnerability', 'patch', 'cve', 'sca', 'sbom', 'güncelleme', 'update', 'tarama', 'scan', 'zafiyete', 'yama', 'güvenlik açığı'] },
  { slug: 'risk-management',         name: 'Risk Yönetimi',                icon: '📊', color: '#D35400',
    keywords: ['risk yönetimi', 'risk management', 'risk değerlendirme', 'risk analizi', 'tehdit modelleme', 'stride', 'risk azaltma', 'risk fırsatlar', 'it risk'] },
  { slug: 'business-continuity',     name: 'İş Sürekliliği & DR',          icon: '♻️', color: '#27AE60',
    keywords: ['iş sürekliliği', 'business continuity', 'bcp', 'drp', 'rto', 'rpo', 'felaket kurtarma', 'disaster recovery', 'hizmet sürekliliği', 'kurtarma', 'yedekleme', 'backup'] },
  { slug: 'asset-management',        name: 'Varlık & Envanter Yönetimi',   icon: '🗃️', color: '#7F8C8D',
    keywords: ['varlık yönetimi', 'asset management', 'cmdb', 'envanter', 'inventory', 'yapılandırma yönetimi', 'configuration item', 'ci ', 'varlık envanteri'] },
  { slug: 'supply-chain',            name: 'Tedarik Zinciri & 3. Taraf',   icon: '🔗', color: '#6D4C41',
    keywords: ['tedarik zinciri', 'supply chain', 'üçüncü taraf', 'third party', 'tedarikçi', 'vendor', 'tpsp', 'ortak yönetimi', 'hizmet sağlayıcı'] },
  { slug: 'data-protection',         name: 'Veri Koruma & Gizlilik',       icon: '🔏', color: '#C0392B',
    keywords: ['veri koruma', 'data protection', 'kvkk', 'gdpr', 'kişisel veri', 'personal data', 'gizlilik', 'privacy', 'dpia', 'dpo', 'verbis', 'veri ihlali'] },
  { slug: 'network-security',        name: 'Ağ Güvenliği',                 icon: '🌐', color: '#2471A3',
    keywords: ['ağ güvenliği', 'network security', 'firewall', 'ids', 'ips', 'ndr', 'netflow', 'segmentation', 'ağ izleme', 'ağ yönetimi', 'network slicing', 'ağ altyapı'] },
  { slug: 'logging-monitoring',      name: 'Loglama, İzleme & SIEM',       icon: '📡', color: '#1ABC9C',
    keywords: ['log', 'logging', 'siem', 'izleme', 'monitoring', 'audit log', 'ueba', 'anomali', 'anomaly', 'denetim günlüğü', 'merkezi log', 'performans izleme'] },
  { slug: 'change-management',       name: 'Değişiklik & Release Yönetimi',icon: '🔄', color: '#9B59B6',
    keywords: ['değişiklik yönetimi', 'change management', 'cab', 'rfc', 'release', 'deployment', 'ci/cd', 'üretim geçişi', 'yayın yönetimi'] },
  { slug: 'security-awareness',      name: 'Güvenlik Farkındalığı & Eğitim',icon: '📚', color: '#F39C12',
    keywords: ['güvenlik farkındalığı', 'security awareness', 'eğitim', 'training', 'phishing', 'sosyal mühendislik', 'social engineering', 'farkındalık', 'phishing simülasyonu'] },
  { slug: 'application-security',    name: 'Uygulama Güvenliği',           icon: '🕷️', color: '#922B21',
    keywords: ['uygulama güvenliği', 'application security', 'owasp', 'sast', 'dast', 'sdlc', 'sql injection', 'xss', 'enjeksiyon', 'ssrf', 'input validation', 'sanitizasyon', 'girdi doğrulama'] },
  { slug: 'cloud-security',          name: 'Bulut Güvenliği',              icon: '☁️', color: '#2980B9',
    keywords: ['bulut güvenliği', 'cloud security', 'cloud', 'saas', 'paas', 'iaas', 'çoklu kiracı', 'cloud provider', 'cloud risk', 'veri konumu'] },
  { slug: 'governance-compliance',   name: 'Yönetişim & Uyum',             icon: '🏛️', color: '#566573',
    keywords: ['yönetişim', 'governance', 'uyum', 'compliance', 'politika', 'policy', 'liderlik', 'üst yönetim', 'yönetim organı', 'sorumluluk', 'denetim komitesi'] },
  { slug: 'data-classification',     name: 'Veri Sınıflandırma & DLP',     icon: '🏷️', color: '#B7950B',
    keywords: ['veri sınıflandırma', 'data classification', 'dlp', 'veri kaybı', 'hassas veri', 'sensitive data', 'veri etiketleme', 'veri envanteri', 'pseudonimizasyon'] },
  { slug: 'physical-security',       name: 'Fiziksel Güvenlik',            icon: '🏢', color: '#784212',
    keywords: ['fiziksel güvenlik', 'physical security', 'veri merkezi', 'data center', 'ortam güvenliği', 'fiziksel erişim', 'temiz masa', 'clean desk'] },
  { slug: 'security-testing',        name: 'Güvenlik Testi & Sızma Testi', icon: '🎯', color: '#7B241C',
    keywords: ['sızma testi', 'penetrasyon', 'pentest', 'kırmızı takım', 'red team', 'tlpt', 'güvenlik testi', 'security test', 'dayanıklılık testi', 'tablotop'] },
];

function matchTopics(control) {
  const text = [
    control.title || '',
    control.category || '',
    ...(control.keywords || []),
  ].join(' ').toLowerCase();

  return TOPIC_TAXONOMY.filter(topic =>
    topic.keywords.some(kw => text.includes(kw.toLowerCase()))
  ).map(t => t.slug);
}

// ── Anthropic Client ─────────────────────────────────────────────────────────
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' });

// ── Multer ───────────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// ── Helpers ──────────────────────────────────────────────────────────────────
function readJson(filePath, fallback = null) {
  try { return JSON.parse(fs.readFileSync(filePath, 'utf8')); }
  catch { return fallback; }
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function getMeta() {
  return readJson(META_FILE, []);
}

function getControls(standardId) {
  const file = path.join(CONTROLS_DIR, `${standardId}.json`);
  return readJson(file, null);
}

function saveControls(standardId, data) {
  const file = path.join(CONTROLS_DIR, `${standardId}.json`);
  writeJson(file, data);
}

// Parse uploaded document text
async function extractTextFromFile(filePath, mimetype) {
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

// ── GET /api/regulation/standards ───────────────────────────────────────────
router.get('/standards', (req, res) => {
  const meta = getMeta();
  const standards = meta.map(s => {
    const controls = getControls(s.id);
    return {
      ...s,
      controlCount: controls ? controls.controls.length : s.controlCount,
      hasControls: !!controls,
      generatedAt: controls ? controls.generatedAt : null,
    };
  });
  res.json(standards);
});

// ── GET /api/regulation/standards/:id ────────────────────────────────────────
router.get('/standards/:id', (req, res) => {
  const meta = getMeta();
  const s = meta.find(m => m.id === req.params.id);
  if (!s) return res.status(404).json({ error: 'Standard bulunamadı' });
  const controls = getControls(s.id);
  res.json({ ...s, controls: controls ? controls.controls : [], hasControls: !!controls });
});

// ── GET /api/regulation/standards/:id/controls ───────────────────────────────
router.get('/standards/:id/controls', (req, res) => {
  const { category, priority, type, q } = req.query;
  const data = getControls(req.params.id);
  if (!data) return res.status(404).json({ error: 'Kontrol listesi henüz oluşturulmamış' });

  let controls = data.controls;

  if (category) controls = controls.filter(c => c.category === category);
  if (priority)  controls = controls.filter(c => c.priority.includes(priority));
  if (type)      controls = controls.filter(c => c.type === type);
  if (q) {
    const ql = q.toLowerCase();
    controls = controls.filter(c =>
      c.title.toLowerCase().includes(ql) ||
      c.description.toLowerCase().includes(ql) ||
      c.refNo.toLowerCase().includes(ql)
    );
  }

  res.json({ standardId: req.params.id, total: controls.length, controls });
});

// ── POST /api/regulation/standards/upload ───────────────────────────────────
// Upload a new standard document → Claude parses → creates control list
router.post('/standards/upload', upload.single('document'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Dosya yüklenmedi' });

  const { standardName, standardId, version, category } = req.body;
  if (!standardName || !standardId) {
    return res.status(400).json({ error: 'standardName ve standardId zorunludur' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: 'ANTHROPIC_API_KEY yapılandırılmamış' });
  }

  try {
    const text = await extractTextFromFile(req.file.path, req.file.mimetype);
    if (!text || text.length < 100) {
      return res.status(400).json({ error: 'Dosya içeriği okunamadı veya çok kısa' });
    }

    const truncated = text.slice(0, 60000); // Claude token limiti

    const prompt = `Aşağıda "${standardName}" standardının tam metni verilmiştir.

Bu metni analiz ederek kapsamlı bir kontrol listesi oluştur.
Her kontrol için şu alanları doldur:

- refNo: Standardın orijinal referans numarası (örn: "ISO27001-A.5.1", "REQ 1.1", "EDM01")
- category: Ana kategori/bölüm adı (Türkçe)
- title: Kontrol başlığı (Türkçe - kısa, net)
- description: Kontrol açıklaması (Türkçe - ne yapılması gerektiğini açıkla, 1-3 cümle)
- type: "ZORUNLU" veya "TAVSİYE"
- priority: "🔴 KRİTİK", "🟠 YÜKSEK", "🟡 ORTA" veya "🟢 DÜŞÜK"
- keywords: Arama için anahtar kelimeler dizisi (5-10 kelime, Türkçe/İngilizce)

Yanıtı SADECE geçerli JSON formatında ver, başka metin ekleme:
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
    saveControls(standardId, parsed);

    // Meta'ya ekle (yoksa)
    const meta = getMeta();
    if (!meta.find(m => m.id === standardId)) {
      meta.push({
        id: standardId,
        name: standardName,
        shortName: standardName.split(' ').slice(0, 2).join(' '),
        category: category || 'Diğer',
        version: version || '—',
        publishedBy: 'Yüklendi',
        description: `${standardName} — doküman yüklenerek oluşturuldu.`,
        refFormat: '—',
        controlCount: parsed.controls.length,
        status: 'UPLOADED',
        color: '#555555',
        icon: '📋',
      });
      writeJson(META_FILE, meta);
    }

    res.json({
      success: true,
      standardId,
      controlCount: parsed.controls.length,
      message: `${parsed.controls.length} kontrol başarıyla oluşturuldu`,
    });
  } catch (err) {
    console.error('[Regulation] Upload error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/regulation/compliance-matrix ───────────────────────────────────
// Input: product features → Output: compliance matrix
router.post('/compliance-matrix', async (req, res) => {
  const { features, selectedStandards } = req.body;

  if (!features || !Array.isArray(features) || features.length === 0) {
    return res.status(400).json({ error: '"features" dizisi zorunludur' });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: 'ANTHROPIC_API_KEY yapılandırılmamış' });
  }

  // Load controls for selected standards
  const meta = getMeta();
  const standards = (selectedStandards && selectedStandards.length > 0
    ? meta.filter(m => selectedStandards.includes(m.id))
    : meta
  ).filter(m => !!getControls(m.id));

  if (standards.length === 0) {
    return res.status(400).json({ error: 'Seçili standartlar için kontrol listesi bulunamadı' });
  }

  // Build concise controls summary for prompt
  const standardsSummary = standards.map(s => {
    const data = getControls(s.id);
    const topControls = data.controls.slice(0, 80).map(c =>
      `${c.refNo}: ${c.title} [${c.category}] — keywords: ${c.keywords.join(', ')}`
    ).join('\n');
    return `## ${s.name} (${s.id})\n${topControls}`;
  }).join('\n\n---\n\n');

  const featuresText = features.map((f, i) => `${i + 1}. ${f}`).join('\n');

  const prompt = `Bir ürünün/sistemin özellikleri ile BT güvenlik ve uyum standartları arasında kapsamlı bir UYUMluluk MATRİSİ oluştur.

## ÜRÜN ÖZELLİKLERİ:
${featuresText}

## MEVCUT STANDARTLAR VE KONTROLLERİ:
${standardsSummary}

Her özellik için:
1. Hangi standartların hangi kontrolleriyle uyumlu olduğunu belirle
2. Uyum seviyesini değerlendir: "TAM" (özellik kontrolü tam karşılıyor), "KISMİ" (kısmen karşılıyor), "YOK" (karşılamıyor)
3. Kısa bir açıklama ekle

YANITI SADECE GEÇERLİ JSON OLARAK ver:
{
  "generatedAt": "${new Date().toISOString()}",
  "features": ${JSON.stringify(features)},
  "matrix": [
    {
      "feature": "özellik adı",
      "featureIndex": 1,
      "compliantStandards": [
        {
          "standardId": "iso27001",
          "standardName": "ISO/IEC 27001:2022",
          "references": ["A.8.5", "A.5.16"],
          "complianceLevel": "TAM",
          "notes": "Açıklama"
        }
      ],
      "nonCompliantStandards": [
        {
          "standardId": "pcidss",
          "standardName": "PCI DSS v4.0",
          "missingControls": ["REQ 8.3"],
          "notes": "Eksik olan kontrol açıklaması"
        }
      ],
      "overallStatus": "✅ UYUMLU / ⚠️ KISMİ / ❌ UYUMSUZ",
      "recommendation": "Öneri veya not"
    }
  ],
  "summary": {
    "totalFeatures": ${features.length},
    "fullyCompliant": 0,
    "partiallyCompliant": 0,
    "nonCompliant": 0
  }
}`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 8192,
      messages: [{ role: 'user', content: prompt }],
    });

    const rawText = message.content[0].text.trim();
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Claude geçerli JSON döndürmedi');

    const result = JSON.parse(jsonMatch[0]);

    // Recount summary
    let fullyCompliant = 0, partiallyCompliant = 0, nonCompliant = 0;
    (result.matrix || []).forEach(item => {
      const status = (item.overallStatus || '').toLowerCase();
      if (status.includes('uyumlu') && !status.includes('kısm') && !status.includes('uyumsuz')) fullyCompliant++;
      else if (status.includes('kısm')) partiallyCompliant++;
      else nonCompliant++;
    });
    result.summary = { totalFeatures: features.length, fullyCompliant, partiallyCompliant, nonCompliant };

    writeJson(MATRIX_FILE, result);
    res.json(result);
  } catch (err) {
    console.error('[Regulation] Matrix error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/regulation/last-matrix ──────────────────────────────────────────
router.get('/last-matrix', (req, res) => {
  const data = readJson(MATRIX_FILE, null);
  if (!data) return res.status(404).json({ error: 'Henüz uyum matrisi oluşturulmamış' });
  res.json(data);
});

// ── GET /api/regulation/export/controls/:id ──────────────────────────────────
// Export control list as Excel in TCMB format
router.get('/export/controls/:id', (req, res) => {
  const { id } = req.params;
  const meta = getMeta();
  const standard = meta.find(m => m.id === id);
  const data = getControls(id);

  if (!data || !standard) {
    return res.status(404).json({ error: 'Kontrol listesi bulunamadı' });
  }

  const wb = XLSX.utils.book_new();

  // Sheet 1: Control List
  const wsData = [
    // Title row
    [null, `${standard.name} — KONTROL LİSTESİ`, null, null, null, null, null, null],
    [null, '#', 'KATEGORİ', 'REF NO', 'KONTROL BAŞLIĞI', 'KONTROL AÇIKLAMASI', 'TİP', 'ÖNCELİK'],
    ...data.controls.map((c, i) => [
      null,
      i + 1,
      c.category,
      c.refNo,
      c.title,
      c.description,
      c.type,
      c.priority,
    ]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Column widths
  ws['!cols'] = [
    { wch: 3 },   // A (empty)
    { wch: 5 },   // #
    { wch: 30 },  // KATEGORİ
    { wch: 15 },  // REF NO
    { wch: 40 },  // BAŞLIK
    { wch: 60 },  // AÇIKLAMA
    { wch: 12 },  // TİP
    { wch: 15 },  // ÖNCELİK
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Kontrol Listesi');

  // Sheet 2: Summary by category
  const categories = [...new Set(data.controls.map(c => c.category))];
  const summaryData = [
    [null, `${standard.name} — KATEGORİ ÖZETİ`],
    [null, 'KATEGORİ', 'ZORUNLU', 'TAVSİYE', 'TOPLAM'],
    ...categories.map(cat => {
      const catControls = data.controls.filter(c => c.category === cat);
      const mandatory = catControls.filter(c => c.type === 'ZORUNLU').length;
      const advisory = catControls.filter(c => c.type === 'TAVSİYE').length;
      return [null, cat, mandatory, advisory, catControls.length];
    }),
    [null, 'GENEL TOPLAM',
      data.controls.filter(c => c.type === 'ZORUNLU').length,
      data.controls.filter(c => c.type === 'TAVSİYE').length,
      data.controls.length,
    ],
  ];

  const ws2 = XLSX.utils.aoa_to_sheet(summaryData);
  ws2['!cols'] = [{ wch: 3 }, { wch: 40 }, { wch: 12 }, { wch: 12 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, ws2, 'Kategori Özeti');

  const fileName = `${id}-kontrol-listesi-${Date.now()}.xlsx`;
  const filePath = path.join(UPLOADS_DIR, fileName);
  XLSX.writeFile(wb, filePath);

  res.download(filePath, `${standard.shortName}-Kontrol-Listesi.xlsx`, () => {
    fs.unlink(filePath, () => {});
  });
});

// ── GET /api/regulation/export/matrix ────────────────────────────────────────
// Export last compliance matrix as Excel
router.get('/export/matrix', (req, res) => {
  const data = readJson(MATRIX_FILE, null);
  if (!data) return res.status(404).json({ error: 'Uyum matrisi bulunamadı' });

  const wb = XLSX.utils.book_new();

  // Collect all unique standards
  const allStandards = new Set();
  (data.matrix || []).forEach(item => {
    (item.compliantStandards || []).forEach(s => allStandards.add(s.standardId + '|' + s.standardName));
    (item.nonCompliantStandards || []).forEach(s => allStandards.add(s.standardId + '|' + s.standardName));
  });
  const stdList = [...allStandards].map(s => ({ id: s.split('|')[0], name: s.split('|')[1] }));

  // Header row
  const headers = [null, '#', 'ÖZELLİK / KONTROL', 'GENEL DURUM', ...stdList.map(s => s.name), 'ÖNERİ'];
  const rows = [
    [null, 'UYUMLUluk MATRİSİ', null, null],
    [null, `Oluşturma: ${new Date(data.generatedAt).toLocaleString('tr-TR')}`, null, null],
    [],
    headers,
  ];

  (data.matrix || []).forEach((item, i) => {
    const row = [null, i + 1, item.feature, item.overallStatus];
    stdList.forEach(std => {
      const compliant = (item.compliantStandards || []).find(s => s.standardId === std.id);
      const nonCompliant = (item.nonCompliantStandards || []).find(s => s.standardId === std.id);
      if (compliant) {
        row.push(`${compliant.complianceLevel}\n${compliant.references.join(', ')}`);
      } else if (nonCompliant) {
        row.push(`❌ YOK\n${(nonCompliant.missingControls || []).join(', ')}`);
      } else {
        row.push('—');
      }
    });
    row.push(item.recommendation || '');
    rows.push(row);
  });

  // Summary
  rows.push([]);
  rows.push([null, 'ÖZET', null, null]);
  rows.push([null, '✅ Tam Uyumlu', data.summary.fullyCompliant, null]);
  rows.push([null, '⚠️ Kısmen Uyumlu', data.summary.partiallyCompliant, null]);
  rows.push([null, '❌ Uyumsuz', data.summary.nonCompliant, null]);
  rows.push([null, 'TOPLAM', data.summary.totalFeatures, null]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const colWidths = [{ wch: 3 }, { wch: 5 }, { wch: 45 }, { wch: 20 }];
  stdList.forEach(() => colWidths.push({ wch: 25 }));
  colWidths.push({ wch: 40 });
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, 'Uyum Matrisi');

  const fileName = `uyum-matrisi-${Date.now()}.xlsx`;
  const filePath = path.join(UPLOADS_DIR, fileName);
  XLSX.writeFile(wb, filePath);

  res.download(filePath, 'Uyum-Matrisi.xlsx', () => {
    fs.unlink(filePath, () => {});
  });
});

// ── GET /api/regulation/cross-reference ──────────────────────────────────────
// Returns all topics with how many standards cover each topic
router.get('/cross-reference', (req, res) => {
  const meta = getMeta();
  const result = TOPIC_TAXONOMY.map(topic => {
    const standardMatches = [];
    meta.forEach(standard => {
      const data = getControls(standard.id);
      if (!data) return;
      const matched = data.controls.filter(c => matchTopics(c).includes(topic.slug));
      if (matched.length > 0) {
        standardMatches.push({
          standardId: standard.id,
          standardName: standard.shortName,
          icon: standard.icon,
          color: standard.color,
          controlCount: matched.length,
          sampleControls: matched.slice(0, 3).map(c => ({ refNo: c.refNo, title: c.title })),
        });
      }
    });
    return {
      ...topic,
      standardCount: standardMatches.length,
      totalControls: standardMatches.reduce((s, m) => s + m.controlCount, 0),
      standards: standardMatches.sort((a, b) => b.controlCount - a.controlCount),
    };
  });
  res.json(result.sort((a, b) => b.standardCount - a.standardCount));
});

// ── GET /api/regulation/cross-reference/:slug ────────────────────────────────
// Returns all controls for a specific topic, grouped by standard
router.get('/cross-reference/:slug', (req, res) => {
  const topic = TOPIC_TAXONOMY.find(t => t.slug === req.params.slug);
  if (!topic) return res.status(404).json({ error: 'Konu bulunamadı' });

  const meta = getMeta();
  const groups = [];
  meta.forEach(standard => {
    const data = getControls(standard.id);
    if (!data) return;
    const matched = data.controls.filter(c => matchTopics(c).includes(topic.slug));
    if (matched.length > 0) {
      groups.push({
        standardId: standard.id,
        standardName: standard.name,
        shortName: standard.shortName,
        icon: standard.icon,
        color: standard.color,
        controls: matched,
      });
    }
  });

  res.json({
    topic,
    standardCount: groups.length,
    totalControls: groups.reduce((s, g) => s + g.controls.length, 0),
    standards: groups.sort((a, b) => b.controls.length - a.controls.length),
  });
});

// ── GET /api/regulation/domains ───────────────────────────────────────────────
// Returns industry domain groupings with their associated standards
router.get('/domains', (req, res) => {
  const domains = readJson(DOMAINS_FILE, []);
  const meta = getMeta();

  const result = domains.map(domain => {
    const resolve = id => {
      const s = meta.find(m => m.id === id);
      return s ? { id: s.id, name: s.name, shortName: s.shortName, icon: s.icon, color: s.color, controlCount: s.controlCount } : null;
    };
    return {
      ...domain,
      primaryStandards:    (domain.primaryStandards    || []).map(resolve).filter(Boolean),
      supportingStandards: (domain.supportingStandards || []).map(resolve).filter(Boolean),
    };
  });

  res.json(result);
});

// ── Helpers: Policy ──────────────────────────────────────────────────────────
function policyFileName(standardId, refNo) {
  return path.join(POLICIES_DIR, `${standardId}_${refNo.replace(/[^a-zA-Z0-9]/g, '_')}.json`);
}

function bumpVersion(current) {
  if (!current) return '1.0';
  const [maj, min] = current.split('.').map(Number);
  return `${maj}.${(min || 0) + 1}`;
}

function getCurrentDocument(policy) {
  if (!policy || !policy.versions) return null;
  const ver = policy.versions.find(v => v.version === policy.currentVersion);
  return ver ? ver.document : null;
}

function wrapVersioned(standardId, refNo, controlTitle, document, author, note, existingVersions) {
  const prevVersions = existingVersions || [];
  const newVersion   = bumpVersion(prevVersions.length ? prevVersions[prevVersions.length - 1].version : null);
  const entry = {
    version: newVersion,
    createdAt: new Date().toISOString().split('T')[0],
    createdBy: author || 'Bilinmiyor',
    note: note || '',
    document,
  };
  return {
    standardId,
    refNo,
    controlTitle,
    currentVersion: newVersion,
    lastModifiedBy: author || 'Bilinmiyor',
    lastModifiedAt: entry.createdAt,
    versions: [...prevVersions, entry],
  };
}

// ── Procedure library: context-specific steps keyed by keyword patterns ───────
const PROCEDURE_LIBRARY = {
  'erişim|access control|yetkilendirme|rbac|privilege|kimlik doğrulama|authentication|mfa|oturum|iam|parola|password': [
    { title: 'Erişim Talebi ve Onay', description: 'Kullanıcı, sistem veya uygulama erişim talebini yetkili amiri aracılığıyla erişim yönetim sistemine iletir. Talep, iş gereksinimi ve minimum yetki prensibine göre değerlendirilir.', responsible: 'İlgili Departman Yöneticisi', inputs: ['Erişim talep formu', 'Görev tanımı'], outputs: ['Onaylı erişim talebi'] },
    { title: 'Hesap Oluşturma ve Yetkilendirme', description: 'Onaylanan talep BT/IAM ekibine iletilir; kullanıcı hesabı oluşturulur, rol ve yetkiler atanır, MFA etkinleştirilir.', responsible: 'BT / IAM Ekibi', inputs: ['Onaylı erişim talebi'], outputs: ['Kullanıcı hesabı', 'Yetki kaydı'] },
    { title: 'Erişim Bilgilerinin Teslimi', description: 'Başlangıç kimlik bilgileri kullanıcıya güvenli kanal üzerinden iletilir. Kullanıcı, ilk girişte parolasını değiştirmekle yükümlüdür.', responsible: 'BT / IAM Ekibi', inputs: ['Kullanıcı hesabı'], outputs: ['Teslim tutanağı', 'Parola değişim kaydı'] },
    { title: 'Periyodik Erişim Gözden Geçirme', description: 'En az altı ayda bir tüm hesaplar ve yetkiler gözden geçirilir; iş gereksinimi kalkmış veya değişmiş erişimler revize edilir ya da iptal edilir.', responsible: 'Bilgi Güvenliği Yöneticisi + Departman Yöneticileri', inputs: ['Güncel kullanıcı/yetki listesi'], outputs: ['Gözden geçirme raporu', 'Revizyon kaydı'] },
    { title: 'Ayrılış / Görev Değişikliği İşlemleri', description: 'Çalışanın ayrılması veya görev değişikliği durumunda hesap derhal devre dışı bırakılır, yetkiler güncellenir ve tüm sistemlere erişim sonlandırılır.', responsible: 'İnsan Kaynakları + BT Ekibi', inputs: ['Ayrılış bildirimi / atama kararı'], outputs: ['Hesap kapatma kaydı', 'Erişim iptal tutanağı'] },
  ],
  'veri koruma|data protection|kvkk|gdpr|kişisel veri|personal data|gizlilik|privacy|dpia': [
    { title: 'Kişisel Veri Envanteri Güncelleme', description: 'İşlenen kişisel verilerin kategorileri, işleme amaçları, saklama süreleri ve aktarılan taraflar envantere kaydedilir ve düzenli güncellenir.', responsible: 'Veri Koruma Sorumlusu (DPO)', inputs: ['Süreç haritası', 'Sistem envanteri'], outputs: ['Güncel KVKK / GDPR veri envanteri'] },
    { title: 'Veri İşleme Etki Değerlendirmesi (DPIA)', description: 'Yüksek riskli veri işleme faaliyetleri başlatılmadan önce DPIA gerçekleştirilir; riskler belirlenerek azaltıcı tedbirler uygulanır.', responsible: 'DPO + İlgili Süreç Sahibi', inputs: ['Yeni süreç / sistem tanımı'], outputs: ['DPIA raporu', 'Risk azaltma planı'] },
    { title: 'Veri Sahibi Hakları Yönetimi', description: 'Veri sahiplerinden gelen başvurular (erişim, silme, itiraz vb.) kayıt altına alınır ve yasal süreler içinde yanıtlanır.', responsible: 'DPO / İlgili Birim', inputs: ['Veri sahibi başvurusu'], outputs: ['Yanıt kaydı', 'İşlem tutanağı'] },
    { title: 'Veri İhlali Bildirim Prosedürü', description: 'Kişisel veri ihlali tespit edildiğinde 72 saat içinde ilgili otoriteye (KVKK Kurulu / supervisory authority) bildirim yapılır; etkilenen kişiler bilgilendirilir.', responsible: 'DPO + Bilgi Güvenliği Yöneticisi', inputs: ['İhlal tespit kaydı'], outputs: ['Resmi bildirim', 'İhlal kayıt formu'] },
    { title: 'Gözden Geçirme ve Denetim', description: 'Veri işleme faaliyetleri yıllık olarak denetlenir; mevzuat değişiklikleri takip edilerek politika ve prosedürler güncellenir.', responsible: 'İç Denetim + DPO', inputs: ['Veri envanteri', 'Denetim planı'], outputs: ['Denetim raporu', 'Güncellenmiş politika'] },
  ],
  'olay|incident|csirt|siber olay|müdahale|containment|playbook': [
    { title: 'Olay Tespiti ve Sınıflandırma', description: 'Güvenlik izleme araçları, kullanıcı bildirimleri veya üçüncü taraf uyarılarıyla tespit edilen olay; etki, kapsam ve aciliyet kriterlerine göre P1–P4 arasında sınıflandırılır.', responsible: 'SOC / CSIRT Analisti', inputs: ['SIEM uyarısı', 'Kullanıcı bildirimi', 'Tehdit istihbarat akışı'], outputs: ['Olay kaydı (ticket)', 'Sınıflandırma etiketi'] },
    { title: 'Kontrol Altına Alma (Containment)', description: 'Olayın yayılmasını önlemek amacıyla etkilenen sistem, hesap veya ağ segmenti izole edilir; geçici erişim kısıtlamaları uygulanır.', responsible: 'CSIRT Teknik Ekibi', inputs: ['Olay kaydı', 'Ağ/sistem topolojisi'], outputs: ['İzolasyon kaydı', 'Anlık durum raporu'] },
    { title: 'Kök Neden Analizi ve Temizleme', description: 'Olayın kaynağı araştırılır, kötü amaçlı yazılım / istismar kodu temizlenir, istismar edilen açıklar kapatılır.', responsible: 'CSIRT Teknik Ekibi + İlgili Sistem Sahibi', inputs: ['İzolasyon kaydı', 'Forensic veri'], outputs: ['Kök neden raporu', 'Temizleme kanıtı'] },
    { title: 'Kurtarma ve Hizmet Yeniden Başlatma', description: 'Temiz sistem görüntülerinden veya yedeklerden kurtarma yapılır; hizmetler kontrollü şekilde yeniden başlatılır ve normal işleyiş doğrulanır.', responsible: 'BT Operasyon Ekibi', inputs: ['Temiz yedek', 'Kurtarma planı'], outputs: ['Servis kurtarma kaydı', 'Onay tutanağı'] },
    { title: 'Olay Sonrası Değerlendirme (PIR)', description: 'Olay kapatıldıktan sonraki 5 iş günü içinde post-incident review toplantısı yapılır; dersler çıkarılır, playbook ve kontroller güncellenir.', responsible: 'CSIRT Lideri + Üst Yönetim', inputs: ['Tüm olay kayıtları', 'Zaman çizelgesi'], outputs: ['PIR raporu', 'Güncellenmiş playbook', 'İyileştirme aksiyonları'] },
  ],
  'zafiyet|vulnerability|patch|yama|güvenlik açığı|cve|tarama|scan': [
    { title: 'Zafiyet Tarama Planlaması', description: 'Tüm sistem ve uygulamaları kapsayan tarama takvimi oluşturulur; kritik varlıklar aylık, diğerleri çeyrek dönemli taramaya dahil edilir.', responsible: 'Bilgi Güvenliği Ekibi', inputs: ['Varlık envanteri', 'Tarama aracı konfigürasyonu'], outputs: ['Tarama takvimi', 'Kapsam belgesi'] },
    { title: 'Zafiyet Taraması ve Tespit', description: 'Onaylanan araçlarla (Nessus, Qualys vb.) tarama gerçekleştirilir; bulunan zafiyetler CVSS skoruna göre Kritik / Yüksek / Orta / Düşük olarak derecelendirilir.', responsible: 'Bilgi Güvenliği Analisti', inputs: ['Tarama takvimi'], outputs: ['Ham tarama raporu', 'Zafiyet listesi (CVSS ile)'] },
    { title: 'Risk Değerlendirme ve Önceliklendirme', description: 'Tespit edilen zafiyetler iş etkisi ve istismar olasılığı göz önünde bulundurularak önceliklendirilir; ilgili sistem sahipleriyle paylaşılır.', responsible: 'Bilgi Güvenliği Yöneticisi + Sistem Sahipleri', inputs: ['Zafiyet listesi'], outputs: ['Önceliklendirilmiş aksiyon planı'] },
    { title: 'Yama Uygulama ve Giderme', description: 'Kritik yamalar 72 saat, yüksek yamalar 7 gün, orta/düşük yamalar 30 gün içinde uygulanır. Test ortamında doğrulama yapıldıktan sonra üretim ortamına geçilir.', responsible: 'BT Operasyon / DevOps Ekibi', inputs: ['Aksiyon planı', 'Onaylı yama'], outputs: ['Yama uygulama kaydı', 'Test onay belgesi'] },
    { title: 'Doğrulama Taraması ve Raporlama', description: 'Yama sonrası doğrulama taraması yapılarak giderme başarısı teyit edilir; kalan zafiyetler için risk kabul formu doldurulur.', responsible: 'Bilgi Güvenliği Analisti', inputs: ['Yama uygulama kaydı'], outputs: ['Doğrulama raporu', 'Risk kabul formu (gerekirse)'] },
  ],
  'yedek|backup|iş sürekliliği|business continuity|bcp|drp|felaket|disaster|kurtarma|rto|rpo': [
    { title: 'Yedekleme Kapsamı ve Sıklığı Belirleme', description: 'Kritik varlıklar risk değerlendirmesi doğrultusunda sınıflandırılır; RTO ve RPO hedefleri belirlenerek yedekleme sıklıkları (günlük/saatlik/anlık) tanımlanır.', responsible: 'BT Yöneticisi + İş Birimi Sahipleri', inputs: ['Varlık kritiklik listesi', 'İş etki analizi'], outputs: ['Yedekleme planı', 'RTO/RPO tablosu'] },
    { title: 'Yedekleme Uygulaması ve İzleme', description: 'Otomatik yedekleme görevleri çalıştırılır; başarı/başarısızlık sonuçları izleme sisteminde takip edilir ve anomaliler derhal raporlanır.', responsible: 'BT Operasyon Ekibi', inputs: ['Yedekleme takvimi'], outputs: ['Yedekleme iş kuyruğu kaydı', 'İzleme dashboard'] },
    { title: 'Yedek Bütünlük Testi', description: 'Aylık olarak rastgele seçilen yedekler test ortamında geri yüklenerek bütünlük ve kullanılabilirlik doğrulanır.', responsible: 'BT Operasyon Ekibi', inputs: ['Yedek arşivi'], outputs: ['Geri yükleme test raporu'] },
    { title: 'DR Tatbikatı', description: 'Yılda en az bir kez belgelenmiş DR tatbikatı yapılır; RTO/RPO hedeflerine ulaşılıp ulaşılmadığı ölçülür ve bulgular üst yönetime raporlanır.', responsible: 'İş Sürekliliği Yöneticisi', inputs: ['DR planı', 'Tatbikat senaryosu'], outputs: ['Tatbikat raporu', 'Boşluk analizi'] },
    { title: 'Plan Güncelleme ve Onay', description: 'DR/BCP planları, önemli altyapı değişikliklerinden sonra veya yılda en az bir kez gözden geçirilir; güncel versiyon üst yönetim tarafından onaylanır.', responsible: 'İş Sürekliliği Yöneticisi + Üst Yönetim', inputs: ['Tatbikat raporu', 'Altyapı değişiklik kayıtları'], outputs: ['Güncel DR/BCP planı', 'Onay tutanağı'] },
  ],
  'kriptografi|şifreleme|encryption|tls|aes|ssl|sertifika|certificate': [
    { title: 'Kriptografik Gereksinim Analizi', description: 'Korunması gereken veri kategorileri ve iletişim kanalları belirlenir; her biri için uygun şifreleme algoritması ve anahtar uzunluğu standartları tanımlanır.', responsible: 'Bilgi Güvenliği Mimarı', inputs: ['Veri sınıflandırma politikası', 'Sistem envanteri'], outputs: ['Kriptografi standartları belgesi'] },
    { title: 'Anahtar Oluşturma ve Dağıtım', description: 'Kriptografik anahtarlar onaylı HSM veya anahtar yönetim sistemi (KMS) aracılığıyla oluşturulur; dağıtım güvenli kanal üzerinden gerçekleştirilir.', responsible: 'BT Güvenlik Ekibi', inputs: ['Kriptografi standartları'], outputs: ['Oluşturulan anahtar seti', 'Dağıtım kaydı'] },
    { title: 'Sertifika Yaşam Döngüsü Yönetimi', description: 'Dijital sertifikaların son kullanma tarihleri izlenir; süresi dolmadan en az 30 gün önce yenileme başlatılır; iptal edilen sertifikalar CRL/OCSP üzerinden yayımlanır.', responsible: 'PKI / BT Ekibi', inputs: ['Sertifika envanteri'], outputs: ['Yenilenmiş sertifika', 'İptal kayıtları'] },
    { title: 'Anahtar Rotasyonu ve İmha', description: 'Anahtarlar politikada belirtilen periyotta veya risk olayı sonrasında döndürülür; kullanım dışı anahtarlar güvenli imha protokolüne göre silinir.', responsible: 'Bilgi Güvenliği Ekibi', inputs: ['Rotasyon takvimi'], outputs: ['Rotasyon kaydı', 'İmha tutanağı'] },
    { title: 'Denetim ve Uyum Kontrolü', description: 'Tüm kriptografik uygulamalar yılda bir denetlenir; zayıf algoritma kullanımı (MD5, SHA-1, DES vb.) tespit edilerek güçlendirilir.', responsible: 'İç Denetim + Bilgi Güvenliği', inputs: ['Sistem konfigürasyonları'], outputs: ['Kriptografi denetim raporu'] },
  ],
  'ağ|network|firewall|ids|ips|segmentation|güvenlik duvarı': [
    { title: 'Ağ Mimarisi Belgeleme ve Segmentasyon', description: 'Ağ topolojisi ve güvenlik bölgeleri (DMZ, iç ağ, yönetim ağı vb.) tanımlanır ve belgelenir; kritik varlıklar ayrı segmentlere yerleştirilir.', responsible: 'Ağ Mimarı / Bilgi Güvenliği', inputs: ['Varlık envanteri', 'Risk değerlendirme'], outputs: ['Ağ mimarisi diyagramı', 'Segmentasyon konfigürasyonu'] },
    { title: 'Güvenlik Duvarı Kural Yönetimi', description: 'Yeni kural talepleri değişiklik yönetimi süreciyle onaylanır; gereksiz veya güncel olmayan kurallar çeyrek dönemde gözden geçirilip kaldırılır.', responsible: 'Ağ / Güvenlik Ekibi', inputs: ['Değişiklik talebi'], outputs: ['Güncel kural seti', 'Gözden geçirme kaydı'] },
    { title: 'Ağ İzleme ve Anomali Tespiti', description: 'NetFlow, IDS/IPS ve SIEM entegrasyonuyla ağ trafiği sürekli izlenir; anormal trafik desenleri tespit edildiğinde olay müdahale süreci başlatılır.', responsible: 'SOC Ekibi', inputs: ['SIEM akışları', 'IDS/IPS uyarıları'], outputs: ['Anomali raporu', 'Olay kaydı'] },
    { title: 'Sızma Testi ve Güvenlik Değerlendirme', description: 'Yılda en az bir kez harici ve dahili sızma testi gerçekleştirilir; bulunan açıklar zafiyet yönetimi süreciyle kapatılır.', responsible: 'Bilgi Güvenliği Yöneticisi (dış temin)', inputs: ['Kapsam belgesi'], outputs: ['Sızma testi raporu', 'Kapatma planı'] },
    { title: 'Ağ Konfigürasyon Denetimi', description: 'Ağ cihazları konfigürasyonları CIS Benchmark veya benzeri standartlara göre altı ayda bir denetlenir; sapmaların giderilmesi takip edilir.', responsible: 'Ağ Ekibi + İç Denetim', inputs: ['CIS Benchmark baseline'], outputs: ['Konfigürasyon denetim raporu'] },
  ],
  'log|siem|izleme|monitoring|denetim günlüğü|audit': [
    { title: 'Log Kaynağı Tanımlama ve Yapılandırma', description: 'Tüm kritik sistem, uygulama ve ağ cihazlarının log akışları SIEM veya merkezi log yönetim platformuna yönlendirilir; format ve zaman damgası standardizasyonu sağlanır.', responsible: 'BT / SOC Ekibi', inputs: ['Sistem envanteri', 'SIEM konfigürasyonu'], outputs: ['Log kaynak envanteri', 'Aktif log akış listesi'] },
    { title: 'Log Saklama ve Arşivleme', description: 'Loglar yasal ve sektörel gereksinimlere uygun süreyle (minimum 1 yıl, arşivde 3 yıl) saklanır; bütünlük koruması için hash/imzalama uygulanır.', responsible: 'BT Operasyon Ekibi', inputs: ['Saklama politikası'], outputs: ['Arşiv planı', 'Bütünlük hash kaydı'] },
    { title: 'Korelasyon Kuralları ve Alarm Yönetimi', description: 'SIEM üzerinde kullanım senaryoları (use case) tanımlanır; alarm eşikleri belirlenir ve yanlış pozitif oranı düzenli olarak optimize edilir.', responsible: 'SOC Analisti / Güvenlik Mühendisi', inputs: ['Tehdit modeli', 'Geçmiş olay verileri'], outputs: ['Use case kataloğu', 'Alarm konfigürasyonu'] },
    { title: 'Aktif İzleme ve Triage', description: 'SOC analistleri SIEM alarmlarını 7/24 izler; yüksek öncelikli alarmlar 15 dakika içinde triyaj edilir ve gerekirse olay müdahale süreci başlatılır.', responsible: 'SOC L1/L2 Analisti', inputs: ['SIEM alarmları'], outputs: ['Triage kaydı', 'Olay bileti (gerekirse)'] },
    { title: 'Denetim Günlüğü Gözden Geçirme', description: 'Ayrıcalıklı hesap aktiviteleri ve hassas veri erişim logları aylık olarak gözden geçirilir; anormallikler raporlanır.', responsible: 'Bilgi Güvenliği Yöneticisi + İç Denetim', inputs: ['Ayrıcalıklı hesap log raporu'], outputs: ['Aylık denetim raporu'] },
  ],
  'değişiklik|change management|cab|release|deployment|ci/cd': [
    { title: 'Değişiklik Talebinin Kaydı ve Sınıflandırması', description: 'Değişiklik talebi (RFC) ITSM sistemine kayıt edilir; aciliyet, etki ve risk kriterlerine göre Standart / Normal / Acil olarak sınıflandırılır.', responsible: 'Değişiklik Sahibi', inputs: ['RFC formu'], outputs: ['Kayıtlı RFC', 'Sınıflandırma etiketi'] },
    { title: 'Risk Değerlendirme ve Onay', description: 'Normal değişiklikler CAB (Değişiklik Danışma Kurulu) tarafından değerlendirilir; risk analizi, geri alma planı ve test stratejisi incelenerek onaylanır ya da reddedilir.', responsible: 'CAB / Değişiklik Yöneticisi', inputs: ['RFC', 'Risk ve geri alma planı'], outputs: ['Onay/red kararı', 'CAB tutanağı'] },
    { title: 'Test Ortamında Doğrulama', description: 'Onaylı değişiklik önce test/sahne ortamında uygulanır; işlevsellik, performans ve güvenlik testleri tamamlanmadan üretime geçiş yapılmaz.', responsible: 'Geliştirici / DevOps Ekibi', inputs: ['Onaylı RFC', 'Test planı'], outputs: ['Test sonuç raporu'] },
    { title: 'Üretim Geçişi ve İzleme', description: 'Değişiklik onaylı bakım penceresi içinde uygulanır; geçiş sonrası belirlenen süre izlenerek başarı kriterleri doğrulanır.', responsible: 'Operasyon Ekibi / Release Manager', inputs: ['Değişiklik planı', 'Geri alma talimatı'], outputs: ['Geçiş kaydı', 'İzleme raporu'] },
    { title: 'Kapanış ve Dokümantasyon', description: 'Başarılı değişiklik kapatılır; etkilenen dokümanlar, yapılandırma kayıtları ve CMDB güncellenir. Başarısız değişiklikler kök neden analizi için incelenir.', responsible: 'Değişiklik Yöneticisi', inputs: ['Geçiş kaydı'], outputs: ['Kapatılmış RFC', 'Güncel CMDB'] },
  ],
  'varlık|asset|envanter|inventory|cmdb': [
    { title: 'Varlık Keşfi ve Envantere Kayıt', description: 'Ağ tarama araçları ve manuel bildirimlerle tüm donanım, yazılım ve veri varlıkları tespit edilerek CMDB/envanter sistemine kaydedilir.', responsible: 'BT Varlık Yöneticisi', inputs: ['Ağ tarama çıktısı', 'Satın alma kayıtları'], outputs: ['Güncel varlık envanteri'] },
    { title: 'Varlık Sınıflandırma ve Sahiplik', description: 'Her varlık kritiklik, veri hassasiyeti ve iş etkisine göre sınıflandırılır; bir iş birimi sahibine atanır.', responsible: 'Bilgi Güvenliği + İş Birimi', inputs: ['Varlık envanteri'], outputs: ['Sınıflandırılmış envanter', 'Sahiplik matrisi'] },
    { title: 'Konfigürasyon Yönetimi', description: 'Varlıkların onaylı baseline konfigürasyonları CMDB\'ye kaydedilir; yetkisiz değişiklikler konfigürasyon uyum aracıyla tespit edilir.', responsible: 'BT Operasyon Ekibi', inputs: ['Baseline konfigürasyon'], outputs: ['CMDB kaydı', 'Uyumsuzluk uyarıları'] },
    { title: 'Periyodik Envanter Doğrulama', description: 'Fiziksel ve mantıksal envanter çeyrek dönemde doğrulanır; kayıp/fazla varlıklar raporlanır ve gerekli güncelleme yapılır.', responsible: 'BT Varlık Yöneticisi', inputs: ['CMDB kayıtları'], outputs: ['Doğrulama raporu', 'Delta listesi'] },
    { title: 'Kullanım Ömrü Sonu (EOL) Yönetimi', description: 'EOL/EOS tarihine ulaşan varlıklar zamanında yenilenir veya güvenli şekilde kullanım dışı bırakılır; veri taşıma/imha prosedürleri uygulanır.', responsible: 'BT Yöneticisi + Satın Alma', inputs: ['EOL takvimi'], outputs: ['Yenileme planı', 'İmha tutanağı'] },
  ],
  'farkındalık|awareness|eğitim|training|phishing': [
    { title: 'Eğitim İhtiyaç Analizi', description: 'Rol bazlı güvenlik eğitim gereksinimleri belirlenir; risk ortamı değişiklikleri ve geçmiş olay verileri analiz edilerek müfredat güncellenir.', responsible: 'Bilgi Güvenliği + İnsan Kaynakları', inputs: ['Risk değerlendirme', 'Olay kayıtları'], outputs: ['Yıllık eğitim planı', 'Müfredat belgesi'] },
    { title: 'Eğitim İçeriği Hazırlama ve Dağıtım', description: 'Zorunlu temel farkındalık eğitimi ve rol bazlı ileri eğitimler LMS üzerinden çalışanlara atanır; yeni işe başlayanlar için onboarding programı tanımlanır.', responsible: 'Bilgi Güvenliği + İK', inputs: ['Eğitim planı', 'Rol envanteri'], outputs: ['LMS kurs ataması', 'Onboarding eğitim paketi'] },
    { title: 'Phishing Simülasyonu', description: 'Yılda en az iki kez simüle phishing kampanyası yürütülür; tıklama ve veri girme oranları ölçülür; başarısız olan çalışanlara hedefli eğitim verilir.', responsible: 'Bilgi Güvenliği Ekibi', inputs: ['Simülasyon senaryosu'], outputs: ['Simülasyon raporu', 'Hedefli eğitim listesi'] },
    { title: 'Tamamlanma Takibi ve Raporlama', description: 'Eğitim tamamlanma oranları aylık olarak izlenir; %90 altında kalan birimlere hatırlatma yapılır; sonuçlar üst yönetime raporlanır.', responsible: 'İnsan Kaynakları + Bilgi Güvenliği', inputs: ['LMS tamamlanma verileri'], outputs: ['Aylık tamamlanma raporu'] },
    { title: 'Etkinlik Ölçümü ve İyileştirme', description: 'Eğitim sonrası değerlendirme testleri ve olay istatistikleri analiz edilerek programın etkinliği ölçülür; bir sonraki dönem için iyileştirme planı hazırlanır.', responsible: 'Bilgi Güvenliği Yöneticisi', inputs: ['Test sonuçları', 'Olay istatistikleri'], outputs: ['Etkinlik raporu', 'İyileştirme önerileri'] },
  ],
  'uygulama güvenliği|application security|owasp|sast|dast|sdlc|sql injection|xss': [
    { title: 'Güvenli Geliştirme Eğitimi', description: 'Yazılım geliştiricilere OWASP Top 10, güvenli kodlama standartları ve yaygın zafiyet türleri konusunda yıllık eğitim verilir.', responsible: 'Bilgi Güvenliği + Yazılım Geliştirme Yöneticisi', inputs: ['Eğitim müfredatı'], outputs: ['Eğitim tamamlanma kaydı'] },
    { title: 'Statik Kod Analizi (SAST)', description: 'CI/CD pipeline entegrasyonuyla her commit/pull request sonrası otomatik SAST taraması çalıştırılır; kritik/yüksek bulgular build\'i engeller.', responsible: 'DevSecOps / Geliştirici', inputs: ['Kaynak kod'], outputs: ['SAST tarama raporu', 'Build durumu'] },
    { title: 'Dinamik Uygulama Testi (DAST)', description: 'Test ve sahne ortamında haftalık DAST taraması yapılır; üretim geçişinden önce tüm kritik açıkların kapatıldığı doğrulanır.', responsible: 'Güvenlik Testi Ekibi', inputs: ['Çalışan uygulama URL\'leri'], outputs: ['DAST tarama raporu', 'Zafiyet kapatma kaydı'] },
    { title: 'Güvenlik Kod İncelemesi', description: 'Kritik modüller ve yüksek riskli değişiklikler eşler arası güvenlik kodu incelemesine tabi tutulur; bulgular geliştirici tarafından kapatılır.', responsible: 'Kıdemli Geliştirici / Güvenlik Ekibi', inputs: ['Pull request / diff'], outputs: ['Code review onayı', 'Güvenlik notu'] },
    { title: 'Üretim Sonrası İzleme ve Yama', description: 'Üretimdeki uygulamalar WAF, RASP ve DAST ile sürekli izlenir; keşfedilen açıklar zafiyet yönetimi süresiyle belirlenen SLA içinde kapatılır.', responsible: 'DevSecOps + Uygulama Sahibi', inputs: ['WAF logları', 'Zafiyet bildirimleri'], outputs: ['Yama kaydı', 'Kapanış kanıtı'] },
  ],
};

function buildProceduresForControl(ctrl) {
  const text = `${ctrl.title || ''} ${ctrl.category || ''} ${ctrl.description || ''}`.toLowerCase();
  for (const [pattern, steps] of Object.entries(PROCEDURE_LIBRARY)) {
    if (pattern.split('|').some(kw => text.includes(kw.toLowerCase()))) {
      return steps.map((s, i) => ({ stepNo: i + 1, ...s }));
    }
  }
  // Generic fallback
  return [
    { stepNo: 1, title: 'Gereksinim Analizi ve Planlama', description: `${ctrl.title} kontrolüne ilişkin yasal, düzenleyici ve iş gereksinimleri belirlenir; uygulama kapsamı ve sorumluluklar tanımlanır.`, responsible: 'Bilgi Güvenliği Yöneticisi', inputs: ['Risk değerlendirme raporu', 'İlgili standart gereksinimleri'], outputs: ['Uygulama planı', 'Sorumluluk matrisi'] },
    { stepNo: 2, title: 'Kontrol Tasarımı ve Uygulama', description: 'Belirlenen gereksinimleri karşılayan kontroller tasarlanır ve ilgili süreçlere entegre edilir; teknik ve idari tedbirler hayata geçirilir.', responsible: 'İlgili Departman Yöneticisi + BT', inputs: ['Uygulama planı'], outputs: ['Uygulanan kontroller', 'Konfigürasyon kanıtı', 'Prosedür belgeleri'] },
    { stepNo: 3, title: 'Farkındalık ve Eğitim', description: 'Etkilenen personel yeni kontrol ve prosedürler hakkında bilgilendirilir; gerekli eğitimler tamamlatılır.', responsible: 'İnsan Kaynakları + Bilgi Güvenliği', inputs: ['Uygulama planı', 'Eğitim materyali'], outputs: ['Eğitim kayıtları', 'Katılım listeleri'] },
    { stepNo: 4, title: 'İzleme ve Etkinlik Ölçümü', description: 'Kontrollerin etkinliği KPI ve metriklerle düzenli olarak ölçülür; uyumsuzluklar ve sapma raporları ilgili yöneticilere iletilir.', responsible: 'Bilgi Güvenliği Yöneticisi', inputs: ['İzleme verileri', 'Denetim bulguları'], outputs: ['Aylık / çeyreklik etkinlik raporu'] },
    { stepNo: 5, title: 'Gözden Geçirme ve Sürekli İyileştirme', description: 'Politika ve prosedürler yılda en az bir kez ya da önemli değişiklikler sonrasında gözden geçirilir; iyileştirme fırsatları değerlendirilerek güncelleme yapılır.', responsible: 'Üst Yönetim / BGYS Komitesi', inputs: ['Etkinlik raporları', 'Denetim bulguları', 'Paydaş geri bildirimleri'], outputs: ['Güncellenmiş politika ve prosedürler', 'Onay tutanağı'] },
  ];
}

function buildDefaultTemplate(ctrl) {
  const procedures = buildProceduresForControl(ctrl);
  return {
    documentTitle: `${ctrl.title} Politikası`,
    purpose: `Bu politika, organizasyonun ${ctrl.title.toLowerCase()} kapsamındaki kontrol gereksinimlerini karşılamak ve uyum güvencesini sağlamak amacıyla hazırlanmıştır. ${ctrl.description || ''}`,
    scope: `Bu politika; kuruluşun tüm çalışanlarını, yüklenicilerini, danışmanlarını ve bilgi varlıklarına erişimi olan üçüncü tarafları kapsar.`,
    policyStatement: `Kuruluş, ${ctrl.title.toLowerCase()} alanında gerekli tüm kontrolleri oluşturmayı, uygulamayı ve sürekliliğini sağlamayı taahhüt eder.\n\nBu politika kapsamındaki tüm faaliyetler ilgili yasal düzenlemeler, sektörel standartlar ve kuruluş içi yönergelere uygun şekilde yürütülmelidir.\n\nPolitika ihlalleri disiplin prosedürlerini ve gerektiğinde yasal süreçleri başlatabilir.`,
    procedures,
    responsibilities: [
      { role: 'Üst Yönetim', duties: 'Politikayı onaylamak, gerekli kaynakları sağlamak ve uyum kültürünü desteklemek.' },
      { role: 'Bilgi Güvenliği Yöneticisi', duties: 'Politikanın uygulanmasını koordine etmek, izlemek ve raporlamak.' },
      { role: 'Departman Yöneticileri', duties: 'Kendi birimlerinde politikaya uyumu sağlamak ve personeli yönlendirmek.' },
      { role: 'Tüm Çalışanlar', duties: 'Politika hükümlerine uymak; ihlal ve zafiyetleri derhal bildirmek.' },
      { role: 'İç Denetim', duties: 'Uyumu bağımsız olarak denetlemek ve bulgularını raporlamak.' },
    ],
    measurementCriteria: [
      'Politika gözden geçirme tamamlanma oranı: %100 (yıllık)',
      'Tespit edilen politika ihlal sayısı: Hedef 0',
      'Farkındalık eğitimi tamamlama oranı: ≥ %90',
      'Açık bulgu kapatma süresi: ≤ 30 gün',
    ],
    relatedDocuments: ['Bilgi Güvenliği Ana Politikası', `${ctrl.category || 'BT'} Prosedürleri`, 'Risk Değerlendirme Çerçevesi', 'İç Denetim Planı'],
    exceptions: 'İstisna talepleri yazılı olarak Bilgi Güvenliği Yöneticisine iletilmeli, gerekçelendirilmeli ve Üst Yönetim tarafından onaylanmalıdır. Onaylanan istisnalar kayıt altına alınır ve periyodik olarak gözden geçirilir.',
    compliance: 'Bu politikaya uymayan personel hakkında İnsan Kaynakları politikaları çerçevesinde disiplin süreci başlatılır. Kasıtlı veya tekrarlayan ihlaller iş akdi feshine ve yasal işleme yol açabilir.',
    reviewPeriod: 'Yıllık',
  };
}

function buildPolicyHTML(standard, policies) {
  const date = new Date().toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' });
  const toc = policies.map((p, i) =>
    `<li><a href="#pol-${i}">${p.refNo} — ${p.controlTitle}</a></li>`
  ).join('');

  const sections = policies.map((p, i) => {
    const procedures = (p.procedures || []).map((pr, si) => `
      <div class="procedure-step">
        <div class="step-header">${si + 1}. ${pr.title || ''}</div>
        <p>${pr.description || ''}</p>
        ${pr.responsible ? `<p><strong>Sorumlu:</strong> ${pr.responsible}</p>` : ''}
        ${(pr.inputs || []).length ? `<p><strong>Girdiler:</strong> ${pr.inputs.join(', ')}</p>` : ''}
        ${(pr.outputs || []).length ? `<p><strong>Çıktılar:</strong> ${pr.outputs.join(', ')}</p>` : ''}
      </div>`).join('');

    const responsibilities = (p.responsibilities || []).map(r =>
      `<tr><td>${r.role || ''}</td><td>${r.duties || ''}</td></tr>`
    ).join('');

    const measurements = (p.measurementCriteria || []).map(m => `<li>${m}</li>`).join('');
    const related = (p.relatedDocuments || []).map(d => `<li>${d}</li>`).join('');

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

      <h3>1. Amaç</h3>
      <p>${p.purpose || ''}</p>

      <h3>2. Kapsam</h3>
      <p>${p.scope || ''}</p>

      <h3>3. Politika Beyanı</h3>
      <p>${(p.policyStatement || '').replace(/\n/g, '</p><p>')}</p>

      <h3>4. Prosedürler</h3>
      ${procedures || '<p>—</p>'}

      <h3>5. Sorumluluklar</h3>
      ${responsibilities ? `<table class="resp-table"><thead><tr><th>Rol</th><th>Sorumluluk</th></tr></thead><tbody>${responsibilities}</tbody></table>` : '<p>—</p>'}

      <h3>6. Ölçüm Kriterleri</h3>
      <ul>${measurements || '<li>—</li>'}</ul>

      <h3>7. İstisna Yönetimi</h3>
      <p>${p.exceptions || '—'}</p>

      <h3>8. Uyumsuzluk</h3>
      <p>${p.compliance || '—'}</p>

      <h3>9. İlgili Dokümanlar</h3>
      <ul>${related || '<li>—</li>'}</ul>

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

// ── POST /api/regulation/policy/template ─────────────────────────────────────
// Returns a template document (Claude AI or built-in default) WITHOUT saving
router.post('/policy/template', async (req, res) => {
  const { standardId, refNo, controlTitle, controlDescription, category, useAI } = req.body;
  if (!standardId || !refNo) return res.status(400).json({ error: 'Eksik alan' });

  if (useAI && process.env.ANTHROPIC_API_KEY) {
    const prompt = `Sen deneyimli bir BT uyum uzmanısın. "${controlTitle}" (${refNo}) kontrolü için kapsamlı bir politika ve prosedür dokümanı hazırla.
Standart: ${standardId.toUpperCase()} | Kategori: ${category || ''} | Açıklama: ${controlDescription || ''}
YALNIZCA geçerli JSON döndür:
{"documentTitle":"...","purpose":"...","scope":"...","policyStatement":"... (paragraflar \\n ile ayrılsın)","procedures":[{"stepNo":1,"title":"...","description":"...","responsible":"...","inputs":["..."],"outputs":["..."]}],"responsibilities":[{"role":"...","duties":"..."}],"measurementCriteria":["..."],"relatedDocuments":["..."],"exceptions":"...","compliance":"...","reviewPeriod":"Yıllık"}`;
    try {
      const msg = await anthropic.messages.create({ model: 'claude-opus-4-6', max_tokens: 4096, messages: [{ role: 'user', content: prompt }] });
      const match = msg.content[0].text.trim().match(/\{[\s\S]*\}/);
      if (!match) throw new Error('Geçersiz JSON');
      return res.json({ document: JSON.parse(match[0]), source: 'ai' });
    } catch (e) {
      console.error('[Policy] Template AI error:', e.message);
      // Fall through to default template
    }
  }

  const document = buildDefaultTemplate({ title: controlTitle, description: controlDescription, category });
  res.json({ document, source: 'default' });
});

// ── POST /api/regulation/policy/save ─────────────────────────────────────────
// Save a new version of a policy (user-authored)
router.post('/policy/save', (req, res) => {
  const { standardId, refNo, controlTitle, document, author, note } = req.body;
  if (!standardId || !refNo || !document) return res.status(400).json({ error: 'standardId, refNo ve document zorunlu' });

  const file = policyFileName(standardId, refNo);
  const existing = readJson(file, null);
  const policy = wrapVersioned(standardId, refNo, controlTitle || '', document, author, note, existing ? existing.versions : []);

  writeJson(file, policy);
  res.json({ success: true, version: policy.currentVersion, policy });
});

// ── POST /api/regulation/policy/generate ─────────────────────────────────────
// AI-generate and auto-save as v1.0 (skips if already exists)
router.post('/policy/generate', async (req, res) => {
  const { standardId, refNo, controlTitle, controlDescription, category } = req.body;
  if (!standardId || !refNo) return res.status(400).json({ error: 'standardId ve refNo zorunlu' });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(503).json({ error: 'ANTHROPIC_API_KEY yapılandırılmamış' });

  const file = policyFileName(standardId, refNo);
  const existing = readJson(file, null);
  if (existing) return res.json({ ...existing, cached: true });

  const templateResp = await new Promise(resolve => {
    const mockReq = { body: { standardId, refNo, controlTitle, controlDescription, category, useAI: true } };
    const mockRes = { json: d => resolve(d), status: () => ({ json: d => resolve(d) }) };
    // inline call to template logic
    const prompt = `Sen deneyimli bir BT uyum uzmanısın. "${controlTitle}" (${refNo}) kontrolü için kapsamlı politika hazırla. Standart: ${standardId.toUpperCase()} | Açıklama: ${controlDescription || ''}
YALNIZCA geçerli JSON: {"documentTitle":"...","purpose":"...","scope":"...","policyStatement":"...","procedures":[{"stepNo":1,"title":"...","description":"...","responsible":"...","inputs":["..."],"outputs":["..."]}],"responsibilities":[{"role":"...","duties":"..."}],"measurementCriteria":["..."],"relatedDocuments":["..."],"exceptions":"...","compliance":"...","reviewPeriod":"Yıllık"}`;
    anthropic.messages.create({ model: 'claude-opus-4-6', max_tokens: 4096, messages: [{ role: 'user', content: prompt }] })
      .then(msg => {
        const match = msg.content[0].text.trim().match(/\{[\s\S]*\}/);
        resolve(match ? { document: JSON.parse(match[0]), source: 'ai' } : { document: buildDefaultTemplate({ title: controlTitle, description: controlDescription, category }), source: 'default' });
      })
      .catch(() => resolve({ document: buildDefaultTemplate({ title: controlTitle, description: controlDescription, category }), source: 'default' }));
  });

  const policy = wrapVersioned(standardId, refNo, controlTitle, templateResp.document, 'Sistem (Claude AI)', `${templateResp.source === 'ai' ? 'Claude AI' : 'Varsayılan'} şablon ile otomatik oluşturuldu`, []);
  writeJson(file, policy);
  res.json(policy);
});

// ── GET /api/regulation/policy/status/:standardId ─────────────────────────────
// Check how many policies have been generated for a standard
// NOTE: must be registered BEFORE the /:standardId/:refNo route to avoid capture
router.get('/policy/status/:standardId', (req, res) => {
  const data = getControls(req.params.standardId);
  if (!data) return res.status(404).json({ error: 'Kontrol listesi bulunamadı' });
  const generated = data.controls.filter(c => {
    const f = policyFileName(req.params.standardId, c.refNo);
    return fs.existsSync(f);
  }).length;
  res.json({ total: data.controls.length, generated });
});

// ── GET /api/regulation/policy/:standardId/:refNo ─────────────────────────────
router.get('/policy/:standardId/:refNo', (req, res) => {
  const file = policyFileName(req.params.standardId, decodeURIComponent(req.params.refNo));
  const data = readJson(file, null);
  if (!data) return res.status(404).json({ error: 'Politika henüz oluşturulmamış' });
  // Migrate old flat format to versioned
  if (!data.versions) {
    const migrated = wrapVersioned(data.standardId || req.params.standardId, data.refNo || req.params.refNo, data.controlTitle || '', data, 'Sistem (Migrasyon)', 'Eski format migrasyonu', []);
    writeJson(file, migrated);
    return res.json(migrated);
  }
  res.json(data);
});

// ── GET /api/regulation/export/policy-doc/:standardId ────────────────────────
// Export all cached policies for a standard as a formatted HTML document
router.get('/export/policy-doc/:standardId', (req, res) => {
  const { standardId } = req.params;
  const meta = getMeta();
  const standard = meta.find(m => m.id === standardId);
  const data = getControls(standardId);

  if (!standard || !data) return res.status(404).json({ error: 'Standart bulunamadı' });

  const rawPolicies = data.controls
    .map(c => readJson(policyFileName(standardId, c.refNo), null))
    .filter(Boolean);

  if (rawPolicies.length === 0) {
    return res.status(404).json({ error: 'Henüz hiç politika oluşturulmamış. Önce politikaları oluşturun.' });
  }

  // Normalize: extract current document from versioned format
  const policies = rawPolicies.map(p => {
    const doc = p.versions ? getCurrentDocument(p) : p;
    return { ...doc, refNo: p.refNo, controlTitle: p.controlTitle, currentVersion: p.currentVersion, lastModifiedBy: p.lastModifiedBy, generatedAt: p.lastModifiedAt };
  }).filter(p => p && p.refNo);

  const html = buildPolicyHTML(standard, policies);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${standardId}-politika-prosedur.html"`);
  res.send(html);
});

// ── DELETE /api/regulation/standards/:id ─────────────────────────────────────
router.delete('/standards/:id', (req, res) => {
  const { id } = req.params;
  const meta = getMeta();
  const idx = meta.findIndex(m => m.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Standart bulunamadı' });

  // Don't delete pre-loaded standards' meta, just their controls
  const standard = meta[idx];
  if (standard.status === 'UPLOADED') {
    meta.splice(idx, 1);
    writeJson(META_FILE, meta);
  }

  const controlFile = path.join(CONTROLS_DIR, `${id}.json`);
  if (fs.existsSync(controlFile)) {
    fs.unlinkSync(controlFile);
  }

  res.json({ success: true, message: 'Kontrol listesi silindi' });
});

module.exports = router;
