import express from 'express';
import auth from '../middlewares/auth.js';
import customRoles from '../middlewares/customRoles.js';
import { addProduct } from '../controllers/product.controllers.js';

const router = express.Router();

router.route('/product').post(auth, customRoles('manager', 'admin'), addProduct);

export default router;
