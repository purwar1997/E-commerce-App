import mongoose from 'mongoose';
import brcypt from 'bcryptjs';
import JWT from 'jsonwebtoken';
import crypto from 'crypto';
import AuthRoles from '../utils/authRoles';
import config from '../config/config';

// defining a Schema for user
// new keyword can be omitted
const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      maxLength: [50, 'Name should be less than 50 characters'],
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
      minLength: [6, 'Password should be atleast 6 characters long'],
      maxLength: [30, 'Password should be less than 30 characters'],
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
    // mongoose will add two properties of date type to the document
    // 1. createdAt => specifies when the document was created
    // 2. updatedAt => specifies when the document was last updated
    timestamps: true,
  }
);

// pre hook: callback function will be invoked before save() method runs on a document
userSchema.pre('save', async function (next) {
  //  don't use arrow function because then 'this' will refer to the global object
  //  here, 'this' will refer to the document on which save() is called
  if (!this.isModified('password')) {
    return next();
  }

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
    return JWT.sign({ userId: this._id, role: this.role }, config.TOKEN_SECRET, {
      expiresIn: config.TOKEN_EXPIRES_IN,
    });
  },

  generateForgotPasswordToken: function () {
    // randomBytes(size) will produce a random data of 'size' length
    // toString() will convert that data into a primitive string
    // 'hex' argument will produce a URL-friendly string
    const token = crypto.randomBytes(20).toString('hex');

    // encryption of token using crypto module
    this.forgotPasswordToken = crypto.createHash('sha256').update(token).digest('hex');

    // token will expire in 30 min
    this.forgotPasswordExpiry = new Date(Date.now() + 30 * 60 * 1000);

    return token;
  },
};

// creating a model and exporting it
export default mongoose.model('User', userSchema);
