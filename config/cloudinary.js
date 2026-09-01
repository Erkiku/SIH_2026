// Cloudinary configuration placeholder
// Replace with real credentials when ready to use image uploads

const cloudinaryConfig = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "your_cloud_name",
  api_key: process.env.CLOUDINARY_API_KEY || "your_api_key",
  api_secret: process.env.CLOUDINARY_API_SECRET || "your_api_secret",
};

// When ready, install cloudinary: npm install cloudinary
// const cloudinary = require('cloudinary').v2;
// cloudinary.config(cloudinaryConfig);

module.exports = { cloudinaryConfig };
