import express from 'express';
import helmet from 'helmet';

import { healthRouter } from './routes/health.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { userRouter } from './routes/user.routes.js';
import { productRouter } from './routes/product.routes.js';
import { orderRouter } from './routes/order.routes.js';
import { shipmentRouter } from './routes/shipment.routes.js';
import { membershipRouter } from './routes/membership.routes.js';
import { notFoundHandler, errorHandler } from './middlewares/error.middleware.js';

export const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(express.json({ limit: '32kb' }));

// Mount Routes
app.use('/', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api', userRouter);
app.use('/api/memberships', membershipRouter);
app.use('/api/products', productRouter);
app.use('/api/orders', orderRouter);
app.use('/api/shipments', shipmentRouter);

// Error Handling Middlewares
app.use(notFoundHandler);
app.use(errorHandler);
