import { prisma } from '../db.js';
import { id, productInput, failure, paging } from '../validators/schemas.js';

export async function getProducts(req, res) {
  res.json(await prisma.product.findMany({ ...paging(req), orderBy: { pid: 'asc' } }));
}

export async function getProductById(req, res) {
  const product = await prisma.product.findUnique({ where: { pid: id.parse(req.params.pid) } });
  if (!product) throw failure(404, 'Không tìm thấy sản phẩm.');
  res.json(product);
}

export async function createProduct(req, res) {
  res.status(201).json(await prisma.product.create({ data: productInput.parse(req.body) }));
}

export async function updateProduct(req, res) {
  res.json(await prisma.product.update({ where: { pid: id.parse(req.params.pid) }, data: productInput.parse(req.body) }));
}

export async function deleteProduct(req, res) {
  await prisma.product.delete({ where: { pid: id.parse(req.params.pid) } });
  res.sendStatus(204);
}
