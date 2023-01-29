import mongoose from 'mongoose';

const orderStatus = {
  Ordered: 'ordered',
  Shipped: 'shipped',
  Delivered: 'delivered',
  Cancelled: 'cancelled',
};

const paymentMode = {
  Card: 'card',
  Netbanking: 'netbanking',
  Wallet: 'wallet',
  EMI: 'emi',
  UPI: 'upi',
};

const orderSchema = mongoose.Schema(
  {
    products: {
      type: [
        {
          productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
          },
          count: {
            type: Number,
            default: 1,
          },
          name: {
            type: String,
            required: true,
          },
        },
      ],
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amountPaid: {
      type: Number,
      required: true,
    },
    phoneNo: {
      type: String,
      required: true,
      minLength: [10, 'Phone no must be 10 characters long'],
      maxLength: [10, 'Phone no must be 10 characters long'],
      match: [/^[0-9]*$/, 'Phone no should only contain digits'],
    },
    address: {
      type: String,
      required: true,
    },
    coupon: String,
    paymentMode: {
      type: String,
      enum: Object.values(paymentMode),
      required: true,
    },
    transactionId: {
      type: String,
      reqired: true,
    },
    orderStatus: {
      type: String,
      enum: Object.values(orderStatus),
      default: orderStatus.Ordered,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Order', orderSchema);
