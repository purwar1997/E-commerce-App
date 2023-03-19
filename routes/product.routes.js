import express from 'express';
import auth from '../middlewares/auth.js';
import customRoles from '../middlewares/customRoles.js';
import { addProduct, getProduct, getAllProducts } from '../controllers/product.controllers.js';

const router = express.Router();

router.route('/product').post(auth, customRoles('manager', 'admin'), addProduct);
router.route('/product/:productId').get(getProduct);
router.route('/products').get(getAllProducts);

export default router;
