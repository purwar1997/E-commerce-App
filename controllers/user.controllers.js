import validator from 'validator';
import crypto from 'crypto';
import User from '../models/user.js';
import asyncHandler from '../services/asyncHandler.js';
import CustomError from '../utils/customError.js';
import mailSender from '../services/mailSender.js';
import formParser from '../services/formParser.js';
import { uploadFile, deleteFile } from '../services/fileHandlers.js';
import { createCookieOptions, clearCookieOptions } from '../utils/cookieOptions.js';

/**
 * @SIGNUP
 * @request_type POST
 * @route http://localhost:4000/api/v1/signup
 * @description Controller that allows user to signup
 * @params firstname, lastname, email, phoneNo, password, confirmPassword
 * @returns User object
 */

export const signup = asyncHandler(async (req, res) => {
  const { firstname, lastname, email, phoneNo, password, confirmPassword } = req.body;

  if (!(firstname && lastname && email && phoneNo && password && confirmPassword)) {
    throw new CustomError('Please provide all the details', 400);
  }

  if (password !== confirmPassword) {
    throw new CustomError("Password and confirmed password don't match", 400);
  }

  let user = await User.findOne({ email: email.trim().toLowerCase() });

  if (user) {
    throw new CustomError('User already registered', 400);
  }

  user = await User.create({
    firstname,
    lastname,
    email,
    phoneNo,
    password,
  });

  user.password = undefined;

  res.status(201).json({
    success: true,
    message: 'Signup success',
    user,
  });
});

/**
 * @LOGIN
 * @request_type POST
 * @route http://localhost:4000/api/v1/login
 * @description Controller that allows user to login via email or phone no.
 * @params login, password
 * @returns Response object
 */

export const login = asyncHandler(async (req, res) => {
  let { login, password } = req.body;

  if (!login) {
    throw new CustomError('Please provide an email or phone no.', 400);
  }

  if (!password) {
    throw new CustomError('Please provide a password', 400);
  }

  login = login.trim();

  if (!(validator.isEmail(login) || validator.isMobilePhone(login))) {
    throw new CustomError('Please provide a valid email or phone number');
  }

  let user = await User.findOne({ email: login.toLowerCase() }).select('+password');

  if (!user) {
    user = await User.findOne({ phoneNo: login }).select('+password');
  }

  if (!user) {
    throw new CustomError('User not registered', 404);
  }

  const isPasswordCorrect = await user.comparePassword(password);

  if (!isPasswordCorrect) {
    throw new CustomError('Incorrect password', 401);
  }

  const token = user.generateJWTtoken();

  res.status(200).cookie('token', token, createCookieOptions).json({
    success: true,
    message: 'Login success',
  });
});

/**
 * @LOGOUT
 * @request_type GET
 * @route http://localhost:4000/api/v1/logout
 * @description Controller that allows user to logout
 * @params none
 * @returns Response object
 */

export const logout = asyncHandler(async (_req, res) => {
  res.status(200).clearCookie('token', clearCookieOptions).json({
    success: true,
    message: 'Logout success',
  });
});

/**
 * @FORGOT_PASSWORD
 * @request_type POST
 * @route http://localhost:4000/api/v1/password/forgot
 * @description Controller that sends reset password email to the user
 * @params email
 * @returns Response object
 */

export const forgotPassword = asyncHandler(async (req, res) => {
  let { email } = req.body;

  if (!email) {
    throw new CustomError('Please provide an email', 400);
  }

  email = email.trim().toLowerCase();

  if (!validator.isEmail(email)) {
    throw new CustomError('Please provide a valid email', 400);
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new CustomError('Email not registered', 404);
  }

  const resetPasswordToken = user.generateForgotPasswordToken();
  await user.save({ validateBeforeSave: false });

  const resetPasswordUrl = `${req.protocol}://${req.hostname}/api/v1/password/reset/${resetPasswordToken}`;

  try {
    await mailSender({
      email,
      subject: 'Password reset email',
      text: `Copy paste this link in browser and hit enter to reset your password: ${resetPasswordUrl}`,
    });
  } catch (err) {
    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;
    await user.save({ validateBeforeSave: false });

    throw new CustomError(err.message || 'Failure sending email', 500);
  }

  res.status(200).json({
    success: true,
    message: 'Password reset email successfully sent to the user',
  });
});

