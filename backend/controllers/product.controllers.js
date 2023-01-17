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
 * @parameters fields, files
 * @returns Product object
 */

export const addProduct = asyncHandler(async (req, res) => {
  const form = formidable({
    multiples: true,
    keepExtensions: true,
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      throw new CustomError(err.message || 'Failed to parse form data', 400);
    }
    // Mongoose module provides an ObjectId() class which is used to create an ObjectId
    // using the same BSON format that mongoose uses to create _id
    // toHexString() returns ObjectId as a 24 characters hex string
    let productId = new Mongoose.Types.ObjectId().toHexString();

    if (!(fields.name && fields.price && fields.description && fields.categoryId)) {
      throw new CustomError('Please enter all the details', 400);
    }

    // File handling
    try {
      const imageURLs = await Promise.all(
        Object.values(files).map(async (file, index) => {
          const fileData = fs.readFileSync(file.filepath);

          const res = await uploadFile({
            bucketName: config.S3_BUCKET_NAME,
            key: `/product/${productId}/photo_${index + 1}`,
            body: fileData,
            contentType: file.mimetype,
          });

          return {
            url: res.Location,
          };
        })
      );

      const product = await Product.create({
        _id: productId,
        images: imageURLs,
        ...fields,
      });

      if (!product) {
        throw new CustomError('Product not created', 400);
      }

      res.status(200).json({
        success: true,
        message: 'Product added successfully',
        product,
      });
    } catch (err) {
      throw new CustomError(err.message || 'Failed to upload images', err.code || 500);
    }
  });
});

/**
 * @UPDATE_PRODUCT
 * @request_type PUT
 * @route http://localhost:4000/api/updateProduct/:productId
 * @description Controller to update a product
 * @description Only admin can update the product
 * @description New images will overwrite the existing ones in AWS S3
 * @parameters fields, files, productId
 * @returns Product object
 */

export const updateProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const product = await Product.findById(productId);

  if (!product) {
    throw new CustomError('Product not found', 400);
  }

  const form = formidable({
    multiples: true,
    keepExtensions: true,
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      throw new CustomError('Failed to parse form data', 400);
    }

    if (!(fields.name && fields.price && fields.description && fields.categoryId)) {
      throw new CustomError('Please enter all the details', 400);
    }

    try {
      const imageURLs = await Promise.all(
        Object.values(files).map(async (file, index) => {
          const fileData = fs.readFileSync(file.filepath);

          const res = await uploadFile({
            bucketName: config.S3_BUCKET_NAME,
            key: `/product/${productId}/photo_${index + 1}`,
            body: fileData,
            contentType: file.mimetype,
          });

          return {
            url: res.Location,
          };
        })
      );

      const product = await Product.findByIdAndUpdate(
        productId,
        {
          images: imageURLs,
          ...fields,
        },
        {
          new: true,
          runValidators: true,
        }
      );

      if (!product) {
        throw new CustomError('Product not updated', 400);
      }

      res.status(200).json({
        success: true,
        message: 'Product updated successfully',
        product,
      });
    } catch (err) {
      throw new CustomError(err.message || 'Failed to upload images', err.code || 500);
    }
  });
});

/**
 * @DELETE_PRODUCT
 * @request_type DELETE
 * @route http://localhost:4000/api/deleteProduct/:productId
 * @description Controller to delete a product
 * @description Only admin can delete the product
 * @description Product images stored inside AWS S3 will also be deleted
 * @parameters productId
 * @returns Response object
 */

export const deleteProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const product = await Product.findByIdAndDelete(productId);

  if (!product) {
    throw new CustomError('Product not found', 400);
  }

  try {
    await Promise.all(
      product.images.map(
        async ({ url }, index) =>
          await deleteFile({
            bucketName: config.S3_BUCKET_NAME,
            key: `/product/${productId}/photo_${index + 1}`,
          })
      )
    );
  } catch (err) {
    throw new CustomError(err.message || 'Failed to delete images', 500);
  }

  product.remove();

  res.status(200).json({
    success: true,
    message: 'Product deleted successfully',
  });
});

/**
 * @GET_PRODUCT
 * @request_type GET
 * @route http://localhost:4000/api/getProduct/:productId
 * @description Controller to fetch a product
 * @description Both user and admin can access the product
 * @parameters productId
 * @returns Product object
 */

export const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.productId);

  if (!product) {
    throw new CustomError('Product not found', 400);
  }

  res.status(200).json({
    success: true,
    message: 'Product fetched successfully',
    product,
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
