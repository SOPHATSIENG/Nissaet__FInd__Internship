const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Public branding endpoint for the frontend navbar/logo.
router.get('/', adminController.getPublicBranding);

module.exports = router;
