import User from '../models/user';
import asyncHandler from '../services/asyncHandler';
import CustomError from '../utils/customError';
import cookieOptions from '../utils/cookieOptions';
import mailSender from '../utils/mailSender';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

/**
 * @SIGNUP
 * @route http://localhost:4000/api/auth/signup
 * @description Signup controller for creating a new user
 * @parameters name, email, password
 * @returns User object
 */

export const signup = asyncHandler(async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  if (!name || !email || !password || !confirmPassword) {
    throw new CustomError('Please enter all the details', 400);
  }

  if (password !== confirmPassword) {
    throw new Error("Confirmed password doesn't match with password", 400);
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new CustomError('User already exists', 400);
  }

  let newUser = new User({ name, email, password });
  newUser = await newUser.save();

  const token = newUser.generateJWTtoken();

  // select: false only works when the database is queried not when the documents are created and updated
  newUser.password = undefined;

  res.status(200).cookie('token', token, cookieOptions);
  res.status(200).json({
    success: true,
    message: 'User is successfully created',
    newUser,
  });
});

/**
 * @LOGIN
 * @route http://localhost:4000/api/auth/login
 * @description Login controller that enables user to login
 * @parameters email, password
 * @returns User object
 */

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new CustomError('Please enter all the details', 400);
  }

  // '+' will override password's select: false
  const existingUser = await User.findOne({ email }).select('+password');

  if (!existingUser) {
    throw new CustomError('User not found', 400);
  }

  const passwordMatched = await existingUser.comparePassword(password);

  if (!passwordMatched) {
    throw new CustomError('Please enter correct password', 400);
  }

  const token = existingUser.generateJWTtoken();
  existingUser.password = undefined;

  res.status(200).cookie('token', token, cookieOptions);
  res.status(200).json({
    success: true,
    message: 'User is successfully logged in',
    existingUser,
  });
});

/**
 * @LOGOUT
 * @route http://localhost:4000/api/auth/logout
 * @description logout controller that enables user to logout
 * @parameters none
 * @returns response object
 */

export const logout = asyncHandler(async (_req, res) => {
  res.status(200).cookie('token', null, {
    expires: new Date(),
    httpOnly: true,
  });

  // clearCookie(name, options) can be used to clear the cookie
  // res.clearCookie('token');

  res.status(200).json({
    success: true,
    message: 'User is successfully logged out',
  });
});

/**
 * @FORGOT_PASSWORD
 * @route http://localhost:4000/api/auth/password/forgot
 * @description This controller allows user to reset password by entering his email
 * @parameters email
 * @returns email sent to reset password
 */

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new CustomError('Email is required', 400);
  }

  // password field will be omitted because findOne() is a query method
  const existingUser = await User.findOne({ email });

  if (!existingUser) {
    throw new CustomError('User not found', 400);
  }

  const resetToken = existingUser.generateForgotPasswordToken();
  // validateBeforeSave is used to bypass the schema validation
  await existingUser.save({ validateBeforeSave: false });

  const resetURL = `${req.protocol}://${req.hostname}/api/auth/password/forgot/reset/${resetToken}`;

  try {
    await mailSender({
      email: existingUser.email,
      subject: 'Password reset email',
      text: `Click on this link to reset your password: ${resetURL}`,
    });

    res.status(200).json({
      success: true,
      message: `Reset password email is successfully sent to ${existingUser.email}`,
    });
  } catch (err) {
    existingUser.forgotPasswordToken = undefined;
    existingUser.forgotPasswordExpiry = undefined;
    await existingUser.save({ validateBeforeSave: false });

    throw new CustomError(err.message || 'Unable to send email', 500);
  }
});

/**
 * @RESET_PASSWORD
 * @route http://localhost:4000/api/auth/password/forgot/reset/:resetPasswordToken
 * @description Controller that allows a user to reset his password
 * @parameters token, password, confirmPassword
 * @returns User object
 */

export const resetPassword = asyncHandler(async (req, res) => {
  let { resetPasswordToken: token } = req.params;
  const { password, confirmPassword } = req.body;

  if (!password || !confirmPassword) {
    throw new CustomError('Please enter all the details', 400);
  }

  if (password !== confirmPassword) {
    throw new CustomError("Confirmed password doesn't match with password", 400);
  }

  token = crypto.createHash('sha256').update(token).digest('hex');

  let user = await User.findOne({
    forgotPasswordToken: token,
    forgotPasswordExpiry: { $gt: new Date() },
  }).select('+password');

  if (!user) {
    throw new CustomError('Password reset token is invalid or expired', 400);
  }

  user.password = password;
  user.forgotPasswordToken = undefined;
  user.forgotPasswordExpiry = undefined;
  user = await user.save();

  token = user.generateJWTtoken();
  res.status(200).cookie('token', token, cookieOptions);

  res.status(200).json({
    success: true,
    message: 'Password reset successful',
  });
});

/**
 * @CHANGE_PASSWORD
 * @route http://localhost:4000/api/auth/password/change
 * @description Controller that allows user to change his password
 * @parameters oldPassword. newPassword
 * @returns response object
 */

export const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    throw new CustomError('Please enter all the details', 400);
  }

  const encryptedPassword = await bcrypt.hash(oldPassword, 10);
  const user = await User.findOne({ password: encryptedPassword }).select('+password');

  if (!user) {
    throw new CustomError('Password invalid', 400);
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'User has successfully changed his password',
  });
});
