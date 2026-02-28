const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/register/student', authController.registerStudentComplete);
router.post('/register/company', authController.registerCompanyComplete);
router.post('/register/admin', authController.registerAdmin);
router.post('/login', authController.login);

module.exports = router;
