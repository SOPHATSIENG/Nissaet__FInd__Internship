const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
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

// OAuth Routes
router.get('/google', (req, res, next) => {
    const { role, company_name, location } = req.query;
    const state = role ? JSON.stringify({ role, company_name, location, provider: 'google' }) : undefined;
    passport.authenticate('google', { 
        scope: ['profile', 'email'],
        state: state
    })(req, res, next);
});

router.get('/google/callback', 
    passport.authenticate('google', { failureRedirect: '/login' }),
    authController.oauthCallback
);

router.get('/github', (req, res, next) => {
    const { role, company_name, location } = req.query;
    const state = role ? JSON.stringify({ role, company_name, location, provider: 'github' }) : undefined;
    passport.authenticate('github', { 
        scope: ['user:email'],
        state: state
    })(req, res, next);
});

router.get('/github/callback', 
    passport.authenticate('github', { failureRedirect: '/login' }),
    authController.oauthCallback
);

module.exports = router;
