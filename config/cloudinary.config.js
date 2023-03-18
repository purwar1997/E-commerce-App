import { v2 as cloudinary } from 'cloudinary';
import config from './config.js';

cloudinary.config({
  cloud_name: config.CLOUD_NAME,
  api_key: config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_API_SECRET,
  secure: true,
  hide_sensitive: true,
});

export default cloudinary;
