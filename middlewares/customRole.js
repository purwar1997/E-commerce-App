import asyncHandler from '../services/asyncHandler.js';
import CustomError from '../utils/customError.js';

const customRole = (...roles) =>
  asyncHandler(async (_req, res, next) => {
    const { user } = res;

    if (!roles.includes(user.role)) {
      throw new CustomError('Not allowed to access this resource', 403);
    }

    next();
  });

export default customRole;
