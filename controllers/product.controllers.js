import Product from '../models/product.js';
import asyncHandler from '../services/asyncHandler.js';
import CustomError from '../utils/customError.js';
import formParser from '../services/formParser.js';
import { uploadFile, deleteFile } from '../services/fileHandlers.js';
import WhereClause from '../utils/whereClause.js';

/**
 * @ADD_PRODUCT
 * @request_type POST
 * @route http://localhost:4000/api/v1/product
 * @description Controller that allows admin and manager to add product
 * @description Product images are uploaded on cloudinary
 * @params fields, files
 * @returns Product object
 */

export const addProduct = asyncHandler(async (req, res) => {
  const form = formParser('products');

  form.parse(req, async (err, fields, files) => {
    try {
      if (err) {
        throw new CustomError('Error parsing form data', 500);
      }

      if (!fields || Object.keys(fields).length === 0) {
        throw new CustomError('Fields not provided', 400);
      }

      const { name, price, description, brand, stock, category } = fields;

      if (!(name && price && description && brand && stock && category)) {
        throw new CustomError('Please provide all the details', 400);
      }

      if (!files || Object.keys(files).length === 0) {
        throw new CustomError('Files not provided', 400);
      }

      let { photos } = files;

      if (!Array.isArray(photos)) {
        photos = [photos];
      }

      if (photos.length > 5) {
        throw new CustomError('Maximum five photos can be uploaded for a product', 400);
      }

      photos = await Promise.all(
        photos.map(async photo => {
          const res = await uploadFile(photo.filepath, 'products');
          return { id: res.public_id, url: res.secure_url };
        })
      );

      const { user } = res;

      const product = await Product.create({
        name,
        price,
        description,
        photos,
        brand,
        stock,
        category,
        addedBy: { userId: user._id, role: user.role },
      });

      res.status(201).json({
        success: true,
        message: 'Product successfully added',
        product,
      });
    } catch (err) {
      res.status(err.code || 500).json({
        success: false,
        message: err.message,
      });
    }
  });
});

/**
 * @UPDATE_PRODUCT
 * @request_type PUT
 * @route http://localhost:4000/api/v1/product/:productId
 * @description Controller that allows admin and manager to update a product
 * @params productId, fields, files
 * @returns Product object
 */

export const updateProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  let product = await Product.findById(productId);

  if (!product) {
    throw new CustomError('Product not found', 404);
  }

  const form = formParser('products');

  form.parse(req, async (err, fields, files) => {
    try {
      if (err) {
        throw new CustomError('Error parsing form data', 500);
      }

      if (!fields || Object.keys(fields).length === 0) {
        throw new CustomError('Fields not provided', 400);
      }

      const { name, price, description, brand, stock, category } = fields;

      if (!(name && price && description && brand && stock && category)) {
        throw new CustomError('Please provide all the details', 400);
      }

      let { photos } = files;

      if (photos) {
        if (!Array.isArray(photos)) {
          photos = [photos];
        }

        await Promise.all(
          product.photos.map(async photo => {
            await deleteFile(photo.id);
          })
        );

        photos = await Promise.all(
          photos.map(async photo => {
            const res = await uploadFile(photo.filepath, 'products');
            return { id: res.public_id, url: res.secure_url };
          })
        );
      }

      const { user } = res;

      product = await Product.findByIdAndUpdate(
        productId,
        {
          name,
          price,
          description,
          brand,
          stock,
          category,
          photos,
          lastUpdatedBy: { userId: user._id, role: user.role },
        },
        { new: true, runValidators: true }
      );

      res.status(200).json({
        success: true,
        message: 'Product successfully updated',
        product,
      });
    } catch (err) {
      res.status(err.code || 500).json({
        success: false,
        message: err.message,
      });
    }
  });
});

/**
 * @DELETE_PRODUCT
 * @request_type DELETE
 * @route http://localhost:4000/api/v1/product/:productId
 * @description Controller that allows admin and manager to delete a product
 * @params productId
 * @returns Response object
 */

