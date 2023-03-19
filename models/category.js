import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      unique: true,
      required: [true, 'Please provide a category name'],
      maxLength: [100, 'Category name should be less than 100 characters'],
      lowercase: true,
      trim: true,
    },
    addedBy: {
      userId: {
        type: mongoose.Types.ObjectId,
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
        type: mongoose.Types.ObjectId,
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

export default mongoose.model('Category', categorySchema);
