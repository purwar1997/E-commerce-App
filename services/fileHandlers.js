import cloudinary from '../config/cloudinary.config.js';

export const fileUpload = async path => {
  return await cloudinary.uploader.upload(path, {
    folder: 'users',
    resource_type: 'image',
    eager: [{ width: 400, crop: 'pad' }],
  });
};

export const fileDelete = async publicId => {
  return await cloudinary.uploader.destroy(publicId, {
    resource_type: 'image',
  });
};
