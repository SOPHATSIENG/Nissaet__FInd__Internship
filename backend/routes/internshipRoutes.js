const express = require('express');
const router = express.Router();
const internshipController = require('../controllers/internshipController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', internshipController.getAllInternships);
router.get('/featured-companies', internshipController.getFeaturedCompanies);
router.get('/companies', internshipController.getAllCompanies);

// Company routes (must be before /:id to avoid conflicts)
router.get('/company', authenticate, authorize('company'), internshipController.getCompanyInternships);
router.get('/company/mine', authenticate, authorize('company'), internshipController.getCompanyInternships);

// Student routes (must be before /:id to avoid conflicts)
router.get('/matching', authenticate, authorize('student'), internshipController.getMatchingInternships);
router.get('/saved', authenticate, authorize('student'), internshipController.getSavedInternships);
router.get('/student/recommended', authenticate, authorize('student'), internshipController.getRecommendedInternships);

// Dashboard routes (must be before /:id to avoid conflicts)
router.get('/dashboard/stats', authenticate, authorize('company'), internshipController.getDashboardStats);
router.get('/dashboard/trends', authenticate, authorize('company'), internshipController.getApplicationTrends);

// Internship by ID (must be after specific routes)
router.get('/:id', internshipController.getInternshipById);
router.post('/', authenticate, authorize('company', 'admin'), internshipController.createInternship);

module.exports = router;
