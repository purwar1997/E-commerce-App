import uuid from 'uuid';
import Order from '../models/order.js';
import Product from '../models/product.js';
import asyncHandler from '../services/asyncHandler.js';
import CustomError from '../utils/customError.js';
import razorpay from '../config/razorpay.config.js';

/**
 * @CREATE_RAZORPAY_ORDER
 * @request_type POST
 * @route http://localhost:4000/api/v1/order/razorpay
 * @description Controller to create an order using razorpay orders API
 * @params amount
 * @returns Razorpay order
 */

export const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { amount } = req.body;

  if (!amount) {
    throw new CustomError('Please provide an order amount', 400);
  }

  const order = await razorpay.orders.create({
    amount: amount * 100,
    currency: 'INR',
    receipt: uuid.v4(),
  });

  res.status(201).json({
    success: true,
    message: 'Razorpay order successfully created',
    order,
  });
});

/**
 * @CREATE_ORDER
 * @request_type POST
 * @route http://localhost:4000/api/v1/order
 * @description Controller to create an order in database upon payment capture
 * @params paymentId, orderItems, orderInfo, shippingInfo, paymentInfo
 * @returns Order object
 */
