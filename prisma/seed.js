import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/db.js';
try {
  if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD.length < 12
      || Buffer.byteLength(process.env.ADMIN_PASSWORD) > 72) {
    throw new Error('ADMIN_USERNAME và ADMIN_PASSWORD (12-72 byte) bắt buộc khi seed.');
  }
  const adminRole = await prisma.role.upsert({ where: { rolename: 'ADMIN' }, update: {}, create: { rolename: 'ADMIN' } });
  await prisma.role.upsert({ where: { rolename: 'normal' }, update: {}, create: { rolename: 'normal' } });
  await prisma.role.upsert({ where: { rolename: 'CUSTOMER' }, update: {}, create: { rolename: 'CUSTOMER' } });
  const defaultMembership = await prisma.memberShip.upsert({ where: { mname: 'normal' }, update: { score: 10 }, create: { mname: 'normal', score: 10 } });
  await prisma.memberShip.upsert({ where: { mname: 'BASIC' }, update: { score: 10 }, create: { mname: 'BASIC', score: 10 } });
  const existing = await prisma.user.findUnique({ where: { username: process.env.ADMIN_USERNAME } });
  if (existing && existing.roleid !== adminRole.roleid) throw new Error('Tên ADMIN đã thuộc tài khoản khác.');
  if (!existing) await prisma.user.create({ data: {
    username: process.env.ADMIN_USERNAME, fullname: 'Quản trị viên',
    password: await bcrypt.hash(process.env.ADMIN_PASSWORD, 12), roleid: adminRole.roleid, mid: defaultMembership.mid,
  } });
  console.log('Seed hoàn tất: ADMIN, normal, CUSTOMER, MemberShip (score 10) và tài khoản quản trị.');
} finally { await prisma.$disconnect(); }

