import express from 'express';
import auth from '../middlewares/auth.js';
import customRoles from '../middlewares/customRoles.js';
import {
  addCategory,
  updateCategory,
  deleteCategory,
  getCategory,
  getAllCategories,
} from '../controllers/category.controllers.js';

const router = express.Router();

router.route('/category').post(auth, customRoles('manager', 'admin'), addCategory);
router
  .route('/category/:categoryId')
  .get(getCategory)
  .put(auth, customRoles('manager', 'admin'), updateCategory)
  .delete(auth, customRoles('manager', 'admin'), deleteCategory);
router.route('/categories').get(getAllCategories);

export default router;
