const express = require('express');
const router = express.Router();
const { getPosts, getPostById } = require('../controllers/postController');
const { authenticate } = require('../middleware/auth');

// Public or student-specific routes
// Use authenticate middleware to ensure the user is logged in
router.get('/', authenticate, getPosts);
router.get('/:id', authenticate, getPostById);

module.exports = router;
