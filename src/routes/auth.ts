import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db/pool';
import { requireAuth } from '../middleware/auth';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: 'Kullanıcı adı ve şifre zorunludur' });
    return;
  }

  try {
    const result = await pool.query(
      `SELECT u.*, t.name as tenant_name, t.slug as tenant_slug
       FROM users u
       JOIN tenants t ON t.id = u.tenant_id
       WHERE u.username = $1 AND u.is_active = TRUE
         AND (t.is_active = TRUE OR u.is_super_admin = TRUE)`,
      [username]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Geçersiz kullanıcı adı veya şifre' });
      return;
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ error: 'Geçersiz kullanıcı adı veya şifre' });
      return;
    }

    const payload = {
      sub: user.id,
      username: user.username,
      fullName: user.full_name,
      role: user.role,
      tenantId: user.tenant_id,
      isSuperAdmin: user.is_super_admin === true,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || 'dev-secret', {
      expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    } as jwt.SignOptions);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        tenantId: user.tenant_id,
        tenantName: user.tenant_name,
        tenantSlug: user.tenant_slug,
        isSuperAdmin: user.is_super_admin === true,
      },
    });
  } catch (err: any) {
    console.error('[Auth] Login error:', err.message);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.username, u.full_name, u.email, u.role, u.tenant_id,
              u.is_super_admin, t.name as tenant_name, t.slug as tenant_slug
       FROM users u
       JOIN tenants t ON t.id = u.tenant_id
       WHERE u.id = $1 AND u.is_active = TRUE`,
      [req.user!.sub]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Kullanıcı bulunamadı' });
      return;
    }

    const user = result.rows[0];
    res.json({
      id: user.id,
      username: user.username,
      fullName: user.full_name,
      email: user.email,
      role: user.role,
      tenantId: user.tenant_id,
      tenantName: user.tenant_name,
      tenantSlug: user.tenant_slug,
      isSuperAdmin: user.is_super_admin === true,
    });
  } catch (err: any) {
    console.error('[Auth] Me error:', err.message);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// POST /api/auth/logout
router.post('/logout', (_req: Request, res: Response) => {
  res.json({ success: true });
});

// POST /api/auth/change-password
router.post('/change-password', requireAuth, async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: 'Mevcut şifre ve yeni şifre zorunludur' });
    return;
  }

  if (newPassword.length < 6) {
    res.status(400).json({ error: 'Yeni şifre en az 6 karakter olmalıdır' });
    return;
  }

  try {
    const result = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user!.sub]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Kullanıcı bulunamadı' });
      return;
    }

    const valid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!valid) {
      res.status(401).json({ error: 'Mevcut şifre yanlış' });
      return;
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.user!.sub]);

    res.json({ success: true, message: 'Şifre başarıyla güncellendi' });
  } catch (err: any) {
    console.error('[Auth] Change password error:', err.message);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

export default router;
