import Category from '../models/category.js';
import asyncHandler from '../services/asyncHandler.js';
import CustomError from '../utils/customError.js';

/**
 * @ADD_CATEGORY
 * @request_type POST
 * @route http://localhost:4000/api/v1/category
 * @description Controller to add a category
 * @description Only admin and manager can add a category
 * @params name
 * @returns Category object
 */

export const addCategory = asyncHandler(async (req, res) => {
  const { name } = req.body;
  const { user } = res;

  if (!name) {
    throw new CustomError('Please provide a category name', 400);
  }

  const category = await Category.create({ name, addedBy: { userId: user._id, role: user.role } });

  res.status(201).json({
    success: true,
    message: 'Category successfully added',
    category,
  });
});

/**
 * @UPDATE_CATEGORY
 * @request_type PUT
 * @route http://localhost:4000/api/v1/category/:categoryId
 * @description Controller to update a category
 * @description Only admin and manager can update a category
 * @params name, categoryId
 * @returns Category object
 */

export const updateCategory = asyncHandler(async (req, res) => {
  const { categoryId } = req.params;
  const { name } = req.body;
  const { user } = res;

  if (!name) {
    throw new CustomError('Please provide a category name', 400);
  }

  const category = await Category.findByIdAndUpdate(
    categoryId,
    { name, lastUpdatedBy: { userId: user._id, role: user.role } },
    { new: true, runValidators: true }
  );

  if (!category) {
    throw new CustomError('Category not found', 404);
  }

  res.status(200).json({
    success: true,
    message: 'Category successfully updated',
    category,
  });
});

/**
 * @DELETE_CATEGORY
 * @request_type DELETE
 * @route http://localhost:4000/api/v1/category/:categoryId
 * @description Controller to delete a category
 * @description Only admin and manager can delete a category
 * @params categoryId
 * @returns Response object
 */

export const deleteCategory = asyncHandler(async (req, res) => {
  const { categoryId } = req.params;

  const category = await Category.findByIdAndDelete(categoryId);

  if (!category) {
    throw new CustomError('Category not found', 404);
  }

  res.status(200).json({
    success: true,
    message: 'Category successfully deleted',
  });
});

/**
 * @GET_CATEGORY
 * @request_type GET
 * @route http://localhost:4000/api/v1/category/:categoryId
 * @description Controller to fetch a category by id
 * @params categoryId
 * @returns Category object
 */

export const getCategory = asyncHandler(async (req, res) => {
  const { categoryId } = req.params;

  const category = await Category.findById(categoryId);

  if (!category) {
    throw new CustomError('Category not found', 404);
  }

  res.status(200).json({
    success: true,
    message: 'Category successfully fetched',
    category,
  });
});

/**
 * @GET_ALL_CATEGORIES
 * @request_type GET
 * @route http://localhost:4000/api/v1/categories
 * @description Controller to fetch all the categories
 * @params none
 * @returns Array of category objects
 */

export const getAllCategories = asyncHandler(async (_req, res) => {
  const categories = await Category.find();

  if (categories.length === 0) {
    throw new CustomError('No category found', 404);
  }

  res.status(200).json({
    success: true,
    message: 'All categories successfully fetched',
    categories,
  });
});
