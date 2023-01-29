import express from 'express';

import {
  signup,
  login,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
  getProfile,
} from '../controllers/auth.controllers';

import {
  createCategory,
  updateCategory,
  deleteCategory,
  getCategory,
  getCategories,
} from '../controllers/category.controllers';

import {
  createCoupon,
  deleteCoupon,
  deactivateCoupon,
  getAllCoupons,
} from '../controllers/coupon.controllers';

import {
  addProduct,
  updateProduct,
  deleteProduct,
  getProduct,
  getAllProducts,
} from '../controllers/product.controllers';

import {
  generateRazorpayOrderID,
  createOrder,
  cancelOrder,
  getOrder,
  getAllOrders,
  changeOrderAddress,
  changeOrderContactNo,
} from '../controllers/order.controllers';

import { auth } from '../middlewares/auth';

const router = express.Router();

router.post('/api/auth/signup', signup);
router.post('/api/auth/login', login);
router.get('/api/auth/logout', logout);
router.post('/api/auth/password/forgot', forgotPassword);
router.put('/api/auth/password/forgot/reset/:resetPasswordToken', resetPassword);
router.put('/api/auth/password/change', changePassword);
router.get('/api/auth/Profile', auth, getProfile);

router.post('/api/category/create', createCategory);
router.put('/api/category/update/:categoryId', updateCategory);
router.delete('/api/category/delete/:categoryId', deleteCategory);
router.get('/api/category/:categoryId', getCategory);
router.get('/api/categories', getCategories);

router.post('/api/coupon/create', createCoupon);
router.delete('/api/coupon/delete/:couponId', deleteCoupon);
router.put('/api/coupon/deactivate/:couponId', deactivateCoupon);
router.get('/api/coupons', getAllCoupons);

router.post('/api/product/add', addProduct);
router.put('/api/product/update/:productId', updateProduct);
router.delete('/api/product/delete/:productId', deleteProduct);
router.get('/api/product/:productId', getProduct);
router.get('/api/products', getAllProducts);

router.get('/api/order/generateOrderId', generateRazorpayOrderID);
router.post('/api/order/create', auth, createOrder);
router.put('/api/order/cancel/:orderId', auth, cancelOrder);
router.get('/api/order/:orderId', getOrder);
router.get('/api/orders', auth, getAllOrders);
router.put('/api/order/change/address/:orderId', changeOrderAddress);
router.put('/api/order/change/phoneNo/:orderId', changeOrderContactNo);

export default router;
