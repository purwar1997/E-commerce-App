import mongoose from 'mongoose';
import AuthRoles from '../utils/authRoles';

// defining a Schema for user
// new keyword can be omitted
const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      maxLength: [50, 'Name must be less than 50 characters'],
      lowercase: true,
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minLength: [6, 'Password must be atleast 6 characters long'],
      maxLength: [30, 'Password must be less than 30 characters'],
      // omits the password field when the database is queried and documents are fetched
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(AuthRoles),
      default: AuthRoles.USER,
    },
    forgotPasswordToken: {
      type: String,
    },
    forgotPasswordExpiry: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// creating a model and exporting it
const User = mongoose.model('user', userSchema);
export default User;
