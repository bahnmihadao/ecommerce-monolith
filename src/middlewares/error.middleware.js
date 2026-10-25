import { z } from 'zod';

export function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Endpoint không tồn tại.' });
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  if (err instanceof z.ZodError) {
    return res.status(400).json({
      error: 'Dữ liệu không hợp lệ.',
      details: err.issues.map(i => ({ path: i.path, message: i.message })),
    });
  }
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON không hợp lệ.' });
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Body vượt 32KB.' });
  if (err.status) return res.status(err.status).json({ error: err.message });
  if (err.code === 'P2002') return res.status(409).json({ error: 'Dữ liệu định danh đã tồn tại.' });
  if (err.code === 'P2025') return res.status(404).json({ error: 'Không tìm thấy dữ liệu.' });
  if (err.code === 'P2003') return res.status(409).json({ error: 'Khóa ngoại không hợp lệ hoặc dữ liệu đang được sử dụng.' });
  if (err.code === 'P2034') return res.status(409).json({ error: 'Có giao dịch đồng thời; vui lòng thử lại.' });
  console.error('Request failed:', err.name, err.code || '');
  res.status(500).json({ error: 'Lỗi hệ thống.' });
}
