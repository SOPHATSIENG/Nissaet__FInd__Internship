const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/apply', authenticate, applicationController.applyForInternship);
router.get('/my', authenticate, applicationController.getMyApplications);
router.get('/student/:student_id', authenticate, applicationController.getStudentApplications);
router.get('/internship/:internship_id', authenticate, applicationController.getInternshipApplications);
router.get('/', authenticate, authorize('company'), applicationController.getCompanyApplications);
// FIXED: Added missing route for company applications
router.get('/company/mine', authenticate, authorize('company'), applicationController.getCompanyApplications);
router.put('/:id/status', authenticate, applicationController.updateApplicationStatus);
router.put('/bulk-status', authenticate, authorize('company'), applicationController.bulkUpdateApplicationStatus);
router.get('/test-db', applicationController.testDatabaseConnection);

module.exports = router;
