const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');
const express = require('express');
const { imageUpload, pdfUpload, privatePdfDir } = require('../middleware/uploadMiddleware');
const { handleUpload } = require('../services/uploadService');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { protect, authorize } = require('../middleware/authMiddleware');
const Lesson = require('../models/Lesson');
const Enrollment = require('../models/Enrollment');
const { cloudinary } = require('../config/cloudinary');
const { isLessonUnlocked } = require('../utils/lessonAccess');

const router = express.Router();
const canReadPdf = authorize('student', 'admin', 'super_admin', 'instructor');

router.post('/image', protect, authorize('admin', 'super_admin', 'instructor'), imageUpload.single('image'), async (req, res) => {
  try {
    const file = req.file;
    const url = await handleUpload(file, 'image');
    return sendSuccess(res, 'Image uploaded successfully.', { url });
  } catch (error) {
    return sendError(res, error.message || 'Upload failed.', 400);
  }
});

router.post('/pdf', protect, authorize('admin', 'super_admin', 'instructor'), pdfUpload.single('pdf'), async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) {
      return sendError(res, 'No PDF file uploaded.', 400);
    }
    const header = await fs.promises.open(file.path, 'r');
    const signature = Buffer.alloc(5);
    try {
      await header.read(signature, 0, signature.length, 0);
    } finally {
      await header.close();
    }
    if (signature.toString('ascii') !== '%PDF-') {
      await fs.promises.unlink(file.path);
      return sendError(res, 'The uploaded file is not a valid PDF document.', 400);
    }

    const stored = await handleUpload(file, 'pdf');
    return sendSuccess(res, 'PDF uploaded successfully.', {
      url: stored.url,
      assetId: stored.assetId,
      fileName: path.basename(file.originalname),
      fileSize: file.size,
    });
  } catch (error) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      try {
        await fs.promises.unlink(req.file.path);
      } catch (cleanupError) {
        return next(cleanupError);
      }
    }
    return sendError(res, error.message || 'PDF upload failed.', 400);
  }
});

router.get('/pdf/:assetId', protect, canReadPdf, async (req, res, next) => {
  try {
    const { assetId } = req.params;
    const lesson = await Lesson.findOne({ pdfStorageId: assetId }).select('course module isPublished pdfName pdfPath pdfStorageId');
    if (!lesson || (req.user.role === 'student' && !lesson.isPublished) || !lesson.pdfStorageId) {
      return sendError(res, 'PDF material not found.', 404);
    }

    if (req.user.role === 'student') {
      const enrollment = await Enrollment.findOne({
        student: req.user._id,
        course: lesson.course,
        status: { $in: ['active', 'completed'] },
      });
      if (!enrollment) {
        return sendError(res, 'You are not enrolled in this course.', 403);
      }
      if (!(await isLessonUnlocked(lesson, enrollment))) {
        return sendError(res, 'Complete the previous lesson before accessing this PDF.', 403);
      }
    }

    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="lesson-material.pdf"');

    if (assetId.startsWith('l-')) {
      const filename = assetId.slice(2);
      if (!/^[\da-f-]{36}\.pdf$/i.test(filename)) {
        return sendError(res, 'PDF material not found.', 404);
      }
      const filePath = path.join(privatePdfDir, filename);
      if (!fs.existsSync(filePath)) {
        return sendError(res, 'PDF material not found.', 404);
      }
      const stream = fs.createReadStream(filePath);
      stream.on('error', next);
      return stream.pipe(res);
    }

    if (assetId.startsWith('c-')) {
      let publicId;
      try {
        publicId = Buffer.from(assetId.slice(2), 'base64url').toString('utf8');
      } catch {
        return sendError(res, 'PDF material not found.', 404);
      }
      if (!publicId.startsWith('amade/pdfs/')) {
        return sendError(res, 'PDF material not found.', 404);
      }

      const downloadUrl = cloudinary.utils.private_download_url(publicId, 'pdf', {
        resource_type: 'raw',
        type: 'upload',
        expires_at: Math.floor(Date.now() / 1000) + 60,
        attachment: false,
      });
      const upstream = await fetch(downloadUrl, { signal: AbortSignal.timeout(30000) });
      if (!upstream.ok || !upstream.body) {
        return next(new Error(`Private PDF delivery failed with HTTP ${upstream.status}.`));
      }
      const pdfStream = Readable.fromWeb(upstream.body);
      pdfStream.on('error', next);
      return pdfStream.pipe(res);
    }

    return sendError(res, 'PDF material not found.', 404);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
