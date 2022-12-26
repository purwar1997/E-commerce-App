import mongoose from 'mongoose';
import AuthRoles from '../utils/authRoles';
import brcypt from 'bcryptjs';
import JWT from 'jsonwebtoken';
import crypto from 'crypto';
import config from '../server';

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
    // mongoose will add two properties of date type on its own to the document
    // 1. createdAt => specifies when the document was created
    // 2. updatedAt => specifies when the document was last updated
    timestamps: true,
  }
);

// pre hook: function will be invoked before save() method runs on a document
userSchema.pre('save', async function (next) {
  //  don't use arrow function because then 'this' will refer to the global object
  // 'this' will refer to the document
  if (!this.modified('password')) return next();
  this.password = await brcypt.hash(this.password, 10);
  next();
});

// methods can be defined on mongoose Schema
// these methods will be available to all the documents

userSchema.methods = {
  comparePassword: async function (password) {
    return await brcypt.compare(password, this.password);
  },

  generateJWTtoken: function () {
    return JWT.sign({ userId: this._id }, config.TOKEN_SECRET, {
      expiresIn: config.TOKEN_EXPIRES_IN,
    });
  },
};

// creating a model and exporting it
export default mongoose.model('User', userSchema);
