import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../db.js';
import { id, integer, failure, paging } from '../validators/schemas.js';

const fullOrder = { details: { orderBy: { pid: 'asc' } }, shipments: true };

const serializeOrder = order => ({
  ...order,
  total: order.details.reduce((sum, item) => sum.plus(item.unit_price.mul(item.qty)), new Prisma.Decimal(0)).toFixed(2),
});

async function accessibleOrder(req) {
  const order = await prisma.order.findFirst({
    where: { oid: id.parse(req.params.oid), ...(req.user.role.rolename === 'ADMIN' ? {} : { uid: req.user.uid }) },
    include: fullOrder,
  });
  if (!order) throw failure(404, 'Không tìm thấy đơn hàng.');
  return order;
}

export async function createOrder(req, res) {
  const body = z.object({
    items: z.array(z.object({ pid: integer.min(1), qty: integer.min(1) }).strict()).min(1).max(100),
  }).strict().parse(req.body);
  if (new Set(body.items.map(item => item.pid)).size !== body.items.length) {
    throw failure(400, 'Không lặp pid trong đơn.');
  }

  // Khóa sản phẩm theo thứ tự cố định và dùng SERIALIZABLE để tránh bán âm kho / giá cũ
  const order = await prisma.$transaction(async tx => {
    const details = [];
    for (const item of [...body.items].sort((a, b) => a.pid - b.pid)) {
      const product = await tx.product.findUnique({ where: { pid: item.pid } });
      if (!product) throw failure(404, 'Sản phẩm không tồn tại: ' + item.pid);
      const changed = await tx.product.updateMany({
        where: { pid: item.pid, quantity: { gte: item.qty } },
        data: { quantity: { decrement: item.qty } },
      });
      if (changed.count !== 1) throw failure(409, 'Không đủ tồn kho: ' + item.pid);
      details.push({ pid: item.pid, qty: item.qty, unit_price: product.price });
    }
    return tx.order.create({
      data: {
        uid: req.user.uid,
        details: { create: details },
        shipments: { create: [{ status: 'PENDING' }] },
      },
      include: fullOrder,
    });
  }, { isolationLevel: 'Serializable', timeout: 10000 });

  res.status(201).json(serializeOrder(order));
}

export async function getOrders(req, res) {
  const orders = await prisma.order.findMany({
    where: req.user.role.rolename === 'ADMIN' ? {} : { uid: req.user.uid },
    ...paging(req), orderBy: { oid: 'desc' }, include: fullOrder,
  });
  res.json(orders.map(serializeOrder));
}

export async function getOrderById(req, res) {
  res.json(serializeOrder(await accessibleOrder(req)));
}

export async function getOrderShipments(req, res) {
  res.json((await accessibleOrder(req)).shipments);
}

export async function createOrderShipment(req, res) {
  z.object({}).strict().parse(req.body ?? {});
  const order = await accessibleOrder(req);
  res.status(201).json(await prisma.shipment.create({ data: { oid: order.oid, status: 'PENDING' } }));
}
