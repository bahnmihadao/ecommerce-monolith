import { Router } from 'express';
import { register, login } from '../controllers/auth.controller.js';
import { authLimiter } from '../middlewares/rateLimit.middleware.js';

export const authRouter = Router();

authRouter.use(authLimiter);
authRouter.post('/register', register);
authRouter.post('/login', login);
