const express = require('express');
const router = express.Router();
const verificationController = require('../controllers/verificationController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/company', authenticate, authorize('company'), verificationController.createCompanyVerificationRequest);
router.get('/company/mine', authenticate, authorize('company'), verificationController.getCompanyVerificationRequests);
router.put('/company/:id/documents', authenticate, authorize('company'), verificationController.updateCompanyVerificationDocuments);

module.exports = router;
