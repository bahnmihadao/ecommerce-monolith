import { Router } from 'express';
import { getWelcome, getHealthLive, getHealth } from '../controllers/health.controller.js';

export const healthRouter = Router();

healthRouter.get('/', getWelcome);
healthRouter.get('/health/live', getHealthLive);
healthRouter.get('/health', getHealth);
