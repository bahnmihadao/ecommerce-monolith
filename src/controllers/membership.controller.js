import { prisma } from '../db.js';
import { id, membershipInput, failure, paging } from '../validators/schemas.js';

export async function getMemberships(req, res) {
  res.json(await prisma.memberShip.findMany({ ...paging(req), orderBy: { mid: 'asc' } }));
}

export async function createMembership(req, res) {
  res.status(201).json(await prisma.memberShip.create({ data: membershipInput.parse(req.body) }));
}

export async function updateMembership(req, res) {
  const mid = id.parse(req.params.mid);
  const body = membershipInput.parse(req.body);
  const existing = await prisma.memberShip.findUnique({ where: { mid } });
  if (existing?.mname === 'BASIC') throw failure(409, 'Hạng BASIC được dùng cho đăng ký, không được sửa.');
  res.json(await prisma.memberShip.update({ where: { mid }, data: body }));
}

export async function deleteMembership(req, res) {
  const mid = id.parse(req.params.mid);
  const existing = await prisma.memberShip.findUnique({ where: { mid } });
  if (existing?.mname === 'BASIC') throw failure(409, 'Không xóa hạng BASIC.');
  await prisma.memberShip.delete({ where: { mid } });
  res.sendStatus(204);
}
