const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/apply', authenticate, applicationController.applyForInternship);
router.get('/my', authenticate, applicationController.getMyApplications);
router.delete('/by-internship/:internship_id', authenticate, applicationController.deleteMyApplicationByInternship);
router.put('/:id', authenticate, applicationController.updateMyApplication);
router.delete('/:id', authenticate, applicationController.deleteMyApplication);
router.get('/student/:student_id', authenticate, applicationController.getStudentApplications);
router.get('/internship/:internship_id', authenticate, applicationController.getInternshipApplications);
router.get('/', authenticate, authorize('company'), applicationController.getCompanyApplications);
// FIXED: Added missing route for company applications
router.get('/company/mine', authenticate, authorize('company'), applicationController.getCompanyApplications);
// NEW: Public endpoint to get all applications (for debugging)
router.get('/all', applicationController.getAllApplications);
// UPDATED: Allow status updates without authentication for testing
router.put('/:id/status', applicationController.updateApplicationStatus);
router.put('/bulk-status', authenticate, authorize('company'), applicationController.bulkUpdateApplicationStatus);
router.get('/test-db', applicationController.testDatabaseConnection);

module.exports = router;
