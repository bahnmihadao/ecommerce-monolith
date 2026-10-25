import { app } from './app.js';
import { prisma } from './db.js';
import { config } from './config.js';
await prisma.$queryRaw`SELECT 1`;
const server = app.listen(config.PORT, '0.0.0.0', () => console.log('Ecommerce API listening on port ' + config.PORT));
let stopping = false;
async function shutdown() {
  if (stopping) return;
  stopping = true;
  const timer = setTimeout(() => process.exit(1), 10000);
  timer.unref();
  server.close(async () => { await prisma.$disconnect(); clearTimeout(timer); });
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

