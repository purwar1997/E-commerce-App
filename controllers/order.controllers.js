import uuid from 'uuid';
import Order from '../models/order.js';
import Product from '../models/product.js';
import asyncHandler from '../services/asyncHandler.js';
import CustomError from '../utils/customError.js';
import razorpay from '../config/razorpay.config.js';

/**
 * @CREATE_RAZORPAY_ORDER
 * @request_type POST
 * @route http://localhost:4000/api/v1/razorpayOrder
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

export const createOrder = asyncHandler(async (req, res) => {
  const { paymentId, orderItems, orderInfo, shippingInfo } = req.body;

  if (!paymentId) {
    throw new CustomError('Please provide a payment id', 400);
  }

  if (!(orderItems && orderInfo && shippingInfo)) {
    throw new CustomError('Please provide all the order details', 400);
  }

  const payment = await razorpay.payments.capture(paymentId, orderInfo.totalAmount, 'INR');

  const order = await Order.create({
    orderItems,
    orderInfo,
    shippingInfo,
    user: res.user._id,
    paymentInfo: {
      transactionId: payment.id,
      amountPaid: payment.amount,
      paymentMethod: payment.method,
    },
  });

  orderItems.forEach(async ({ product: id, quantity }) => {
    const product = await Product.findById(id);
    product.soldUnits = product.soldUnits + quantity;
    product.stock = product.stock - quantity;
    await product.save();
  });

  res.status(201).json({
    success: true,
    message: 'Order successfully created',
    order,
  });
});

/**
 * @GET_USER_ORDERS
 * @request_type GET
 * @route http://localhost:4000/api/v1/orders
 * @description Controller that allows user to fetch all his orders
 * @params none
 * @returns Array of order objects
 */

export const getUserOrders = asyncHandler(async (_req, res) => {
  const orders = await Order.find({ user: res.user._id });

  if (orders.length === 0) {
    throw new CustomError('You never ordered anything', 404);
  }

  res.status(200).json({
    success: true,
    message: 'Orders successfully fetched',
    orders,
  });
});

/**
 * @GET_ORDER
 * @request_type GET
 * @route http://localhost:4000/api/v1/order/:orderId
 * @description Controller to fetch an order using orderId
 * @params orderId
 * @returns Order object
 */

export const getOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await Order.findById(orderId);

  if (!order) {
    throw new CustomError('Order not found', 404);
  }

  res.status(200).json({
    success: true,
    message: 'Order successfully fetched',
    order,
  });
});

/**
 * @CANCEL_ORDER
 * @request_type PUT
 * @route http://localhost:4000/api/v1/order/:orderId
 * @description Controller that allows user to cancel his order
 * @params orderId
 * @returns Order object
 */

export const cancelOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  let order = await Order.findById(orderId);

  if (!order) {
    throw new CustomError('Order not found', 404);
  }

  if (order.orderStatus === 'delivered') {
    throw new CustomError("Delivered orders can't be cancelled", 400);
  }

  if (order.orderStatus === 'cancelled') {
    throw new CustomError('This order has already been cancelled', 400);
  }

  const refund = await razorpay.payments.refund(order.paymentInfo.transactionId, {
    amount: order.paymentInfo.amountPaid,
    speed: 'optimum',
  });

  const payment = await razorpay.payments.fetch(order.paymentInfo.transactionId);

  order = await Order.findByIdAndUpdate(orderId, {
    orderStatus: 'cancelled',
    estimatedDeliveryDate: undefined,
    paymentInfo: {
      $set: {
        refundStatus: refund.status,
        amountRefunded: payment.amount_refunded,
      },
    },
  });

  order.orderItems.forEach(async ({ product: id, quantity }) => {
    const product = await Product.findById(id);
    product.soldUnits = product.soldUnits - quantity;
    product.stock = product.stock + quantity;
    await product.save();
  });

  res.status(200).json({
    success: true,
    message: 'Order successfully cancelled',
    order,
  });
});

/**
 * @ADMIN_GET_ALL_ORDERS
 * @request_type GET
 * @route http://localhost:4000/api/v1/admin/orders
 * @description Controller that allows admin to fetch all orders
 * @params none
 * @returns Array of order objects
 */

export const adminGetAllOrders = asyncHandler(async (_req, res) => {
  const orders = await Order.find();

  if (orders.length === 0) {
    throw new CustomError('No user ordered anything', 404);
  }

  res.status(200).json({
    success: true,
    message: 'Orders successfully fetched',
    orders,
  });
});

/**
 * @ADMIN_UPDATE_ORDER
 * @request_type PUT
 * @route http://localhost:4000/api/v1/admin/order/:orderId
 * @description Controller that allows admin to update order status
 * @params orderId, orderStatus
 * @returns Order object
 */

export const adminUpdateOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { orderStatus } = req.body;

  let order = await Order.findById(orderId);

  if (!order) {
    throw new CustomError('Order not found', 404);
  }

  if (orderStatus === 'shipped') {
    switch (order.orderStatus) {
      case 'created':
        order.orderStatus = orderStatus;
        order.shippedOn = new Date();
        order = await order.save();
        break;

      case 'shipped':
        throw new CustomError('This order has already been shipped', 400);

      case 'delivered':
        throw new CustomError('This order has already been delivered', 400);

      case 'cancelled':
        throw new CustomError('This order has been cancelled', 400);
    }
  }

  if (orderStatus === 'delivered') {
    switch (order.orderStatus) {
      case 'created':
        throw new CustomError("This order hasn't been shipped yet", 400);

      case 'shipped':
        order.orderStatus = orderStatus;
        order.deliveredOn = new Date();
        order.estimatedDeliveryDate = undefined;
        order = await order.save();
        break;

      case 'delivered':
        throw new CustomError('This order has already been delivered', 400);

      case 'cancelled':
        throw new CustomError('This order has been cancelled', 400);
    }
  }

  res.status(200).json({
    success: true,
    message: 'Order status successfully updated',
    order,
  });
});

/**
 * @ADMIN_DELETE_ORDER
 * @request_type DELETE
 * @route http://localhost:4000/api/v1/admin/order/:orderId
 * @description Controller that allows admin to delete an order
 * @params orderId
 * @returns Response object
 */

export const adminDeleteOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await Order.findByIdAndDelete(orderId);

  if (!order) {
    throw new CustomError('Order not found', 404);
  }

  res.status(200).json({
    success: true,
    message: 'Order successfully deleted',
  });
});
