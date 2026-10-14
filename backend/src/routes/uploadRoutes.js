const express = require('express');
const upload = require('../middleware/uploadMiddleware');
const { handleUpload } = require('../services/uploadService');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, authorize('admin', 'super_admin', 'instructor'), upload.single('image'), async (req, res) => {
  try {
    const file = req.file;
    const url = await handleUpload(file);
    return sendSuccess(res, 'File uploaded successfully.', { url });
  } catch (error) {
    return sendError(res, error.message || 'Upload failed.', 400);
  }
});

module.exports = router;
