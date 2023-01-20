import mongoose from 'mongoose';

const orderStatus = {
  ordered: 'Ordered',
  shipped: 'Shipped',
  delivered: 'Delivered',
  canceled: 'Canceled',
};

const paymentMode = {
  UPI: 'UPI',
  debitCard: 'Debit Card',
  creditCard: 'Credit Card',
  COD: 'Cash On Delivery',
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
      default: orderStatus.ordered,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Order', orderSchema);
