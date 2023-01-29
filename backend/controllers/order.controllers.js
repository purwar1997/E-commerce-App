import Order from '../models/order';
import Product from '../models/product';
import Coupon from '../models/coupon';
import asyncHandler from '../services/asyncHandler';
import CustomError from '../utils/customError';
import razorpay from '../config/razorpay.config';
import mailSender from '../utils/mailSender';

/**
 * @GENERATE_RAZORPAY_ID
 * @request_type GET
 * @route http://localhost:4000/api/order/generateOrderId
 * @description Controller to generate a razorpay id which is used to place an order
 * @parameters products, couponCode
 * @returns Order object
 */

export const generateRazorpayOrderID = asyncHandler(async (req, res) => {
  const { products, couponCode, phoneNo, address } = req.body;

  if (!products || !products.length) {
    throw new CustomError('Please provide products that user wants to order', 400);
  }

  if (!phoneNo) {
    throw new CustomError('Please provide your contact no', 400);
  }

  if (!address) {
    throw new CustomError(
      'Please provide the address where you want your order to be delivered',
      400
    );
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
  }

  const order = await razorpay.orders.create({
    amount: Math.round(amountToPay * 100),
    currency: 'INR',
    receipt: `Order receipt ${new Date().toLocaleString()}`,
  });

  if (!order) {
    throw new CustomError('Failed to generate order Id', 400);
  }

  res.status(200).json({
    success: true,
    message: 'Order Id successfully generated',
    order,
  });
});

/**
 * @CREATE_ORDER
 * @request_type POST
 * @route http://localhost:4000/api/order/create
 * @description Controller to create an order in a database
 * @description Upon creation of order, a mail will be sent to the user
 * @parameters payment, products, couponCode, phoneNo, address
 * @returns Order object
 */

export const createOrder = asyncHandler(async (req, res) => {
  const { payment, products, couponCode, phoneNo, address } = req.body;

  if (payment.status === 'failed') {
    throw new CustomError(`${payment.error_code}: ${payment.error_description}`, 500);
  }

  if (payment.status === 'captured') {
    const order = await Order.create({
      _id: payment.order_id,
      products,
      userId: res.user._id,
      amountPaid: payment.amount,
      phoneNo,
      address,
      coupon: couponCode,
      paymentMode: payment.method,
      transactionId: payment.id,
    });

    if (!order) {
      throw new CustomError('Order not created', 400);
    }

    products.forEach(async ({ productId, count }) => {
      await Product.findByIdAndUpdate(productId, {
        stock: stock - count,
        soldUnits: soldUnits + count,
      });
    });

    if (couponCode) {
      await Coupon.findOneAndUpdate({ code: couponCode }, { isActive: false });
    }

    res.status(200).json({
      success: true,
      message: 'Order successfully created',
      order,
    });

    try {
      await mailSender({
        email: res.user.email,
        subject: 'Order confirmation mail',
        text: 'Congratulations, you have successfully placed your order',
      });
    } catch (err) {
      throw new CustomError(err.message || 'Failed to send order confirmation mail', 500);
    }
  }
});

/**
 * @CANCEL_ORDER
 * @request_type PUT
 * @route http://localhost:4000/api/order/cancel/:orderId
 * @description Controller to cancel an order
 * @description Upon cancellation of order, a mail will be sent to the user
 * @parameters orderId
 * @returns Order object
 */

export const cancelOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await Order.findByIdAndUpdate(orderId, { orderStatus: 'cancelled' }, { new: true });

  if (!order) {
    throw new CustomError('Failed to cancel order', 400);
  }

  order.products.forEach(async ({ productId, count }) => {
    await Product.findByIdAndUpdate(productId, {
      stock: stock + count,
      soldUnits: soldUnits - count,
    });
  });

  res.status(200).json({
    success: true,
    message: 'Order has been cancelled',
    order,
  });

  try {
    await mailSender({
      email: res.user.email,
      subject: 'Order cancellation mail',
      text: 'You order has been cancelled',
    });
  } catch (err) {
    throw new CustomError(err.message || 'Failed to send order cancellation mail', 500);
  }
});

/**
 * @GET_ORDER
 * @request_type GET
 * @route http://localhost:4000/api/order/:orderId
 * @description Controller to fetch an order
 * @parameters orderId
 * @returns Order object
 */

export const getOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const order = await Order.findById(orderId);

  if (!order) {
    throw new CustomError('Order not found', 400);
  }

  res.status(200).json({
    success: true,
    message: 'Order successfully fetched',
    order,
  });
});

/**
 * @GET_ALL_ORDERS
 * @request_type GET
 * @route http://localhost:4000/api/orders
 * @description Controller to fetch all the orders
 * @parameters none
 * @returns Array of order objects
 */

export const getAllOrders = asyncHandler(async (_req, res) => {
  const orders = await Order.find({ userId: res.user._id });

  if (!orders.length) {
    throw new CustomError('User never ordered anything', 400);
  }

  res.status(200).json({
    success: true,
    message: 'Orders successfully fetched',
    orders,
  });
});

/**
 * @CHANGE_ORDER_ADDRESS
 * @request_type PUT
 * @route http://localhost:4000/api/order/change/address/:orderId
 * @description Controller that allows user to change order delivery address
 * @parameters address, orderId
 * @returns Order object
 */

export const changeOrderAddress = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { address } = req.body;

  if (!address) {
    throw new CustomError('Address is required', 400);
  }

  const order = await Order.findByIdAndUpdate(orderId, { address }, { new: true });

  if (!order) {
    throw new CustomError('Failed to update address', 400);
  }

  res.status(400).json({
    success: true,
    message: 'Address successfully updated',
    order,
  });
});

/**
 * @CHANGE_ORDER_CONTACT_NO
 * @request_type PUT
 * @route http://localhost:4000/api/order/change/phoneNo/:orderId
 * @description Controller that allows user to change order delivery contact no
 * @parameters phoneNo, orderId
 * @returns Order object
 */

export const changeOrderContactNo = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { phoneNo } = req.body;

  if (!phoneNo) {
    throw new CustomError('Contact No is required', 400);
  }

  const order = await Order.findByIdAndUpdate(orderId, { phoneNo }, { new: true });

  if (!order) {
    throw new CustomError('Failed to update contact no', 400);
  }

  res.status(400).json({
    success: true,
    message: 'Contact no successfully updated',
    order,
  });
});
