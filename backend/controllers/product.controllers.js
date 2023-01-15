import formidable from 'formidable';
import Mongoose from 'mongoose';
import fs from 'fs';
import Product from '../models/product';
import asyncHandler from '../services/asyncHandler';
import { uploadFile, deleteFile } from '../services/fileHandler';
import CustomError from '../utils/customError';
import config from '../config/config';

/**
 * @ADD_PRODUCT
 * @request_type POST
 * @route http://localhost:4000/api/addProduct
 * @description Controller to create a new product
 * @description Only admin can create a new product
 * @description Uses AWS S3 bucket to store images
 * @parameters
 * @returns Product object
 */

export const addProduct = asyncHandler(async (req, res) => {
  const form = formidable({
    multiples: true,
    keepExtensions: true,
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      throw new CustomError(err.message || 'Cannot parse form data', 400);
    }
    // Mongoose module provides an ObjectId() class which is used to create an ObjectId
    // using the same BSON format that mongoose uses to create _id
    // toHexString() returns ObjectId as a 24 characters hex string
    let productId = new Mongoose.Types.ObjectId().toHexString();

    if (!(fields.name && fields.price && fields.description && fields.categoryId)) {
      throw new CustomError('Please enter all the details', 400);
    }

    // File handling
    const imageURLArray = await Promise.all(
      Object.keys(files).map(async (fileKey, index) => {
        const element = files[fileKey];
        const fileData = fs.readFileSync(element.filepath);

        const res = await uploadFile({
          bucketName: config.S3_BUCKET_NAME,
          key: `/product/${productId}/photo_${index + 1}`,
          body: fileData,
          contentType: element.mimetype,
        });

        return {
          url: res.Location,
        };
      })
    );

    const product = await Product.create({
      _id: productId,
      name: fields.name,
      price: fields.price,
      description: fields.description,
      images: imageURLArray,
      category: fields.categoryId,
    });

    if (!product) {
      throw new CustomError('Product not created', 400);
    }

    res.status(200).json({
      success: true,
      message: 'Product added successfully',
      product,
    });
  });
});

/**
 * @GET_ALL_PRODUCTS
 * @request_type GET
 * @route http://localhost:4000/api/getAllProducts
 * @description Controller to fetch all the products
 * @description User and Admin can access all the products
 * @parameters none
 * @returns Array of product objects
 */

export const getAllProducts = asyncHandler(async (_req, res) => {
  const products = await Product.find();

  if (!products.length) {
    throw new CustomError('Products not found', 400);
  }

  res.status(200).json({
    success: true,
    message: 'Products successfully fetched',
    products,
  });
});
