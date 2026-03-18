const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { authenticate, authorize } = require('../middleware/auth');

// Public routes
router.get('/', eventController.getAllEvents);
router.get('/featured', eventController.getFeaturedEvents);
router.get('/upcoming', eventController.getUpcomingEvents);

// Company routes (must be before /:id to avoid conflicts)
router.get('/company', authenticate, authorize('company'), eventController.getCompanyEvents);
router.get('/company/mine', authenticate, authorize('company'), eventController.getCompanyEvents);
router.get('/company/stats', authenticate, authorize('company'), eventController.getCompanyEventStats);

// Student routes (must be before /:id to avoid conflicts)
router.get('/student/registered', authenticate, authorize('student'), eventController.getStudentRegisteredEvents);
router.get('/student/recommended', authenticate, authorize('student'), eventController.getRecommendedEvents);

// Event by ID (must be after specific routes)
router.get('/:id', eventController.getEventById);

// Event registrations
router.post('/:id/register', authenticate, authorize('student'), eventController.registerForEvent);
router.delete('/:id/register', authenticate, authorize('student'), eventController.unregisterFromEvent);
router.get('/:id/registrations', authenticate, authorize('company'), eventController.getEventRegistrations);

// CRUD operations
router.post('/', authenticate, authorize('company', 'admin'), eventController.createEvent);
router.put('/:id', authenticate, authorize('company', 'admin'), eventController.updateEvent);
router.delete('/:id', authenticate, authorize('company', 'admin'), eventController.deleteEvent);

module.exports = router;
