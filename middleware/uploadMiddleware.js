const multer = require("multer");
const path = require("path");

// File filter - only allow images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, PNG, and WebP images are allowed."), false);
  }
};

// Storage configuration - memory storage for Supabase/Cloudinary upload
const storage = multer.memoryStorage();

// Multer upload instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
    files: 5, // Max 5 files at once
  },
});

// Specific upload middlewares
const uploadSingle = upload.single("photo");
const uploadMultiple = upload.array("photos", 5);
const uploadProfilePhoto = upload.single("profilePhoto");

module.exports = {
  upload,
  uploadSingle,
  uploadMultiple,
  uploadProfilePhoto,
};
