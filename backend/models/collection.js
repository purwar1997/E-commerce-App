import mongoose from 'mongoose';

const collectionSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a suitable collection name'],
      maxLength: [120, 'Collection name must be less than 120 characters'],
      lowercase: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Collection', collectionSchema);
