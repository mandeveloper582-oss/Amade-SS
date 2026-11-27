const express = require('express');
const {
  verifyCertificate,
  getCertificateRequests,
  approveCertificateRequest,
  rejectCertificateRequest,
} = require('../controllers/certificateController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/requests', protect, authorize('admin', 'super_admin'), getCertificateRequests);
router.patch('/requests/:requestId/approve', protect, authorize('admin', 'super_admin'), approveCertificateRequest);
router.patch('/requests/:requestId/reject', protect, authorize('admin', 'super_admin'), rejectCertificateRequest);
router.get('/verify/:certificateNumber', verifyCertificate);

module.exports = router;
