const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

// Protect all admin routes - only admins allowed
router.use(authenticate, authorize('admin'));

router.get('/users', adminController.getAllUsers);
router.get('/stats', adminController.getStats);

module.exports = router;
