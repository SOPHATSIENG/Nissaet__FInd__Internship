const express = require('express');
const router = express.Router();
const { getPosts, getPostById } = require('../controllers/postController');

// Published posts should be publicly readable by students and guests.
router.get('/', getPosts);
router.get('/:id', getPostById);

module.exports = router;
