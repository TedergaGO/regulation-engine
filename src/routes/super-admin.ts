import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db/pool';
import { requireAuth, requireSuperAdmin } from '../middleware/auth';

const router = Router();
router.use(requireAuth);
router.use(requireSuperAdmin);

// ── GET /api/super-admin/stats ───────────────────────────────────────────────
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const [tenants, users, standards, policies] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM tenants'),
      pool.query('SELECT COUNT(*) FROM users WHERE is_active = TRUE'),
      pool.query('SELECT COUNT(*) FROM standards'),
      pool.query('SELECT COUNT(*) FROM policies'),
    ]);
    res.json({
      tenantCount:   parseInt(tenants.rows[0].count),
      userCount:     parseInt(users.rows[0].count),
      standardCount: parseInt(standards.rows[0].count),
      policyCount:   parseInt(policies.rows[0].count),
    });
  } catch (err: any) {
    console.error('[SuperAdmin] Stats error:', err.message);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// ── GET /api/super-admin/tenants ─────────────────────────────────────────────
router.get('/tenants', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT t.*,
        (SELECT COUNT(*) FROM users u WHERE u.tenant_id = t.id AND u.is_active = TRUE) as user_count,
        (SELECT COUNT(*) FROM standards s WHERE s.tenant_id = t.id) as standard_count,
        (SELECT COUNT(*) FROM policies p WHERE p.tenant_id = t.id) as policy_count
      FROM tenants t
      ORDER BY t.id ASC
    `);
    res.json(result.rows.map(t => ({
      id:            t.id,
      name:          t.name,
      slug:          t.slug,
      plan:          t.plan,
      isActive:      t.is_active,
      maxUsers:      t.max_users || 10,
      contactEmail:  t.contact_email || '',
      userCount:     parseInt(t.user_count),
      standardCount: parseInt(t.standard_count),
      policyCount:   parseInt(t.policy_count),
      createdAt:     t.created_at,
      updatedAt:     t.updated_at,
    })));
  } catch (err: any) {
    console.error('[SuperAdmin] List tenants error:', err.message);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// ── POST /api/super-admin/tenants ────────────────────────────────────────────
router.post('/tenants', async (req: Request, res: Response) => {
  const { name, slug, plan, maxUsers, contactEmail, adminUsername, adminPassword, adminFullName } = req.body;
  if (!name || !slug) {
    res.status(400).json({ error: 'name ve slug zorunludur' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const tResult = await client.query(
      `INSERT INTO tenants (name, slug, plan, max_users, contact_email, is_active)
       VALUES ($1, $2, $3, $4, $5, TRUE)
       RETURNING *`,
      [name, slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'), plan || 'starter', maxUsers || 10, contactEmail || null]
    );
    const tenant = tResult.rows[0];

    if (adminUsername && adminPassword) {
      const hash = await bcrypt.hash(adminPassword, 10);
      await client.query(
        `INSERT INTO users (tenant_id, username, full_name, email, password_hash, role)
         VALUES ($1, $2, $3, $4, $5, 'admin')`,
        [tenant.id, adminUsername, adminFullName || adminUsername, contactEmail || null, hash]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({
      id: tenant.id, name: tenant.name, slug: tenant.slug, plan: tenant.plan, isActive: true,
    });
  } catch (err: any) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      res.status(409).json({ error: 'Bu slug zaten kullanımda' });
      return;
    }
    console.error('[SuperAdmin] Create tenant error:', err.message);
    res.status(500).json({ error: 'Sunucu hatası' });
  } finally {
    client.release();
  }
});

// ── PUT /api/super-admin/tenants/:id ─────────────────────────────────────────
router.put('/tenants/:id', async (req: Request, res: Response) => {
  const tenantId = parseInt(req.params.id);
  const { name, plan, maxUsers, contactEmail } = req.body;

  try {
    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;
    if (name)         { updates.push(`name = $${idx++}`);          values.push(name); }
    if (plan)         { updates.push(`plan = $${idx++}`);          values.push(plan); }
    if (maxUsers)     { updates.push(`max_users = $${idx++}`);     values.push(maxUsers); }
    if (contactEmail !== undefined) { updates.push(`contact_email = $${idx++}`); values.push(contactEmail || null); }

    if (updates.length === 0) { res.status(400).json({ error: 'Güncellenecek alan yok' }); return; }

    updates.push(`updated_at = NOW()`);
    values.push(tenantId);
    await pool.query(`UPDATE tenants SET ${updates.join(', ')} WHERE id = $${idx}`, values);
    res.json({ success: true });
  } catch (err: any) {
    console.error('[SuperAdmin] Update tenant error:', err.message);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// ── PATCH /api/super-admin/tenants/:id/status ────────────────────────────────
router.patch('/tenants/:id/status', async (req: Request, res: Response) => {
  const tenantId = parseInt(req.params.id);
  try {
    const result = await pool.query(
      'UPDATE tenants SET is_active = NOT is_active, updated_at = NOW() WHERE id = $1 RETURNING is_active',
      [tenantId]
    );
    if (result.rows.length === 0) { res.status(404).json({ error: 'Tenant bulunamadı' }); return; }
    res.json({ isActive: result.rows[0].is_active });
  } catch (err: any) {
    console.error('[SuperAdmin] Toggle tenant error:', err.message);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// ── GET /api/super-admin/tenants/:id/users ───────────────────────────────────
router.get('/tenants/:id/users', async (req: Request, res: Response) => {
  const tenantId = parseInt(req.params.id);
  try {
    const result = await pool.query(
      `SELECT id, username, full_name, email, role, is_active, is_super_admin, created_at
       FROM users WHERE tenant_id = $1 ORDER BY created_at DESC`,
      [tenantId]
    );
    res.json(result.rows.map(u => ({
      id:          u.id,
      username:    u.username,
      fullName:    u.full_name,
      email:       u.email,
      role:        u.role,
      isActive:    u.is_active,
      isSuperAdmin: u.is_super_admin,
      createdAt:   u.created_at,
    })));
  } catch (err: any) {
    console.error('[SuperAdmin] List tenant users error:', err.message);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// ── POST /api/super-admin/tenants/:id/users ──────────────────────────────────
router.post('/tenants/:id/users', async (req: Request, res: Response) => {
  const tenantId = parseInt(req.params.id);
  const { username, fullName, email, password, role, isSuperAdmin } = req.body;
  if (!username || !fullName || !password) {
    res.status(400).json({ error: 'username, fullName ve password zorunludur' });
    return;
  }

  const validRoles = ['admin', 'editor', 'viewer'];
  const userRole = validRoles.includes(role) ? role : 'editor';

  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (tenant_id, username, full_name, email, password_hash, role, is_super_admin)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, username, full_name, email, role, is_active, is_super_admin, created_at`,
      [tenantId, username, fullName, email || null, hash, userRole, isSuperAdmin === true]
    );
    const u = result.rows[0];
    res.status(201).json({
      id: u.id, username: u.username, fullName: u.full_name, email: u.email,
      role: u.role, isActive: u.is_active, isSuperAdmin: u.is_super_admin,
    });
  } catch (err: any) {
    if (err.code === '23505') {
      res.status(409).json({ error: 'Bu kullanıcı adı zaten mevcut' });
      return;
    }
    console.error('[SuperAdmin] Create user error:', err.message);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// ── GET /api/super-admin/users ───────────────────────────────────────────────
router.get('/users', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.username, u.full_name, u.email, u.role,
             u.is_active, u.is_super_admin, u.created_at,
             t.id as tenant_id, t.name as tenant_name
      FROM users u
      JOIN tenants t ON t.id = u.tenant_id
      ORDER BY u.created_at DESC
    `);
    res.json(result.rows.map(u => ({
      id:          u.id,
      username:    u.username,
      fullName:    u.full_name,
      email:       u.email,
      role:        u.role,
      isActive:    u.is_active,
      isSuperAdmin: u.is_super_admin,
      tenantId:    u.tenant_id,
      tenantName:  u.tenant_name,
      createdAt:   u.created_at,
    })));
  } catch (err: any) {
    console.error('[SuperAdmin] List all users error:', err.message);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// ── PUT /api/super-admin/users/:id ───────────────────────────────────────────
router.put('/users/:id', async (req: Request, res: Response) => {
  const userId = parseInt(req.params.id);
  const { fullName, email, role, password, isSuperAdmin } = req.body;

  try {
    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (fullName)            { updates.push(`full_name = $${idx++}`);     values.push(fullName); }
    if (email !== undefined) { updates.push(`email = $${idx++}`);         values.push(email || null); }
    if (role && ['admin','editor','viewer'].includes(role)) {
      updates.push(`role = $${idx++}`); values.push(role);
    }
    if (isSuperAdmin !== undefined) {
      updates.push(`is_super_admin = $${idx++}`); values.push(isSuperAdmin === true);
    }
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      updates.push(`password_hash = $${idx++}`); values.push(hash);
    }
    if (updates.length === 0) { res.status(400).json({ error: 'Güncellenecek alan yok' }); return; }

    updates.push(`updated_at = NOW()`);
    values.push(userId);
    await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${idx}`, values);
    res.json({ success: true });
  } catch (err: any) {
    console.error('[SuperAdmin] Update user error:', err.message);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// ── PATCH /api/super-admin/users/:id/status ──────────────────────────────────
router.patch('/users/:id/status', async (req: Request, res: Response) => {
  const userId = parseInt(req.params.id);
  try {
    const result = await pool.query(
      'UPDATE users SET is_active = NOT is_active, updated_at = NOW() WHERE id = $1 RETURNING is_active',
      [userId]
    );
    if (result.rows.length === 0) { res.status(404).json({ error: 'Kullanıcı bulunamadı' }); return; }
    res.json({ isActive: result.rows[0].is_active });
  } catch (err: any) {
    console.error('[SuperAdmin] Toggle user error:', err.message);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

export default router;
