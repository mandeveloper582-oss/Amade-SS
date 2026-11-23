const fs = require('fs');
const path = require('path');
const { cloudinary, configured } = require('../config/cloudinary');
const { privatePdfDir } = require('../middleware/uploadMiddleware');

const uploadsDir = path.resolve(__dirname, '../../uploads');

const ensureLocalFolder = () => {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
};

const uploadToCloudinary = async (file, kind = 'image') => {
  if (!configured || !file || !file.path) {
    return null;
  }

  const result = await cloudinary.uploader.upload(file.path, {
    folder: kind === 'pdf' ? 'amade/pdfs' : 'amade',
    resource_type: kind === 'pdf' ? 'raw' : 'image',
    ...(kind === 'pdf' ? { access_mode: 'authenticated' } : {}),
  });

  return kind === 'pdf' ? result.public_id : result.secure_url;
};

const uploadToLocal = async (file) => {
  ensureLocalFolder();
  return `/uploads/${path.basename(file.path)}`;
};

const handleUpload = async (file, kind = 'image') => {
  if (!file) {
    throw new Error('No file uploaded.');
  }

  if (kind === 'pdf') {
    if (!file.path.startsWith(`${privatePdfDir}${path.sep}`)) {
      throw new Error('PDF upload was not stored in the private storage directory.');
    }

    if (configured) {
      const publicId = await uploadToCloudinary(file, 'pdf');
      if (!publicId) {
        throw new Error('Unable to process uploaded PDF.');
      }
      await fs.promises.unlink(file.path);
      const assetId = `c-${Buffer.from(publicId).toString('base64url')}`;
      return { assetId, url: `/uploads/pdf/${assetId}` };
    }

    const assetId = `l-${path.basename(file.path)}`;
    return { assetId, url: `/uploads/pdf/${assetId}` };
  }

  const url = configured ? await uploadToCloudinary(file, kind) : await uploadToLocal(file);

  if (!url) {
    throw new Error('Unable to process uploaded file.');
  }

  return url;
};

module.exports = { handleUpload };
