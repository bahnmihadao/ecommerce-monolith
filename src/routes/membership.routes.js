import { Router } from 'express';
import { getMemberships, createMembership, updateMembership, deleteMembership } from '../controllers/membership.controller.js';
import { authenticate, admin } from '../middlewares/auth.middleware.js';

export const membershipRouter = Router();

membershipRouter.get('/', authenticate, getMemberships);
membershipRouter.post('/', authenticate, admin, createMembership);
membershipRouter.put('/:mid', authenticate, admin, updateMembership);
membershipRouter.delete('/:mid', authenticate, admin, deleteMembership);
