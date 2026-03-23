const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { authenticate, authorize } = require('../middleware/auth');

// Public presign (used during company registration)
router.post('/presign', uploadController.createPresignedUploadPublic);

// Authenticated presign (company settings / verification)
router.post('/presign/company', authenticate, authorize('company'), uploadController.createPresignedUploadCompany);

module.exports = router;
