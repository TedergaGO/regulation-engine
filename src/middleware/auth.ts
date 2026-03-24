import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Kimlik doğrulama gerekli' });
    return;
  }
  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret') as any;
    req.user = payload;
    req.tenantId = payload.tenantId;
    next();
  } catch {
    res.status(401).json({ error: 'Geçersiz veya süresi dolmuş token' });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || (req.user.role !== 'admin' && !req.user.isSuperAdmin)) {
    res.status(403).json({ error: 'Admin yetkisi gerekli' });
    return;
  }
  next();
}

export function requireSuperAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || !req.user.isSuperAdmin) {
    res.status(403).json({ error: 'Süper admin yetkisi gerekli' });
    return;
  }
  next();
}

export function requireEditorOrAbove(req: Request, res: Response, next: NextFunction): void {
  const allowed = ['admin', 'editor'];
  if (!req.user || (!allowed.includes(req.user.role) && !req.user.isSuperAdmin)) {
    res.status(403).json({ error: 'Editör veya üzeri yetki gerekli' });
    return;
  }
  next();
}
