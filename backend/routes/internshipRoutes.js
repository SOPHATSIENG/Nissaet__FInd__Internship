const express = require('express');
const router = express.Router();
const internshipController = require('../controllers/internshipController');
const { authenticate, authorize } = require('../middleware/auth');

// FIXED: Reordered routes - specific routes before parameterized routes

// Public routes
router.get('/', internshipController.getAllInternships);
router.get('/featured-companies', internshipController.getFeaturedCompanies);
router.get('/companies', internshipController.getAllCompanies);
router.get('/companies/:id', internshipController.getCompanyProfileById);

// Company routes (must be before /:id to avoid conflicts)
router.get('/company', authenticate, authorize('company'), internshipController.getCompanyInternships);
router.get('/company/mine', authenticate, authorize('company'), internshipController.getCompanyInternships);
router.get('/company/archived', authenticate, authorize('company'), internshipController.getCompanyArchivedInternships);
router.get('/company/:id', authenticate, authorize('company'), internshipController.getCompanyInternshipById);

// Student routes (must be before /:id to avoid conflicts)
router.get('/matching', authenticate, authorize('student'), internshipController.getMatchingInternships);
router.get('/saved', authenticate, authorize('student'), internshipController.getSavedInternships);
router.get('/student/recommended', authenticate, authorize('student'), internshipController.getRecommendedInternships);

// Dashboard routes (must be before /:id to avoid conflicts)
router.get('/dashboard/stats', authenticate, authorize('company'), internshipController.getDashboardStats);
router.get('/dashboard/trends', authenticate, authorize('company'), internshipController.getApplicationTrends);

// Internship by ID (must be after specific routes)
router.get('/:id', internshipController.getInternshipById);

// Save/unsave internships
router.post('/:id/save', authenticate, authorize('student'), internshipController.saveInternship);
router.delete('/:id/save', authenticate, authorize('student'), internshipController.unsaveInternship);

// CRUD operations
router.post('/', authenticate, authorize('company', 'admin'), internshipController.createInternship);
router.put('/:id', authenticate, authorize('company', 'admin'), internshipController.updateInternship);
router.put('/:id/restore', authenticate, authorize('company', 'admin'), internshipController.restoreInternship);
router.delete('/:id/permanent', authenticate, authorize('company', 'admin'), internshipController.permanentlyDeleteInternship);
router.delete('/:id', authenticate, authorize('company', 'admin'), internshipController.deleteInternship);

module.exports = router;
