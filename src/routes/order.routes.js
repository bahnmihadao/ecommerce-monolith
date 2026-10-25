import { Router } from 'express';
import { createOrder, getOrders, getOrderById, getOrderShipments, createOrderShipment } from '../controllers/order.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

export const orderRouter = Router();

orderRouter.use(authenticate);
orderRouter.post('/', createOrder);
orderRouter.get('/', getOrders);
orderRouter.get('/:oid', getOrderById);
orderRouter.get('/:oid/shipments', getOrderShipments);
orderRouter.post('/:oid/shipments', createOrderShipment);
