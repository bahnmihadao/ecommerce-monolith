import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { config } from './config.js';
export const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: config.DATABASE_URL, connectionTimeoutMillis: 3000 }, {
    schema: new URL(config.DATABASE_URL).searchParams.get('schema') || 'public',
  }),
});
