const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const multer = require('multer');

const uploadDir = path.join(__dirname, '../../uploads');
const privatePdfDir = path.join(__dirname, '../../private-pdfs');

fs.mkdirSync(uploadDir, { recursive: true });
fs.mkdirSync(privatePdfDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const safeName = `${randomUUID()}${extension}`;
    cb(null, safeName);
  },
});

const privatePdfStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, privatePdfDir);
  },
  filename: (_req, _file, cb) => {
    cb(null, `${randomUUID()}.pdf`);
  },
});

const imageMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const imageExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const pdfMimeTypes = new Set(['application/pdf']);
const pdfExtensions = new Set(['.pdf']);

const buildValidator = (allowedMimeTypes, allowedExtensions, errorMessage) => ({
  fileFilter: (_req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();

    if (!allowedMimeTypes.has(file.mimetype) || !allowedExtensions.has(extension)) {
      return cb(new Error(errorMessage), false);
    }

    cb(null, true);
  },
});

const imageUpload = multer({
  storage,
  fileFilter: buildValidator(imageMimeTypes, imageExtensions, 'Only JPG, JPEG, PNG, and WEBP images are allowed.').fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

const pdfUpload = multer({
  storage: privatePdfStorage,
  fileFilter: buildValidator(pdfMimeTypes, pdfExtensions, 'Only PDF files are allowed.').fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});

module.exports = { imageUpload, pdfUpload, privatePdfDir };
