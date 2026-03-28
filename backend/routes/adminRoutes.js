const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

// Protect all admin routes - only admins allowed
router.use(authenticate, authorize('admin'));

router.get('/users', adminController.getAllUsers);
router.get('/stats', adminController.getStats);
router.get('/dashboard/overview', adminController.getDashboardOverview);
router.get('/reports', adminController.getReports);
router.get('/settings', adminController.getAdminSettings);
router.put('/settings', adminController.updateAdminSettings);
router.post('/settings/export', adminController.exportAdminData);
router.post('/settings/purge', adminController.purgeAdminLogs);
router.get('/students/:id/profile', adminController.getAdminStudentProfile);
router.put('/users/:id', adminController.updateAdminUser);
router.get('/verifications/company', adminController.getCompanyVerifications);
router.put('/verifications/company/:id', adminController.updateCompanyVerificationStatus);
router.get('/verifications/student', adminController.getStudentVerifications);
router.put('/verifications/student/:id', adminController.updateStudentVerificationStatus);
router.delete('/users/:id', adminController.deleteUser);
router.get('/categories', adminController.getCategories);
router.post('/categories', adminController.createCategory);
router.put('/categories/:id', adminController.updateCategory);
router.delete('/categories/:id', adminController.deleteCategory);
router.get('/categories/:id/internships', adminController.getCategoryInternships);
router.get('/skills', adminController.getSkills);
router.post('/skills', adminController.createSkill);
router.put('/skills/:id', adminController.updateSkill);
router.delete('/skills/:id', adminController.deleteSkill);
router.get('/skills/:id/internships', adminController.getSkillInternships);
router.get('/internships/:id', adminController.getInternshipByIdForAdmin);
router.put('/internships/:id', adminController.updateInternshipForAdmin);
router.delete('/internships/:id', adminController.deleteInternshipForAdmin);
router.put('/internships/:id/flag', adminController.flagInternshipForAdmin);
router.put('/internships/:id/unflag', adminController.unflagInternshipForAdmin);
router.get('/job-types', adminController.getJobTypes);

module.exports = router;