export const deleteProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const product = await Product.findById(productId);

  if (!product) {
    throw new CustomError('Product not found', 404);
  }

  await Promise.all(
    product.photos.map(async photo => {
      await deleteFile(photo.id);
    })
  );

  await Product.deleteOne({ _id: productId });

  res.status(200).json({
    success: true,
    message: 'Product successfully deleted',
  });
});

/**
 * @GET_PRODUCT
 * @request_type GET
 * @route http://localhost:4000/api/v1/product/:productId
 * @description Controller to fetch a product by id
 * @params productId
 * @returns Product object
 */

export const getProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const product = await Product.findById(productId);

  if (!product) {
    throw new CustomError('Product not found', 404);
  }

  res.status(200).json({
    success: true,
    message: 'Product successfully fetched',
    product,
  });
});

/**
 * @GET_ALL_PRODUCTS
 * @request_type GET
 * @route http://localhost:4000/api/v1/products/all
 * @description Controller to fetch all the products
 * @params none
 * @returns Array of product objects
 */

export const getAllProducts = asyncHandler(async (_req, res) => {
  const products = await Product.find();

  if (products.length === 0) {
    throw new CustomError('No product found', 404);
  }

  res.status(200).json({
    success: true,
    message: 'All products successfully fetched',
    products,
  });
});

/**
 * @GET_PRODUCTS
 * @request_type GET
 * @route http://localhost:4000/api/v1/products
 * @description Controller to fetch products based on search keywords and filters like ratings and price
 * @params search, page, ratings, price
 * @returns Array of product objects
 */

export const getProducts = asyncHandler(async (req, res) => {
  const resultsPerPage = 2;

  const productObj = new WhereClause(Product.find(), req.query)
    .search()
    .pagination(resultsPerPage)
    .filter();

  const products = await productObj.base;

  res.status(200).json({
    success: true,
    message: 'Products successfully fetched',
    products,
  });
});

/**
 * @ADD_PRODUCT_REVIEW
 * @request_type PUT
 * @route http://localhost:4000/api/v1/product/:productId/review/add
 * @description Controller that allows user to add product review
 * @params comment, rating
 * @returns Product object
 */

export const addReview = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { comment, rating } = req.body;

  if (!comment) {
    throw new CustomError('Please provide a product review', 400);
  }

  if (!rating) {
    throw new CustomError('Please provide a product rating', 400);
  }

  let product = await Product.findById(productId);

  if (!product) {
    throw new CustomError('Product not found', 404);
  }

  const { user } = res;

  product.reviews.push({ userId: user._id, name: user.name, comment, rating });
  product.ratings =
    product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length;

  product = await product.save();

  res.status(200).json({
    success: true,
    message: 'Review successfully added',
    product,
  });
});

/**
 * @UPDATE_PRODUCT_REVIEW
 * @request_type PUT
 * @route http://localhost:4000/api/v1/product/:productId/review/update
 * @description Controller that allows user to update product review
 * @params comment, rating
 * @returns Product object
 */

export const updateReview = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { comment, rating } = req.body;

  if (!comment) {
    throw new CustomError('Please provide a product review', 400);
  }

  if (!rating) {
    throw new CustomError('Please provide a product rating', 400);
  }

  let product = await Product.findById(productId);

  if (!product) {
    throw new CustomError('Product not found', 404);
  }

  const { user } = res;

  const index = product.reviews.findIndex(({ userId }) => userId === user._id);
  product.reviews.splice(index, 1, { userId: user._id, name: user.name, comment, rating });

  product.ratings =
    product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length;

  product = await product.save();

  res.status(200).json({
    success: true,
    message: 'Review successfully updated',
    product,
  });
});

/**
 * @GET_PRODUCT_REVIEWS
 * @request_type GET
 * @route http://localhost:4000/api/v1/product/:productId/reviews
 * @description Controller to fetch all the reviews of a particular product
 * @params productId
 * @returns Array of reviews
 */

export const getAllReviews = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const product = await Product.findById(productId);

  if (!product) {
    throw new CustomError('Product not found', 404);
  }

  res.status(200).json({
    success: true,
    message: 'Reviews successfully fetched',
    reviews: product.reviews,
  });
});
