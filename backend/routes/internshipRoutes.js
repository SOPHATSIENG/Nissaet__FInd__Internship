const express = require('express');
const router = express.Router();
const internshipController = require('../controllers/internshipController');
const { authenticate, authorize } = require('../middleware/auth');

// Public routes
router.get('/', internshipController.getAllInternships);
router.get('/featured-companies', internshipController.getFeaturedCompanies);
router.get('/companies', internshipController.getAllCompanies);
router.get('/:id', internshipController.getInternshipById);

// Protected routes
router.get('/company/mine', authenticate, authorize('company'), internshipController.getCompanyInternships);
router.get('/student/recommended', authenticate, authorize('student'), internshipController.getRecommendedInternships);
router.post('/', authenticate, authorize('company', 'admin'), internshipController.createInternship);
router.put('/:id', authenticate, authorize('company', 'admin'), internshipController.updateInternship);
router.delete('/:id', authenticate, authorize('company', 'admin'), internshipController.deleteInternship);

module.exports = router;
