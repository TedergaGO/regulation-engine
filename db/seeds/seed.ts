/**
 * Seed script — çalıştırma: npx ts-node db/seeds/seed.ts
 */
import dotenv from 'dotenv';
dotenv.config({ path: require('path').join(__dirname, '../../.env') });

import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'regulation_engine',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

async function main() {
  const client = await pool.connect();

  try {
    console.log('[Seed] Başlıyor...');

    // 1. Run migrations
    const sqlPath = path.join(__dirname, '../migrations/001_initial.sql');
    if (fs.existsSync(sqlPath)) {
      const sql = fs.readFileSync(sqlPath, 'utf8');
      await client.query(sql);
      console.log('[Seed] Migrasyon uygulandı');
    }

    await client.query('BEGIN');

    // 2. Default tenant
    const tenantResult = await client.query(
      `INSERT INTO tenants (name, slug, plan, is_active)
       VALUES ('Demo Firma', 'demo', 'starter', TRUE)
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`
    );
    const tenantId: number = tenantResult.rows[0].id;
    console.log(`[Seed] Tenant: id=${tenantId}`);

    // 3. Admin user
    const pwHash = await bcrypt.hash('Admin@2024!', 10);
    await client.query(
      `INSERT INTO users (tenant_id, username, full_name, email, password_hash, role, is_active)
       VALUES ($1, 'admin', 'Sistem Yöneticisi', 'admin@demo.local', $2, 'admin', TRUE)
       ON CONFLICT (tenant_id, username) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
      [tenantId, pwHash]
    );
    console.log('[Seed] Admin kullanıcı oluşturuldu: admin / Admin@2024!');

    // 4. Standards
    const DATA_DIR = path.join(__dirname, '../../data/regulation');
    const metaPath = path.join(DATA_DIR, 'standards-meta.json');
    let standardCount = 0;

    if (fs.existsSync(metaPath)) {
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      for (const s of meta) {
        await client.query(
          `INSERT INTO standards (id, tenant_id, name, short_name, category, version, published_by, description, ref_format, control_count, status, color, icon)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
           ON CONFLICT (id, tenant_id) DO UPDATE SET
             name = EXCLUDED.name, short_name = EXCLUDED.short_name,
             category = EXCLUDED.category, version = EXCLUDED.version,
             control_count = EXCLUDED.control_count, status = EXCLUDED.status,
             color = EXCLUDED.color, icon = EXCLUDED.icon`,
          [
            s.id, tenantId, s.name, s.shortName || s.name,
            s.category || 'Genel', s.version || '—',
            s.publishedBy || '—', s.description || '',
            s.refFormat || '—', s.controlCount || 0,
            s.status || 'PRELOADED', s.color || '#555555', s.icon || '📋',
          ]
        );
        standardCount++;
      }
      console.log(`[Seed] ${standardCount} standart eklendi`);
    } else {
      console.warn('[Seed] standards-meta.json bulunamadı, atlanıyor...');
    }

    // 5. Controls
    const CONTROLS_DIR = path.join(DATA_DIR, 'controls');
    let controlCount = 0;

    if (fs.existsSync(CONTROLS_DIR)) {
      const files = fs.readdirSync(CONTROLS_DIR).filter(f => f.endsWith('.json'));
      for (const file of files) {
        const standardId = path.basename(file, '.json');
        try {
          const data = JSON.parse(fs.readFileSync(path.join(CONTROLS_DIR, file), 'utf8'));
          const controls = data.controls || [];

          for (const ctrl of controls) {
            await client.query(
              `INSERT INTO controls (tenant_id, standard_id, ref_no, category, title, description, type, priority, keywords)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
               ON CONFLICT (tenant_id, standard_id, ref_no) DO UPDATE SET
                 category = EXCLUDED.category, title = EXCLUDED.title,
                 description = EXCLUDED.description, type = EXCLUDED.type,
                 priority = EXCLUDED.priority, keywords = EXCLUDED.keywords`,
              [
                tenantId, standardId,
                ctrl.refNo || ctrl.ref_no,
                ctrl.category || 'Genel',
                ctrl.title, ctrl.description || '',
                ctrl.type || 'ZORUNLU',
                ctrl.priority || '🟡 ORTA',
                ctrl.keywords || [],
              ]
            );
            controlCount++;
          }

          // Update control_count in standards
          await client.query(
            'UPDATE standards SET control_count = $1, generated_at = $2 WHERE id = $3 AND tenant_id = $4',
            [controls.length, data.generatedAt || new Date().toISOString().split('T')[0], standardId, tenantId]
          );
        } catch (e: any) {
          console.warn(`[Seed] Kontrol yüklenirken hata (${file}):`, e.message);
        }
      }
      console.log(`[Seed] ${controlCount} kontrol eklendi`);
    } else {
      console.warn('[Seed] controls/ dizini bulunamadı, atlanıyor...');
    }

    // 6. Industry domains
    const domainsPath = path.join(DATA_DIR, 'industry-domains.json');
    let domainCount = 0;

    if (fs.existsSync(domainsPath)) {
      const domains = JSON.parse(fs.readFileSync(domainsPath, 'utf8'));
      for (let i = 0; i < domains.length; i++) {
        const d = domains[i];
        await client.query(
          `INSERT INTO industry_domains (id, tenant_id, name, icon, color, description, primary_standards, supporting_standards, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (id, tenant_id) DO UPDATE SET
             name = EXCLUDED.name, icon = EXCLUDED.icon, color = EXCLUDED.color,
             description = EXCLUDED.description,
             primary_standards = EXCLUDED.primary_standards,
             supporting_standards = EXCLUDED.supporting_standards,
             sort_order = EXCLUDED.sort_order`,
          [
            d.id, tenantId, d.name, d.icon || '📁', d.color || '#555555',
            d.description || '', d.primaryStandards || [], d.supportingStandards || [],
            i,
          ]
        );
        domainCount++;
      }
      console.log(`[Seed] ${domainCount} sektör domaini eklendi`);
    } else {
      console.warn('[Seed] industry-domains.json bulunamadı, atlanıyor...');
    }

    // 7. Existing policies from JSON files
    const POLICIES_DIR = path.join(DATA_DIR, 'policies');
    let policyCount = 0;

    if (fs.existsSync(POLICIES_DIR)) {
      const files = fs.readdirSync(POLICIES_DIR).filter(f => f.endsWith('.json'));
      for (const file of files) {
        try {
          const data = JSON.parse(fs.readFileSync(path.join(POLICIES_DIR, file), 'utf8'));

          // Parse filename: iso27001_A_5_1.json → standardId=iso27001, refNo=A.5.1
          const baseName = path.basename(file, '.json');
          const parts = baseName.split('_');
          const standardId = parts[0];
          const refNo = parts.slice(1).join('.').replace(/_/g, '.');

          const controlTitle = data.controlTitle || data.refNo || refNo;
          const currentVersion = data.currentVersion || '1.0';
          const lastModifiedBy = data.lastModifiedBy || 'Sistem';

          // Insert/update policy
          const polResult = await client.query(
            `INSERT INTO policies (tenant_id, standard_id, ref_no, control_title, current_version, last_modified_by, last_modified_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW())
             ON CONFLICT (tenant_id, standard_id, ref_no) DO UPDATE SET
               control_title = EXCLUDED.control_title,
               current_version = EXCLUDED.current_version,
               last_modified_by = EXCLUDED.last_modified_by,
               last_modified_at = NOW()
             RETURNING id`,
            [tenantId, standardId, refNo, controlTitle, currentVersion, lastModifiedBy]
          );
          const policyId = polResult.rows[0].id;

          // Insert versions
          const versions = data.versions || [];
          if (versions.length === 0 && data.purpose) {
            // Old flat format — wrap as v1.0
            versions.push({
              version: '1.0',
              createdBy: lastModifiedBy,
              note: 'Mevcut JSON formatından migrate edildi',
              document: data,
            });
          }

          for (const ver of versions) {
            await client.query(
              `INSERT INTO policy_versions (policy_id, version, created_by, note, document)
               VALUES ($1, $2, $3, $4, $5)
               ON CONFLICT (policy_id, version) DO UPDATE SET
                 document = EXCLUDED.document, created_by = EXCLUDED.created_by`,
              [policyId, ver.version, ver.createdBy || 'Sistem', ver.note || '', JSON.stringify(ver.document || {})]
            );
          }

          policyCount++;
        } catch (e: any) {
          console.warn(`[Seed] Politika yüklenirken hata (${file}):`, e.message);
        }
      }
      console.log(`[Seed] ${policyCount} politika eklendi`);
    } else {
      console.log('[Seed] policies/ dizini yok, atlanıyor...');
    }

    await client.query('COMMIT');

    console.log('\n[Seed] ✓ Tamamlandı!');
    console.log(`  Standart: ${standardCount}`);
    console.log(`  Kontrol: ${controlCount}`);
    console.log(`  Domain: ${domainCount}`);
    console.log(`  Politika: ${policyCount}`);
    console.log('\n[Seed] Giriş bilgileri:');
    console.log('  Kullanıcı: admin');
    console.log('  Şifre: Admin@2024!');
    console.log('  URL: http://localhost:3000/regulation-engine\n');
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('[Seed] HATA — ROLLBACK yapıldı:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
