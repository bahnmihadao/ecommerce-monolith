import jwt from 'jsonwebtoken';
import { prisma } from '../db.js';
import { config } from '../config.js';

export const publicUser = { uid: true, username: true, fullname: true, role: true, membership: true };

export async function authenticate(req, res, next) {
  const match = /^Bearer (\S+)$/i.exec(req.headers.authorization || '');
  if (!match) return res.status(401).json({ error: 'Cần Bearer token.' });
  let payload;
  try {
    payload = jwt.verify(match[1], config.JWT_SECRET, {
      algorithms: ['HS256'], issuer: 'ecommerce-monolith', audience: 'ecommerce-api',
    });
  } catch { return res.status(401).json({ error: 'Token không hợp lệ hoặc hết hạn.' }); }
  if (!/^\d+$/.test(payload.sub || '')) return res.status(401).json({ error: 'Token không hợp lệ.' });
  const uid = Number(payload.sub);
  if (!Number.isSafeInteger(uid) || uid < 1 || uid > 2147483647) return res.sendStatus(401);
  req.user = await prisma.user.findUnique({ where: { uid }, select: publicUser });
  if (!req.user) return res.status(401).json({ error: 'Tài khoản không tồn tại.' });
  next();
}

export function admin(req, res, next) {
  if (req.user?.role?.rolename !== 'ADMIN') return res.status(403).json({ error: 'Cần quyền ADMIN.' });
  next();
}

export function signToken(uid) {
  return jwt.sign({}, config.JWT_SECRET, {
    subject: String(uid), algorithm: 'HS256', expiresIn: config.JWT_EXPIRES_IN,
    issuer: 'ecommerce-monolith', audience: 'ecommerce-api',
  });
}
