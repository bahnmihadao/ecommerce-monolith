import { z } from 'zod';
import { prisma } from '../db.js';
import { id, failure } from '../validators/schemas.js';

export async function updateShipmentStatus(req, res) {
  const shipid = id.parse(req.params.shipid);
  const { status } = z.object({ status: z.enum(['SHIPPED', 'DELIVERED', 'CANCELLED']) }).strict().parse(req.body);
  const allowedFrom = { SHIPPED: 'PENDING', DELIVERED: 'SHIPPED', CANCELLED: 'PENDING' };
  const existing = await prisma.shipment.findUnique({ where: { shipid } });
  if (!existing) throw failure(404, 'Không tìm thấy vận chuyển.');
  const changed = await prisma.shipment.updateMany({ where: { shipid, status: allowedFrom[status] }, data: { status } });
  if (changed.count !== 1) throw failure(409, 'Không được chuyển trạng thái vận chuyển như vậy.');
  res.json(await prisma.shipment.findUnique({ where: { shipid } }));
}
