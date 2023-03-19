import express from 'express';
import auth from '../middlewares/auth.js';
import customRoles from '../middlewares/customRoles.js';
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
router.route('/admin/users').get(auth, customRoles('admin'), adminGetUsers);
router
  .route('/admin/user/:userId')
  .get(auth, customRoles('admin'), adminGetUser)
  .put(auth, customRoles('admin'), adminUpdateUser)
  .delete(auth, customRoles('admin'), adminDeleteUser);
router.route('/manager/users').get(auth, customRoles('manager'), managerGetUsers);

export default router;
