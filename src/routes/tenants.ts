import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { pool } from '../db/pool';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// GET /api/tenant/me
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT id, name, slug, logo_mimetype, settings, plan, is_active, created_at FROM tenants WHERE id = $1',
      [req.tenantId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Tenant bulunamadı' });
      return;
    }

    const tenant = result.rows[0];
    res.json({
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      hasLogo: !!(tenant.logo_mimetype),
      settings: tenant.settings || {},
      plan: tenant.plan,
      isActive: tenant.is_active,
      createdAt: tenant.created_at,
    });
  } catch (err: any) {
    console.error('[Tenant] Me error:', err.message);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// PUT /api/tenant/me
router.put('/me', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const { name, settings } = req.body;

  try {
    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (name) {
      updates.push(`name = $${idx++}`);
      values.push(name);
    }
    if (settings) {
      updates.push(`settings = $${idx++}`);
      values.push(JSON.stringify(settings));
    }

    if (updates.length === 0) {
      res.status(400).json({ error: 'Güncellenecek alan bulunamadı' });
      return;
    }

    values.push(req.tenantId);
    await pool.query(
      `UPDATE tenants SET ${updates.join(', ')} WHERE id = $${idx}`,
      values
    );

    res.json({ success: true, message: 'Tenant güncellendi' });
  } catch (err: any) {
    console.error('[Tenant] Update error:', err.message);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// POST /api/tenant/logo
router.post('/logo', requireAuth, requireAdmin, upload.single('logo'), async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'Logo dosyası yüklenmedi' });
    return;
  }

  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/svg+xml', 'image/webp'];
  if (!allowedTypes.includes(req.file.mimetype)) {
    res.status(400).json({ error: 'Geçersiz dosya tipi. PNG, JPEG, GIF, SVG veya WebP yükleyin.' });
    return;
  }

  try {
    await pool.query(
      'UPDATE tenants SET logo_data = $1, logo_mimetype = $2 WHERE id = $3',
      [req.file.buffer, req.file.mimetype, req.tenantId]
    );

    res.json({ success: true, message: 'Logo yüklendi' });
  } catch (err: any) {
    console.error('[Tenant] Logo upload error:', err.message);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// GET /api/tenant/logo/:tenantId
router.get('/logo/:tenantId', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT logo_data, logo_mimetype FROM tenants WHERE id = $1 AND is_active = TRUE',
      [parseInt(req.params.tenantId)]
    );

    if (result.rows.length === 0 || !result.rows[0].logo_data) {
      res.status(404).json({ error: 'Logo bulunamadı' });
      return;
    }

    const { logo_data, logo_mimetype } = result.rows[0];
    res.setHeader('Content-Type', logo_mimetype);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(logo_data);
  } catch (err: any) {
    console.error('[Tenant] Logo get error:', err.message);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// GET /api/tenant/users
router.get('/users', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, username, full_name, email, role, is_active, created_at
       FROM users WHERE tenant_id = $1 ORDER BY created_at DESC`,
      [req.tenantId]
    );

    res.json(result.rows.map(u => ({
      id: u.id,
      username: u.username,
      fullName: u.full_name,
      email: u.email,
      role: u.role,
      isActive: u.is_active,
      createdAt: u.created_at,
    })));
  } catch (err: any) {
    console.error('[Tenant] List users error:', err.message);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// POST /api/tenant/users
router.post('/users', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const { username, fullName, email, password, role } = req.body;
  if (!username || !fullName || !password) {
    res.status(400).json({ error: 'username, fullName ve password zorunludur' });
    return;
  }

  const validRoles = ['admin', 'editor', 'viewer'];
  const userRole = validRoles.includes(role) ? role : 'editor';

  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (tenant_id, username, full_name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, username, full_name, email, role, is_active, created_at`,
      [req.tenantId, username, fullName, email || null, hash, userRole]
    );

    const user = result.rows[0];
    res.status(201).json({
      id: user.id,
      username: user.username,
      fullName: user.full_name,
      email: user.email,
      role: user.role,
      isActive: user.is_active,
      createdAt: user.created_at,
    });
  } catch (err: any) {
    if (err.code === '23505') {
      res.status(409).json({ error: 'Bu kullanıcı adı zaten mevcut' });
      return;
    }
    console.error('[Tenant] Create user error:', err.message);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// PUT /api/tenant/users/:id
router.put('/users/:id', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const { fullName, email, role, password } = req.body;
  const userId = parseInt(req.params.id);

  try {
    // Verify user belongs to this tenant
    const check = await pool.query(
      'SELECT id FROM users WHERE id = $1 AND tenant_id = $2',
      [userId, req.tenantId]
    );
    if (check.rows.length === 0) {
      res.status(404).json({ error: 'Kullanıcı bulunamadı' });
      return;
    }

    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (fullName) { updates.push(`full_name = $${idx++}`); values.push(fullName); }
    if (email !== undefined) { updates.push(`email = $${idx++}`); values.push(email || null); }
    if (role && ['admin', 'editor', 'viewer'].includes(role)) {
      updates.push(`role = $${idx++}`); values.push(role);
    }
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      updates.push(`password_hash = $${idx++}`); values.push(hash);
    }

    if (updates.length === 0) {
      res.status(400).json({ error: 'Güncellenecek alan bulunamadı' });
      return;
    }

    values.push(userId);
    await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx}`,
      values
    );

    res.json({ success: true, message: 'Kullanıcı güncellendi' });
  } catch (err: any) {
    console.error('[Tenant] Update user error:', err.message);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// PATCH /api/tenant/users/:id/status (toggle active)
router.patch('/users/:id/status', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const userId = parseInt(req.params.id);
  if (userId === req.user!.sub) {
    res.status(400).json({ error: 'Kendi hesabınızın durumunu değiştiremezsiniz' });
    return;
  }
  try {
    const check = await pool.query(
      'SELECT id FROM users WHERE id = $1 AND tenant_id = $2',
      [userId, req.tenantId]
    );
    if (check.rows.length === 0) { res.status(404).json({ error: 'Kullanıcı bulunamadı' }); return; }
    const result = await pool.query(
      'UPDATE users SET is_active = NOT is_active WHERE id = $1 RETURNING is_active',
      [userId]
    );
    res.json({ isActive: result.rows[0].is_active, success: true });
  } catch (err: any) {
    console.error('[Tenant] Toggle user error:', err.message);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// DELETE /api/tenant/users/:id (soft delete)
router.delete('/users/:id', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const userId = parseInt(req.params.id);

  try {
    const check = await pool.query(
      'SELECT id FROM users WHERE id = $1 AND tenant_id = $2',
      [userId, req.tenantId]
    );
    if (check.rows.length === 0) {
      res.status(404).json({ error: 'Kullanıcı bulunamadı' });
      return;
    }

    // Prevent self-deletion
    if (userId === req.user!.sub) {
      res.status(400).json({ error: 'Kendi hesabınızı silemezsiniz' });
      return;
    }

    await pool.query(
      'UPDATE users SET is_active = FALSE WHERE id = $1',
      [userId]
    );

    res.json({ success: true, message: 'Kullanıcı devre dışı bırakıldı' });
  } catch (err: any) {
    console.error('[Tenant] Delete user error:', err.message);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

export default router;
