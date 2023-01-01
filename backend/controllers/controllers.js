import User from '../models/user';
import Category from '../models/category';
import asyncHandler from '../services/asyncHandler';
import CustomError from '../utils/customError';
import cookieOptions from '../utils/cookieOptions';
import mailSender from '../utils/mailSender';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

/***** controllers for User model *****/

/**
 * @SIGNUP
 * @REQUEST_TYPE POST
 * @route http://localhost:4000/api/auth/signup
 * @description Signup controller for creating a new user
 * @parameters name, email, password, confirmPassword
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
 * @REQUEST_TYPE PUT
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
 * @REQUEST_TYPE GET
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
 * @REQUEST_TYPE PUT
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
 * @REQUEST_TYPE PUT
 * @route http://localhost:4000/api/auth/password/forgot/reset/:resetPasswordToken
 * @description Controller that allows a user to reset his password
 * @parameters token, password, confirmPassword
 * @returns Response object
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
  });

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
 * @REQUEST_TYPE PUT
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
  const user = await User.findOne({ password: encryptedPassword });

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

/**
 * @GET_PROFILE
 * @REQUEST_TYPE GET
 * @route http://localhost:4000/api/auth/profile
 * @description Controller to fetch user's profile
 * @parameters token
 * @returns User object
 */

export const getProfile = asyncHandler(async (_req, res) => {
  const { user } = res;

  if (!user) {
    throw new CustomError('User not found', 400);
  }

  res.status(200).json({
    success: true,
    message: 'Success in fetching user profile',
    user,
  });
});

/***** controllers for Category model *****/

/**
 * @CREATE_CATEGORY
 * @REQUEST_TYPE POST
 * @route http://localhost:4000/api/createCategory
 * @description Controller to create a category
 * @parameters name
 * @returns Category object
 */

export const createCategory = asyncHandler(async (req, res) => {
  const { name } = req.body;

  if (!name) {
    throw new CustomError('Please enter category name', 400);
  }

  const category = await Category.create({ name });

  res.status(200).json({
    success: true,
    message: 'A new category has been created',
    category,
  });
});

/**
 * @UPDATE_CATEGORY
 * @REQUEST_TYPE PUT
 * @route http://localhost:4000/api/updateCategory/:categoryId
 * @description Controller to update a category
 * @parameters name, categoryId
 * @returns Category object
 */

export const updateCategory = asyncHandler(async (req, res) => {
  const { name } = req.body;
  const { categoryId } = req.params;

  if (!name) {
    throw new CustomError('Please enter category name', 400);
  }

  await Category.findByIdAndUpdate(categoryId, { name });
  const category = await Category.findById(categoryId);

  res.status(200).json({
    success: true,
    message: 'Category has been updated',
    category,
  });
});

/**
 * @DELETE_CATEGORY
 * @REQUEST_TYPE DELETE
 * @route http://localhost:4000/api/deleteCategory/:categoryId
 * @description Controller to delete a category
 * @parameters categoryId
 * @returns Response object
 */

export const deleteCategory = asyncHandler(async (req, res) => {
  await Category.findByIdAndDelete(req.params.categoryId);

  res.status(200).json({
    success: true,
    message: 'Category has been deleted',
  });
});

/**
 * @GET_CATEGORY
 * @REQUEST_TYPE GET
 * @route http://localhost:4000/api/getCategory/:categoryId
 * @description Controller to fetch a category
 * @parameters categoryId
 * @returns Category object
 */

export const getCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.categoryId);

  res.status(200).json({
    success: true,
    message: 'Category has been successfully fetched',
    category,
  });
});

/**
 * @GET_CATEGORIES
 * @REQUEST_TYPE GET
 * @route http://localhost:4000/api/getCategories
 * @description Controller to fetch all the categories
 * @parameters none
 * @returns Array of category objects
 */

export const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find();

  res.status(200).json({
    success: true,
    message: 'All the categories have been fetched',
    categories,
  });
});
