const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const passport = require('../config/passport');

router.post('/register', authController.register);
router.post('/login', authController.login);

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

// Google OAuth routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', 
  (req, res, next) => {
    passport.authenticate('google', (err, user) => {
      if (err) {
        console.error('[google-oauth] callback error:', err.message);
        return res.redirect(
          `${frontendUrl}/login?oauthError=${encodeURIComponent('Google login failed. Please check database connection.')}`
        );
      }
      if (!user) {
        return res.redirect(
          `${frontendUrl}/login?oauthError=${encodeURIComponent('Google login failed. No user returned.')}`
        );
      }
      req.logIn(user, (loginErr) => {
        if (loginErr) {
          console.error('[google-oauth] session error:', loginErr.message);
          return res.redirect(
            `${frontendUrl}/login?oauthError=${encodeURIComponent('Google login failed. Session error.')}`
          );
        }
        return res.redirect(`${frontendUrl}/dashboard`);
      });
    })(req, res, next);
  }
);

// GitHub OAuth routes
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

router.get(
  '/github/callback',
  (req, res, next) => {
    passport.authenticate('github', (err, user) => {
      if (err) {
        console.error('[github-oauth] callback error:', err.message);
        return res.redirect(
          `${frontendUrl}/login?oauthError=${encodeURIComponent('GitHub login failed. Please check database connection.')}`
        );
      }
      if (!user) {
        return res.redirect(
          `${frontendUrl}/login?oauthError=${encodeURIComponent('GitHub login failed. No user returned.')}`
        );
      }
      req.logIn(user, (loginErr) => {
        if (loginErr) {
          console.error('[github-oauth] session error:', loginErr.message);
          return res.redirect(
            `${frontendUrl}/login?oauthError=${encodeURIComponent('GitHub login failed. Session error.')}`
          );
        }
        return res.redirect(`${frontendUrl}/dashboard`);
      });
    })(req, res, next);
  }
);

module.exports = router;