/**
 * @RESET_PASSWORD
 * @request_type PUT
 * @route http://localhost:4000/api/v1/password/reset/:resetPasswordToken
 * @description Controller that allows user to reset his password
 * @params password, confirmPassword
 * @returns Response object
 */

export const resetPassword = asyncHandler(async (req, res) => {
  const { resetPasswordToken } = req.params;
  const { password, confirmPassword } = req.body;

  if (!password) {
    throw new CustomError('Please provide a new password', 400);
  }

  if (!confirmPassword) {
    throw new CustomError('Please confirm your password', 400);
  }

  if (password !== confirmPassword) {
    throw new CustomError("Password and confirmed password don't match", 400);
  }

  const encryptedToken = crypto.createHash('sha256').update(resetPasswordToken).digest('hex');

  const user = await User.findOne({
    forgotPasswordToken: encryptedToken,
    forgotPasswordExpiry: { $gt: new Date() },
  }).select('+password');

  if (!user) {
    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;
    await user.save();

    throw new CustomError('Token invalid or expired', 400);
  }

  user.password = password;
  user.forgotPasswordToken = undefined;
  user.forgotPasswordExpiry = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password reset success',
  });
});

/**
 * @CHANGE_PASSWORD
 * @request_type PUT
 * @route http://localhost:4000/api/v1/password/change
 * @description Controller that allows user to change his password
 * @params oldPassword, newPassword
 * @returns Response object
 */

export const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword) {
    throw new CustomError('Please enter your existing password', 400);
  }

  if (!newPassword) {
    throw new CustomError('Please enter a new password', 400);
  }

  let { user } = res;
  user = await User.findById(user._id).select('+password');

  const isPasswordCorrect = await user.comparePassword(oldPassword);

  if (!isPasswordCorrect) {
    throw new CustomError('Incorrect password', 401);
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password changed successfully',
  });
});

/**
 * @GET_PROFILE
 * @request_type GET
 * @route http://localhost:4000/api/v1/profile
 * @description Controller that allows user to fetch his profile
 * @params none
 * @returns User object
 */

export const getProfile = asyncHandler(async (_req, res) => {
  const { user } = res;

  res.status(200).json({
    success: true,
    message: 'User successfully fetched',
    user,
  });
});

/**
 * @UPDATE_PROFILE
 * @request_type PUT
 * @route http://localhost:4000/api/v1/profile
 * @description Controller that allows user to update his profile
 * @description Images are uploaded on cloudinary
 * @params fields, files
 * @returns User object
 */

export const updateProfile = asyncHandler(async (req, res) => {
  const form = formParser('users');

  form.parse(req, async (err, fields, files) => {
    try {
      if (err) {
        throw new CustomError('Error parsing form data', 500);
      }

      if (!fields || Object.keys(fields).length === 0) {
        throw new CustomError('Fields not provided', 400);
      }

      const { firstname, lastname, email, phoneNo } = fields;

      if (!(firstname && lastname && email && phoneNo)) {
        throw new CustomError('Please provide all the details', 400);
      }

      if (!validator.isEmail(email)) {
        throw new CustomError('Please provide a valid email', 400);
      }

      if (!validator.isMobilePhone(phoneNo)) {
        throw new CustomError('Please provide a valid phone no.', 400);
      }

      if (!files || Object.keys(files).length === 0) {
        throw new CustomError('Files not provided', 400);
      }

      let { user } = res;
      let { photo } = files;

      if (photo) {
        if (!user.photo.id) {
          const res = await uploadFile(photo.filepath, 'users');
          photo = { id: res.public_id, url: res.secure_url };
        } else {
          await deleteFile(user.photo.id);
          const res = await uploadFile(photo.filepath, 'users');
          photo = { id: res.public_id, url: res.secure_url };
        }
      }

      user = await User.findByIdAndUpdate(
        user._id,
        { firstname, lastname, email, phoneNo, photo },
        { new: true, runValidators: true }
      );

      res.status(200).json({
        success: true,
        message: 'Profile successfully updated',
        user,
      });
    } catch (err) {
      res.status(err.code || 500).json({
        success: false,
        message: err.message,
      });
    }
  });
});

