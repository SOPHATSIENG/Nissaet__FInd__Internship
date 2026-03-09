const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const { authenticate } = require('../middleware/auth');

router.post('/apply', authenticate, applicationController.applyForInternship);
router.get('/my', authenticate, applicationController.getMyApplications);
router.get('/student/:student_id', authenticate, applicationController.getStudentApplications);
router.get('/internship/:internship_id', authenticate, applicationController.getInternshipApplications);
router.get('/company/mine', authenticate, applicationController.getCompanyApplications);
router.put('/:id/status', authenticate, applicationController.updateApplicationStatus);

module.exports = router;
