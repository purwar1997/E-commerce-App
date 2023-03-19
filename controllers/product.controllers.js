import Product from '../models/product.js';
import asyncHandler from '../services/asyncHandler.js';
import CustomError from '../utils/customError.js';
import formParser from '../services/formParser.js';
import { fileUpload, fileDelete } from '../services/fileHandlers.js';

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

      photos = await Promise.all(
        photos.map(async photo => {
          const res = await fileUpload(photo.filepath, 'products');
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
