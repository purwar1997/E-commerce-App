import express from 'express';
import auth from '../middlewares/auth.js';
import customRole from '../middlewares/customRole.js';
import {
  signup,
  login,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
  getProfile,
  updateProfile,
  deleteProfile,
  adminGetUsers,
  adminGetUser,
  adminUpdateUser,
  adminDeleteUser,
  managerGetUsers,
} from '../controllers/user.controllers.js';

const router = express.Router();

router.route('/signup').post(signup);
router.route('/login').post(login);
router.route('/logout').get(logout);
router.route('/password/forgot').post(forgotPassword);
router.route('/password/reset/:resetPasswordToken').put(resetPassword);
router.route('/password/change').put(auth, changePassword);
router.route('/profile').get(auth, getProfile).put(auth, updateProfile).post(auth, deleteProfile);
router.route('/admin/users').get(auth, customRole('admin'), adminGetUsers);
router
  .route('/admin/user/:userId')
  .get(auth, customRole('admin'), adminGetUser)
  .put(auth, customRole('admin'), adminUpdateUser)
  .delete(auth, customRole('admin'), adminDeleteUser);
router.route('/manager/users').get(auth, customRole('manager'), managerGetUsers);

export default router;
