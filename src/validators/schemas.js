import { z } from 'zod';

export const id = z.coerce.number().int().min(1).max(2147483647);
export const integer = z.number().int().min(0).max(2147483647);
export const password = z.string().min(12).refine(value => Buffer.byteLength(value) <= 72, 'Mật khẩu tối đa 72 byte.');
export const username = z.string().trim().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/);
export const name = max => z.string().trim().min(1).max(max);
export const price = z.string().regex(/^(0|[1-9]\d{0,7})(\.\d{1,2})?$/, 'Giá phải là chuỗi Decimal(10,2), ví dụ "150000.00".');
export const productInput = z.object({ pname: name(100), price, quantity: integer }).strict();
export const membershipInput = z.object({ mname: name(50), score: integer }).strict();

export const failure = (status, message) => Object.assign(new Error(message), { status });

export const paging = req => {
  const query = z.object({ page: id.default(1), limit: z.coerce.number().int().min(1).max(100).default(20) }).parse(req.query);
  return { skip: (query.page - 1) * query.limit, take: query.limit };
};
