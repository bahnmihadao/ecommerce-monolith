import { prisma } from '../db.js';

export function getWelcome(req, res) {
  res.json({ name: 'Ecommerce Monolith MVP', health: '/health' });
}

export function getHealthLive(req, res) {
  res.json({ status: 'alive' });
}

export async function getHealth(req, res) {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'healthy', database: 'connected' });
  } catch {
    res.status(503).json({ status: 'unhealthy', database: 'disconnected' });
  }
}
