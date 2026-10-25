import { Router } from 'express';
import { updateShipmentStatus } from '../controllers/shipment.controller.js';
import { authenticate, admin } from '../middlewares/auth.middleware.js';

export const shipmentRouter = Router();

shipmentRouter.patch('/:shipid', authenticate, admin, updateShipmentStatus);
