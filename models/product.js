import mongoose from 'mongoose';
import validator from 'validator';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a product name'],
      maxLength: [100, 'Product name should be less than 100 characters'],
      lowercase: true,
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Please provide a product price'],
      min: [50, "Products worth less than ₹50 can't be listed"],
      set: price => Math.round(price),
    },
    description: {
      type: String,
      required: [true, 'Please provide a product description'],
      maxLength: [250, 'Product description should be less than 250 characters'],
      lowercase: true,
      trim: true,
    },
    photos: [
      {
        id: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
          validate: {
            validator: url => validator.isURL(url),
            message: 'Invalid URL',
          },
        },
      },
    ],
    brand: {
      type: String,
      required: [true, 'Please provide a brand name'],
      maxLength: [50, 'Brand name should be less than 50 characters'],
      lowercase: true,
      trim: true,
    },
    stock: {
      type: Number,
      required: [true, 'Please provide product stock'],
      validate: {
        validator: stock => Number.isInteger(stock) && stock >= 0,
        message: 'Stock should be a non negative integer',
      },
    },
    soldUnits: {
      type: Number,
      default: 0,
      validate: soldUnits => Number.isInteger(soldUnits) && soldUnits >= 0,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Category',
    },
    ratings: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
      set: ratings => Math.round(ratings * 10) / 10,
    },
    reviews: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        name: {
          type: String,
        },
        comment: {
          type: String,
          maxlength: [500, 'Review should be less than 500 characters'],
          lowercase: true,
          trim: true,
        },
        rating: {
          type: Number,
          enum: [1, 2, 3, 4, 5],
        },
      },
    ],
    addedBy: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
      },
      role: {
        type: String,
        required: true,
        enum: ['manager', 'admin'],
      },
    },
    lastUpdatedBy: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      role: {
        type: String,
        enum: ['manager', 'admin'],
      },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Product', productSchema);
