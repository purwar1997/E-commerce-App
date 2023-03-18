import validator from 'validator';
import crypto from 'crypto';
import formidable from 'formidable';
import User from '../models/user.js';
import asyncHandler from '../services/asyncHandler.js';
import mailSender from '../services/mailSender.js';
import CustomError from '../utils/customError.js';
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

  let user = await User.findOne({ email });

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
    user = await User.findOne({ phoneNo }).select('+password');
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
 * @params newPassword, confirmPassword
 * @returns Response object
 */

export const resetPasssword = asyncHandler(async (req, res) => {
  const { resetPasswordToken } = req.params;
  const { newPassword, confirmPassword } = req.body;

  if (!newPassword) {
    throw new CustomError('Please provide a new password', 400);
  }

  if (!confirmPassword) {
    throw new CustomError('Please confirm your password', 400);
  }

  if (newPassword !== confirmPassword) {
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

  user.password = newPassword;
  user.forgotPasswordToken = undefined;
  user.forgotPasswordExpiry = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password reset success',
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
 * @params fields, files
 * @returns User object
 */

export const updateProfile = asyncHandler(async (req, res) => {
  const form = formidable({
    keepExtensions: true,
    allowEmptyFiles: false,
    maxFileSize: 5 * 1024 * 1024,
    filter: file => file.mimetype.includes('image'),
  });

  form.parse(req, (err, fields, files) => {
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

    try {
    } catch (err) {}
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

  await user.remove();

  res.status(200).clearCookie('token', clearCookieOptions).json({
    success: true,
    message: 'Profile successfully deleted',
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
