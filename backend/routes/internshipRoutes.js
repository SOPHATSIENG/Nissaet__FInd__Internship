const express = require('express');
const router = express.Router();
const internshipController = require('../controllers/internshipController');
const { authenticate, authorize } = require('../middleware/auth');

// Public routes
router.get('/', internshipController.getAllInternships);
router.get('/featured-companies', internshipController.getFeaturedCompanies);
router.get('/matching', authenticate, authorize('student'), internshipController.getMatchingInternships);
router.get('/saved', authenticate, authorize('student'), internshipController.getSavedInternships);
router.get('/:id', internshipController.getInternshipById);
router.post('/:id/save', authenticate, authorize('student'), internshipController.saveInternship);
router.delete('/:id/save', authenticate, authorize('student'), internshipController.unsaveInternship);
router.post('/', authenticate, authorize('company', 'admin'), internshipController.createInternship);
router.put('/:id', authenticate, authorize('company', 'admin'), internshipController.updateInternship);
router.delete('/:id', authenticate, authorize('company', 'admin'), internshipController.deleteInternship);

module.exports = router;
