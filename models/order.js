import mongoose from 'mongoose';
import validator from 'validator';
import countries from '../utils/countryList.js';

const orderSchema = new mongoose.Schema(
  {
    orderItems: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          default: 1,
          min: 1,
        },
      },
    ],
    orderInfo: {
      orderAmount: {
        type: Number,
        required: true,
        min: 50,
      },
      shippingCharges: {
        type: Number,
        required: true,
        min: 30,
      },
      discount: {
        type: Number,
      },
      tax: {
        type: Number,
        required: true,
      },
      totalAmount: {
        type: Number,
        required: true,
      },
    },
    shippingInfo: {
      address: {
        houseNo: {
          type: String,
          required: true,
        },
        area: {
          type: String,
          required: true,
          maxLength: 100,
        },
        postalCode: {
          type: String,
          required: true,
          validate: {
            validator: code => validator.isPostalCode(code, 'any'),
            message: 'Invalid postal code',
          },
        },
        city: {
          type: String,
          required: true,
        },
        state: {
          type: String,
          required: true,
        },
        country: {
          type: String,
          required: true,
          default: 'India',
          enum: {
            values: countries,
            message: "We don't offer our services in {VALUE}",
          },
        },
      },
      phoneNo: {
        type: String,
        required: true,
        validate: {
          validator: phoneNo => validator.isMobilePhone(phoneNo),
          message: 'Invalid phone no.',
        },
      },
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    orderStatus: {
      type: String,
      default: 'ordered',
      enum: ['ordered', 'shipped', 'delivered', 'cancelled'],
    },
    estimatedDeliveryDate: {
      type: Date,
      required: true,
    },
    paymentInfo: {
      transactionId: {
        type: String,
        required: true,
      },
      amountPaid: {
        type: Number,
        required: true,
      },
      paymentMethod: {
        type: String,
        required: true,
        enum: {
          values: ['card', 'upi', 'netbanking', 'wallet'],
          message: '{VALUE} not supported as a payment method',
        },
      },
      refundStatus: {
        type: String,
        default: null,
        enum: [null, 'pending', 'processed', 'failed'],
      },
      amountRefunded: {
        type: Number,
        default: 0,
      },
    },
    shippedOn: {
      type: Date,
    },
    deliveredOn: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Order', orderSchema);
