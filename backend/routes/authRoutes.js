const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post('/register', authController.register);
router.post('/register/student', authController.registerStudentComplete);
router.post('/register/company', authController.registerCompanyComplete);
router.post('/register/admin', authController.registerAdmin);
router.post('/login', authController.login);
router.post('/social-login', authController.socialLogin);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.get('/skills', authController.getSkills);
router.get('/me', authenticate, authController.getCurrentUser);

module.exports = router;
