const fs = require('fs');
const path = require('path');
const { cloudinary, configured } = require('../config/cloudinary');

const uploadsDir = path.resolve(__dirname, '../../uploads');

const ensureLocalFolder = () => {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
};

const uploadToCloudinary = async (file) => {
  if (!configured || !file || !file.path) {
    return null;
  }

  const result = await cloudinary.uploader.upload(file.path, {
    folder: 'amade',
    resource_type: 'image',
  });

  return result.secure_url;
};

const uploadToLocal = async (file) => {
  ensureLocalFolder();
  return `/uploads/${path.basename(file.path)}`;
};

const handleUpload = async (file) => {
  if (!file) {
    throw new Error('No file uploaded.');
  }

  const url = configured ? await uploadToCloudinary(file) : await uploadToLocal(file);

  if (!url) {
    throw new Error('Unable to process uploaded file.');
  }

  return url;
};

module.exports = { handleUpload };
