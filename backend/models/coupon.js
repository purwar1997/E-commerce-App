import mongoose from 'mongoose';

const couponSchema = mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Please provide a coupon code'],
      minLength: [6, 'Coupon code must be atleast 6 characters long'],
      maxLength: [10, 'Coupon code must be less than 10 characters'],
      match: [/^[0-9A-Z]+$/, 'Only uppercase letters(A-Z) and numbers(0-9) are allowed'],
      trim: true,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Coupon', couponSchema);
