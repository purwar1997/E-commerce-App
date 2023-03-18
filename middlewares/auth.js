import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import asyncHandler from '../services/asyncHandler.js';
import CustomError from '../utils/customError.js';
import config from '../config/config.js';

const auth = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.cookies.token ||
    (req.headers.authorization && req.headers.authorization.startsWith('Bearer'))
  ) {
    token = req.cookies.token || req.headers.authorization.replace('Bearer ', '');
  }

  if (!token) {
    throw new CustomError('User not logged in', 401);
  }

  let decodedToken;

  try {
    decodedToken = jwt.verify(token, config.JWT_SECRET);
  } catch (err) {
    throw new CustomError('Token invalid or expired', 500);
  }

  const user = await User.findById(decodedToken.userId);

  if (!user) {
    throw new CustomError('User not found', 404);
  }

  res.user = user;
  next();
});

export default auth;
