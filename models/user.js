import mongoose from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import authRoles from '../utils/authRoles.js';
import config from '../config/config.js';

const userSchema = new mongoose.Schema(
  {
    firstname: {
      type: String,
      required: [true, 'Firstname is required'],
      lowercase: true,
      trim: true,
    },
    lastname: {
      type: String,
      required: [true, 'Lastname is required'],
      lowercase: true,
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: email => validator.isEmail(email),
        message: 'Please enter valid email id',
      },
    },
    phoneNo: {
      type: String,
      required: [true, 'Phone no. is required'],
      unique: true,
      trim: true,
      validate: {
        validator: phoneNo => validator.isMobilePhone(phoneNo),
        message: 'Please enter valid phone no.',
      },
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minLength: [6, 'Password should be atleast 6 characters long'],
      select: false,
      validate: {
        validator: password => validator.isStrongPassword(password, { minLength: 6 }),
        message:
          'Password should contain atleast one uppercase letter, one lowercase letter, one digit and one special character',
      },
    },
    role: {
      type: String,
      default: authRoles.User,
      enum: {
        values: Object.values(authRoles),
        message: 'Unsupported auth role',
      },
    },
    photo: {
      id: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
        validate: {
          validator: url =>
            validator.isURL(url, { protocols: ['http', 'https'], require_protocol: true }),
          message: 'Invalid URL',
        },
      },
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

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods = {
  comparePassword: async function (password) {
    return await bcrypt.compare(password, this.password);
  },

  generateJWTtoken: function () {
    const jwtToken = jwt.sign({ userId: this._id, role: this.role }, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRY,
    });

    return jwtToken;
  },

  generateForgotPasswordToken: function () {
    const token = crypto.randomBytes(30).toString('hex');
    this.forgotPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
    this.forgotPasswordExpiry = new Date(Date.now() + 30 * 60 * 1000);

    return token;
  },
};

export default mongoose.model('User', userSchema);
