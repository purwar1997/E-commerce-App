import express from 'express';
import auth from '../middlewares/auth.js';
import customRoles from '../middlewares/customRoles.js';
import {
  createRazorpayOrder,
  createOrder,
  getUserOrders,
  getOrder,
  cancelOrder,
  adminGetAllOrders,
  adminUpdateOrder,
  adminDeleteOrder,
} from '../controllers/order.controllers.js';

const router = express.Router();

router.route('/razorpayOrder').post(auth, createRazorpayOrder);
router.route('/order').post(auth, createOrder);
router.route('/orders').get(auth, getUserOrders);
router.route('/order/:orderId').get(auth, getOrder).put(auth, cancelOrder);
router.route('/admin/orders').get(auth, customRoles('admin'), adminGetAllOrders);
router
  .route('/admin/order/:orderId')
  .put(auth, customRoles('admin'), adminUpdateOrder)
  .delete(auth, customRoles('admin'), adminDeleteOrder);

export default router;
