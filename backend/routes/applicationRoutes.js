const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');

router.post('/apply', applicationController.applyForInternship);
router.get('/student/:student_id', applicationController.getStudentApplications); // In real app, use token
router.get('/internship/:internship_id', applicationController.getInternshipApplications);
router.put('/:id/status', applicationController.updateApplicationStatus);

module.exports = router;
