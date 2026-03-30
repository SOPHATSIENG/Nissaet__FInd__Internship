const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('../config/db');
const uploadController = require('../controllers/uploadController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Public presign (used during company registration)
router.post('/presign', uploadController.createPresignedUploadPublic);

// Authenticated presign (company settings / verification)
router.post('/presign/company', authenticate, authorize('company'), uploadController.createPresignedUploadCompany);

const uploadRoot = path.join(__dirname, '..', 'uploads', 'resumes');
fs.mkdirSync(uploadRoot, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadRoot);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.pdf';
    const safeExt = ext === '.pdf' ? ext : '.pdf';
    const safeName = `resume-${req.user?.userId || 'student'}-${Date.now()}${safeExt}`;
    cb(null, safeName);
  },
});

const fileFilter = (_req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

router.post('/resume', authenticate, authorize('student'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const url = `${baseUrl}/uploads/resumes/${req.file.filename}`;

    try {
      await db.query('UPDATE students SET resume_url = ? WHERE user_id = ?', [url, req.user.userId]);
    } catch {
      // If students table or column is missing, ignore and still return the URL
    }

    return res.json({
      url,
      filename: req.file.filename,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to upload resume' });
  }
});

module.exports = router;
