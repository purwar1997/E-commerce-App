import Coupon from '../models/coupon';
import asyncHandler from '../services/asyncHandler';
import CustomError from '../utils/customError';

/**
 * @CREATE_COUPON
 * @request_type POST
 * @route http://localhost:4000/api/coupon/create
 * @description Controller to create a coupon
 * @description Only admin and moderator can create the coupon
 * @parameters code, discount
 * @returns Coupon object
 */

export const createCoupon = asyncHandler(async (req, res) => {
  let { code, discount } = req.body;

  if (!code || !discount) {
    throw new CustomError('Please enter all the details', 400);
  }

  discount = Number(discount);

  if (isNaN(discount)) {
    throw new CustomError('Discount should be a numeric value', 400);
  }

  const coupon = await Coupon.create({ code, discount });

  if (!coupon) {
    throw new CustomError('Failed to create coupon', 400);
  }

  res.status(200).json({
    success: true,
    message: 'Coupon successfully created',
    coupon,
  });
});

/**
 * @DELETE_COUPON
 * @request_type DELETE
 * @route http://localhost:4000/api/coupon/delete/:couponId
 * @description Controller to delete a coupon
 * @description Only admin and moderator can delete the coupon
 * @parameters couponId
 * @returns Response object
 */

export const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.couponId);

  if (!coupon) {
    throw new CustomError('Coupon not found', 400);
  }

  coupon.remove();

  res.status(200).json({
    success: true,
    message: 'Coupon successfully deleted',
  });
});

/**
 * @DEACTIVATE_COUPON
 * @request_type PUT
 * @route http://localhost:4000/api/coupon/deactivate/:couponId
 * @description Controller to deactivate a coupon
 * @description Only admin and moderator can deactivate the coupon
 * @parameters couponId
 * @returns Coupon object
 */

export const deactivateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(
    req.params.couponId,
    { isActive: false },
    { new: true, runValidators: true }
  );

  if (!coupon) {
    throw new CustomError('Failed to update coupon', 400);
  }

  res.status(200).json({
    success: true,
    message: 'Coupon successfully deactivated',
    coupon,
  });
});

/**
 * @GET_ALL_COUPONS
 * @request_type GET
 * @route http://localhost:4000/api/coupons
 * @description Controller to fetch all the coupons
 * @description Only admin and moderator can access coupons
 * @parameters none
 * @returns Array of coupon objects
 */

export const getAllCoupons = asyncHandler(async (_req, res) => {
  const coupons = await Coupon.find();

  if (!coupons.length) {
    throw new CustomError('Coupons not found', 400);
  }

  res.status(200).json({
    success: true,
    message: 'Coupons successfully fetched',
    coupons,
  });
});
