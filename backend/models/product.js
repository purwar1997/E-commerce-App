import mongoose from 'mongoose';

const productSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a product name'],
      maxLength: [120, 'Product name should be less than 120 characters'],
      lowercase: true,
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Please provide a product price'],
    },
    description: {
      type: String,
      required: [true, 'Please provide a product description'],
      maxLength: [250, 'Product description should be less than 250 characters'],
      lowercase: true,
      trim: true,
    },
    images: [
      {
        url: {
          type: String,
          reqired: true,
        },
      },
    ],
    stock: {
      type: Number,
      default: 0,
      required: true,
    },
    soldUnits: {
      type: Number,
      required: true,
      default: 0,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Product', productSchema);
