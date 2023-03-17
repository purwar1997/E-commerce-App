import validator from 'validator';
import User from '../models/user.js';
import asyncHandler from '../services/asyncHandler.js';
import CustomError from '../utils/customError.js';
import { createCookieOptions, clearCookieOptions } from '../utils/cookieOptions.js';

/**
 * @SIGNUP
 * @request_type POST
 * @route http://localhost:4000/api/v1/signup
 * @description Controller that allows user to signup
 * @params firstname, lastname, email, phoneNo, password, confirmPassword
 * @return User object
 */

export const signup = asyncHandler(async (req, res) => {
  const { firstname, lastname, email, phoneNo, password, confirmPassword } = req.body;

  if (!(firstname && lastname && email && phoneNo && password && confirmPassword)) {
    throw new CustomError('Please provide all the details', 400);
  }

  if (password !== confirmPassword) {
    throw new CustomError("Password and confirmPassword don't match", 400);
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
 * @return Response object
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
    throw new CustomError('User not registered', 400);
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
 * @return Response object
 */

export const logout = asyncHandler(async (_req, res) => {
  res.status(200).clearCookie('token', clearCookieOptions).json({
    success: true,
    message: 'Logout success',
  });
});
