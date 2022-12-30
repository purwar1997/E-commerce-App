import User from '../models/user';
import asyncHandler from '../services/asyncHandler';
import CustomError from '../utils/customError';
import cookieOptions from '../utils/cookieOptions';

/**
 * @SIGNUP
 * @route http://localhost:4000/api/auth/signup
 * @description User signup controller for creating a new user
 * @parameters name, email, password
 * @returns User object
 */

export const signup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new CustomError('Please enter all the details', 400);
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new CustomError('User already exists', 400);
  }

  const newUser = new User({ name, email, password });
  await newUser.save();

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
    throw new CustomError("User doesn't exist", 400);
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
