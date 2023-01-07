import express from 'express';

import {
  signup,
  login,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
  getProfile,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategory,
  getCategories,
} from '../controllers/controllers';

import { auth } from '../middlewares/auth';

const router = express.Router();

router.post('/api/auth/signup', signup);
router.post('/api/auth/login', login);
router.get('/api/auth/logout', logout);
router.post('/api/auth/password/forgot', forgotPassword);
router.put('/api/auth/password/forgot/reset/:resetPasswordToken', resetPassword);
router.put('/api/auth/password/change', changePassword);
router.get('/api/auth/Profile', auth, getProfile);
router.post('/api/createCategory', createCategory);
router.put('/api/updateCategory/:categoryId', updateCategory);
router.delete('/api/deleteCategory/:categoryId', deleteCategory);
router.get('/api/getCategory/:categoryId', getCategory);
router.get('/api/getCategories', getCategories);

export default router;
