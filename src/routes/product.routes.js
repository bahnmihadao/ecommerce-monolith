import { Router } from 'express';
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct } from '../controllers/product.controller.js';
import { authenticate, admin } from '../middlewares/auth.middleware.js';

export const productRouter = Router();

productRouter.get('/', getProducts);
productRouter.get('/:pid', getProductById);
productRouter.post('/', authenticate, admin, createProduct);
productRouter.put('/:pid', authenticate, admin, updateProduct);
productRouter.delete('/:pid', authenticate, admin, deleteProduct);
