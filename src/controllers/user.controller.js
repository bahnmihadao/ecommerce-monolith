import { z } from 'zod';
import { prisma } from '../db.js';
import { publicUser } from '../middlewares/auth.middleware.js';
import { id, integer, name, failure, paging } from '../validators/schemas.js';

export function getMe(req, res) {
  res.json(req.user);
}

export async function updateMe(req, res) {
  const body = z.object({ fullname: name(100) }).strict().parse(req.body);
  res.json(await prisma.user.update({ where: { uid: req.user.uid }, data: body, select: publicUser }));
}

export async function getUsers(req, res) {
  res.json(await prisma.user.findMany({ ...paging(req), orderBy: { uid: 'asc' }, select: publicUser }));
}

export async function updateUser(req, res) {
  const uid = id.parse(req.params.uid);
  const body = z.object({ roleid: integer.min(1).optional(), mid: integer.min(1).optional() }).strict()
    .refine(body => Object.keys(body).length > 0).parse(req.body);
  if (uid === req.user.uid && body.roleid !== undefined) throw failure(409, 'Không tự đổi quyền của chính mình.');
  res.json(await prisma.user.update({ where: { uid }, data: body, select: publicUser }));
}

export async function getRoles(req, res) {
  res.json(await prisma.role.findMany({ orderBy: { roleid: 'asc' } }));
}
