import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import axios from 'axios';

import { pool, runMigrations } from './db/pool';
import authRouter from './routes/auth';
import regulationRouter from './routes/regulation';
import tenantRouter from './routes/tenants';
import superAdminRouter from './routes/super-admin';

const app = express();
const PORT = parseInt(process.env.PORT || '3000');

/* ── Middleware ── */
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

/* ── Static files ── */
app.use(express.static(path.join(__dirname, '..'), {
  index: false,
  extensions: ['html'],
}));

/* ── Routes ── */
app.use('/api/auth', authRouter);
app.use('/api/tenant', tenantRouter);
app.use('/api/regulation', regulationRouter);
app.use('/api/super-admin', superAdminRouter);

/* ── App HTML Files ── */
app.get('/regulation-engine', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'regulation-engine.html'));
});
app.get('/super-admin', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'super-admin.html'));
});

/* ── Open Data Proxies (CORS bypass for public datasets) ── */
app.get('/proxy/ibb-parks', async (req, res) => {
  const url = 'https://data.ibb.gov.tr/dataset/82e809cf-9465-407a-91cd-ac745d6fbc95' +
    '/resource/41ddb7a6-6931-4176-9614-2c2892da5307/download/yaysis_mahal_geo_data.geojson';
  try {
    const response = await axios.get(url, {
      responseType: 'stream',
      timeout: 60000,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    response.data.pipe(res);
  } catch (err: any) {
    console.error('[Proxy] ibb-parks error:', err.message);
    res.status(502).json({ error: 'Upstream fetch failed', detail: err.message });
  }
});

app.get('/proxy/izmir-co2', async (req, res) => {
  const files: Record<string, string> = {
    emissions: 'https://acikveri.bizizmir.com/dataset/89785392-da99-4d7b-a01e-6601691ac731' +
      '/resource/d2ec448e-f225-430e-9e26-2a7b51e539b6/download/co2_emisyon_deerleri_ton.csv',
    efficiency: 'https://acikveri.bizizmir.com/dataset/89785392-da99-4d7b-a01e-6601691ac731' +
      '/resource/987be479-6d1e-4016-8c74-9a340f07b577/download/1milyonyol.bas.co2_mik.ton.csv',
  };
  const file = req.query.file as string;
  if (!files[file]) {
    res.status(400).json({ error: 'Invalid file param. Use ?file=emissions or ?file=efficiency' });
    return;
  }
  try {
    const response = await axios.get(files[file], {
      responseType: 'stream',
      timeout: 30000,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    response.data.pipe(res);
  } catch (err: any) {
    console.error('[Proxy] izmir-co2 error:', err.message);
    res.status(502).json({ error: 'Upstream fetch failed', detail: err.message });
  }
});

/* ── Start ── */
async function start() {
  // Test DB connection
  try {
    await pool.query('SELECT 1');
    console.log('[DB] PostgreSQL bağlantısı başarılı');
  } catch (err: any) {
    console.error('[DB] PostgreSQL bağlantı hatası:', err.message);
    console.error('[DB] Lütfen .env dosyasında DB_* ayarlarını kontrol edin');
  }

  // Run migrations
  try {
    await runMigrations();
  } catch (err: any) {
    console.error('[DB] Migration hatası:', err.message);
    console.error('[DB] Uygulama çalışmaya devam ediyor...');
  }

  app.listen(PORT, () => {
    console.log(`\n[Server] Çalışıyor: http://localhost:${PORT}`);
    console.log(`[Server] Regülasyon Motoru: http://localhost:${PORT}/regulation-engine`);
    console.log(`[Server] API Base: http://localhost:${PORT}/api`);
    console.log('[Server] JWT Auth aktif — MSAL kaldırıldı\n');
  });
}

start();

export default app;
