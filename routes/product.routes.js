import express from 'express';
import auth from '../middlewares/auth.js';
import customRoles from '../middlewares/customRoles.js';
import {
  addProduct,
  updateProduct,
  deleteProduct,
  getProduct,
  getAllProducts,
} from '../controllers/product.controllers.js';

const router = express.Router();

router.route('/product').post(auth, customRoles('manager', 'admin'), addProduct);
router
  .route('/product/:productId')
  .put(auth, customRoles('manager', 'admin'), updateProduct)
  .delete(auth, customRoles('manager', 'admin'), deleteProduct)
  .get(getProduct);
router.route('/products').get(getAllProducts);

export default router;
