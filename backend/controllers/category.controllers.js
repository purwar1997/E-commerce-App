import Category from '../models/category';
import asyncHandler from '../services/asyncHandler';
import CustomError from '../utils/customError';

/***** Controllers for Category model *****/

/**
 * @CREATE_CATEGORY
 * @request_type POST
 * @route http://localhost:4000/api/createCategory
 * @description Controller to create a category
 * @parameters name
 * @returns Category object
 */

export const createCategory = asyncHandler(async (req, res) => {
  const { name } = req.body;

  if (!name) {
    throw new CustomError('Please provide a category name', 400);
  }

  const newCategory = await Category.create({ name });

  res.status(200).json({
    success: true,
    message: 'A new category has been created',
    category: newCategory,
  });
});

/**
 * @UPDATE_CATEGORY
 * @request_type PUT
 * @route http://localhost:4000/api/updateCategory/:categoryId
 * @description Controller to update a category
 * @parameters name, categoryId
 * @returns Category object
 */

export const updateCategory = asyncHandler(async (req, res) => {
  const { name } = req.body;
  const { categoryId } = req.params;

  if (!name) {
    throw new CustomError('Please provide a category name', 400);
  }

  // {new: true} will return an updated document
  // runValidators option is used to turn on update validators
  // {runValidators: true} will run the mongoose validation before performing the update operation
  const updatedCategory = await Category.findByIdAndUpdate(
    categoryId,
    { name },
    { new: true, runValidators: true }
  );

  if (!updatedCategory) {
    throw new CustomError('Category not found', 400);
  }

  res.status(200).json({
    success: true,
    message: 'Category has been updated',
    category: updatedCategory,
  });
});

/**
 * @DELETE_CATEGORY
 * @request_type DELETE
 * @route http://localhost:4000/api/deleteCategory/:categoryId
 * @description Controller to delete a category
 * @parameters categoryId
 * @returns Response object
 */

export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndDelete(req.params.categoryId);

  if (!category) {
    throw new CustomError('Category not found', 401);
  }

  //  to free up the memory, use remove()
  category.remove();

  res.status(200).json({
    success: true,
    message: 'Category has been deleted',
  });
});

/**
 * @GET_CATEGORY
 * @request_type GET
 * @route http://localhost:4000/api/getCategory/:categoryId
 * @description Controller to fetch a category
 * @parameters categoryId
 * @returns Category object
 */

export const getCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.categoryId);

  if (!category) {
    throw new CustomError('Category not found', 400);
  }

  res.status(200).json({
    success: true,
    message: 'Category has been successfully fetched',
    category,
  });
});

/**
 * @GET_CATEGORIES
 * @request_type GET
 * @route http://localhost:4000/api/getCategories
 * @description Controller to fetch all the categories
 * @parameters none
 * @returns Array of category objects
 */

export const getCategories = asyncHandler(async (_req, res) => {
  const categories = await Category.find();

  //  find() returns an empty array if no documents are found
  if (!categories.length) {
    throw new CustomError('Categories not found', 400);
  }

  res.status(200).json({
    success: true,
    message: 'All the categories have been successfully fetched',
    categories,
  });
});
