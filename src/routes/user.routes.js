import { Router } from 'express';
import { getMe, updateMe, getUsers, updateUser, getRoles } from '../controllers/user.controller.js';
import { authenticate, admin } from '../middlewares/auth.middleware.js';

export const userRouter = Router();

userRouter.get('/users/me', authenticate, getMe);
userRouter.patch('/users/me', authenticate, updateMe);
userRouter.get('/users', authenticate, admin, getUsers);
userRouter.patch('/users/:uid', authenticate, admin, updateUser);
userRouter.get('/roles', authenticate, admin, getRoles);
