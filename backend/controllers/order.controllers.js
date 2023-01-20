import Order from '../models/order';
import Product from '../models/product';
import Coupon from '../models/coupon';
import asyncHandler from '../services/asyncHandler';
import CustomError from '../utils/customError';
import razorpay from '../config/razorpay.config';

/**
 * @GENERATE_RAZORPAY_ID
 * @request_type
 * @route http://localhost:4000/api/order/razorpay
 * @description Controller to generate a razorpay id which is used to place an order
 * @parameters products, couponCode
 * @returns Order object
 */

export const generateRazorpayOrderID = asyncHandler(async (req, res) => {
  const { products, couponCode } = req.body;

  if (!products || !products.length) {
    throw new CustomError('Please provide products that user wants to order', 400);
  }

  let amountToPay = products.reduce(async (sum, { productId, count }) => {
    const product = await Product.findById(productId);

    if (!product) {
      throw new CustomError('Product not found', 400);
    }

    if (product.stock === 0) {
      throw new CustomError('Product out of stock', 400);
    }

    sum = sum + product.price * count;
    return sum;
  }, 0);

  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode, isActive: true });

    if (!coupon) {
      throw new CustomError('Coupon invalid', 400);
    }

    amountToPay = ((100 - coupon.discount) / 100) * amountToPay;
    coupon.isActive = false;
    await coupon.save();
  }

  const order = await razorpay.orders.create({
    amount: Math.round(amountToPay * 100),
    currency: 'INR',
    receipt: `Order receipt ${new Date().toLocaleString()}`,
  });

  if (!order) {
    throw new CustomError('Failed to generate order ID', 400);
  }

  res.status(200).json({
    success: true,
    message: 'Order ID generated successfully',
    order,
  });
});
