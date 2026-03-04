const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { authenticate } = require('../middleware/auth');

router.get('/settings', authenticate, profileController.getSettings);
router.get('/notifications/card', authenticate, profileController.getNotificationCard);
router.put('/personal', authenticate, profileController.updatePersonalSettings);
router.put('/education', authenticate, profileController.updateEducationSettings);
router.put('/skills', authenticate, profileController.updateSkillsSettings);
router.put('/notifications', authenticate, profileController.updateNotificationSettings);
router.put('/security/password', authenticate, profileController.updatePassword);
router.put('/security/two-factor', authenticate, profileController.updateTwoFactorSettings);

module.exports = router;
