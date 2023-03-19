import cloudinary from '../config/cloudinary.config.js';

export const fileUpload = async (path, folder) => {
  return await cloudinary.uploader.upload(path, {
    folder,
    resource_type: 'image',
    eager: [{ width: 500, crop: 'pad' }],
  });
};

export const fileDelete = async publicId => {
  return await cloudinary.uploader.destroy(publicId, {
    resource_type: 'image',
  });
};