/**
 * @DELETE_PROFILE
 * @request_type POST
 * @route http://localhost:4000/api/v1/profile
 * @description Controller that allows user to delete his profile
 * @params password
 * @returns Response object
 */

export const deleteProfile = asyncHandler(async (req, res) => {
  const { password } = req.body;

  if (!password) {
    throw new CustomError('Please enter your password', 400);
  }

  let { user } = res;
  user = await User.findById(user._id).select('+password');

  const isPasswordCorrect = await user.comparePassword(password);

  if (!isPasswordCorrect) {
    throw new CustomError('Incorrect password', 401);
  }

  await User.deleteOne({ _id: user._id });

  res.status(200).clearCookie('token', clearCookieOptions).json({
    success: true,
    message: 'Profile successfully deleted',
  });
});

/**
 * @ADMIN_GET_ALL_USERS
 * @request_type GET
 * @route http://localhost:4000/api/v1/admin/users
 * @description Controller that allows admin to fetch all users
 * @params none
 * @returns Array of user objects
 */

export const adminGetUsers = asyncHandler(async (_req, res) => {
  const users = await User.find();

  if (users.length === 0) {
    throw new CustomError('No user found', 404);
  }

  res.status(200).json({
    success: true,
    message: 'Users successfully fetched',
    users,
  });
});

/**
 * @ADMIN_GET_USER
 * @request_type GET
 * @route http://localhost:4000/api/v1/admin/user/:userId
 * @description Controller that allows admin to fetch user by id
 * @params userId
 * @returns User object
 */

export const adminGetUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const user = await User.findById(userId);

  if (!user) {
    throw new CustomError('User not found', 404);
  }

  res.status(200).json({
    success: true,
    message: 'User successfully fetched',
    user,
  });
});

/**
 * @ADMIN_UPDATE_USER
 * @request_type PUT
 * @route http://localhost:4000/api/v1/admin/user/:userId
 * @description Controller that allows admin to update user role
 * @params userId, role
 * @returns User object
 */

export const adminUpdateUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;

  const user = await User.findByIdAndUpdate(userId, { role }, { new: true, runValidators: true });

  if (!user) {
    throw new CustomError('User not found', 404);
  }

  res.status(200).json({
    success: true,
    message: 'User successfully updated',
    user,
  });
});

/**
 * @ADMIN_DELETE_USER
 * @request_type DELETE
 * @route http://localhost:4000/api/v1/admin/user/:userId
 * @description Controller that allows admin to delete user
 * @params userId
 * @returns Response object
 */

export const adminDeleteUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const user = await User.findByIdAndDelete(userId);

  if (!user) {
    throw new CustomError('User not found', 404);
  }

  res.status(200).json({
    success: true,
    message: 'User successfully deleted',
  });
});

/**
 * @MANAGER_GET_USERS
 * @request_type GET
 * @route http://localhost:4000/api/v1/manager/users
 * @description Controller that allows manager to fetch users who are neither admin nor manager
 * @params none
 * @returns Array of user objects
 */

export const managerGetUsers = asyncHandler(async (_req, res) => {
  const users = await User.find({ role: 'user' });

  if (users.length === 0) {
    throw new CustomError('No user found', 404);
  }

  res.status(200).json({
    success: true,
    message: 'Users successfully fetched',
    users,
  });
});
