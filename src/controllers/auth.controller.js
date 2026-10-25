import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../db.js';
import { publicUser, signToken } from '../middlewares/auth.middleware.js';
import { username, name, password, failure } from '../validators/schemas.js';

export async function register(req, res) {
  const body = z.object({ username, fullname: name(100), password }).strict().parse(req.body);
  const [role, membership] = await Promise.all([
    prisma.role.findFirst({ where: { rolename: { in: ['normal', 'CUSTOMER', 'NORMAL'] } }, orderBy: { roleid: 'asc' } }),
    prisma.memberShip.findFirst({ where: { mname: { in: ['normal', 'BASIC', 'NORMAL'] } }, orderBy: { mid: 'asc' } }),
  ]);
  if (!role || !membership) throw failure(503, 'Cần chạy seed trước.');
  const user = await prisma.user.create({
    data: {
      ...body,
      password: await bcrypt.hash(body.password, 12),
      roleid: role.roleid,
      mid: membership.mid,
    },
    select: publicUser,
  });
  res.status(201).json(user);
}

export async function login(req, res) {
  const body = z.object({ username, password: z.string().min(1).max(100) }).strict().parse(req.body);
  const user = await prisma.user.findUnique({ where: { username: body.username } });
  if (!user || !await bcrypt.compare(body.password, user.password)) {
    throw failure(401, 'Sai tài khoản hoặc mật khẩu.');
  }
  res.json({ accessToken: signToken(user.uid), tokenType: 'Bearer' });
}
