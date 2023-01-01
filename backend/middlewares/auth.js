import User from '../models/user';
import asyncHandler from '../services/asyncHandler';
import CustomError from '../utils/customError';
import config from '../config/index';
import JWT from 'jsonwebtoken';

export const auth = asyncHandler(async (req, res, next) => {
  //  const token = req.cookies.token || req.header('Authrorization').replace('Bearer ', '');

  let token;

  //  req.headers wil return all the header data in the form of a JS object
  if (
    req.cookies.token ||
    (req.headers.authorization && req.headers.authorization.startsWith('Bearer'))
  ) {
    token = req.cookies.token || req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new CustomError('User is not logged in', 400);
  }

  try {
    const { userId } = JWT.verify(token, config.TOKEN_SECRET);
    const user = await User.findById(userId).select({ name: 1, email: 1, role: 1 });
    res.user = user;
  } catch (err) {
    throw new CustomError('Token invalid', 400);
  }

  return next();
});
