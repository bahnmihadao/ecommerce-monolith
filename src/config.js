import 'dotenv/config';
import { z } from 'zod';
export const config = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.enum(['15m', '30m', '1h', '2h']).default('1h'),
}).parse(process.env);

