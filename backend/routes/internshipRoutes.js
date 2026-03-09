const express = require('express');
const router = express.Router();
const internshipController = require('../controllers/internshipController');
const { authenticate, authorize } = require('../middleware/auth');

// Public routes
router.get('/', internshipController.getAllInternships);
router.get('/featured-companies', internshipController.getFeaturedCompanies);
<<<<<<< HEAD
router.get('/matching', authenticate, authorize('student'), internshipController.getMatchingInternships);
=======
router.get('/companies', internshipController.getAllCompanies);
>>>>>>> f9c397bcac7f83e2092a022591a7bcd323b8d3c4
router.get('/:id', internshipController.getInternshipById);

// Protected routes
router.get('/company/mine', authenticate, authorize('company'), internshipController.getCompanyInternships);
router.get('/student/recommended', authenticate, authorize('student'), internshipController.getRecommendedInternships);
router.post('/', authenticate, authorize('company', 'admin'), internshipController.createInternship);
router.put('/:id', authenticate, authorize('company', 'admin'), internshipController.updateInternship);
router.delete('/:id', authenticate, authorize('company', 'admin'), internshipController.deleteInternship);

module.exports = router;
