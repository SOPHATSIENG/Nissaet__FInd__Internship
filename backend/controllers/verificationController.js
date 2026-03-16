const db = require('../config/db');

const isBadFieldError = (error) => error && error.code === 'ER_BAD_FIELD_ERROR';

const getCompanyProfile = async (userId) => {
  try {
    const rows = await db.query(
      `SELECT
        id,
        name AS company_name,
        industry,
        website,
        headquarters AS location
       FROM companies
       WHERE user_id = ?
       LIMIT 1`,
      [userId]
    );
    return rows[0] || null;
  } catch (error) {
    if (!isBadFieldError(error)) throw error;
    const rows = await db.query(
      `SELECT
        id,
        company_name,
        industry,
        website,
        location
       FROM companies
       WHERE user_id = ?
       LIMIT 1`,
      [userId]
    );
    return rows[0] || null;
  }
};

const createCompanyVerificationRequest = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const company = await getCompanyProfile(userId);
    if (!company) {
      return res.status(404).json({ message: 'Company profile not found' });
    }

    const [existing] = await db.query(
      `SELECT id, status FROM company_verifications
       WHERE company_id = ?
       ORDER BY submitted_at DESC
       LIMIT 1`,
      [company.id]
    );

    if (existing && existing.status === 'pending') {
      return res.json({ message: 'Verification already pending', verification_id: existing.id });
    }

    const documents = Array.isArray(req.body?.documents) ? req.body.documents : [];
    const contactEmail = req.body?.contact_email || req.body?.email || req.body?.contactEmail || null;
    const contactPerson = req.body?.contact_person || req.body?.contactPerson || null;

    const [result] = await db.queryRaw(
      `INSERT INTO company_verifications
        (company_id, user_id, status, documents, notes, company_name, industry, website, location, contact_email, contact_person)
       VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        company.id,
        userId,
        JSON.stringify(documents),
        req.body?.notes || null,
        company.company_name || null,
        company.industry || null,
        company.website || null,
        company.location || null,
        contactEmail,
        contactPerson
      ]
    );

    return res.status(201).json({
      message: 'Verification request created',
      verification_id: result.insertId
    });
  } catch (error) {
    console.error('Create company verification error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

const getCompanyVerificationRequests = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const rows = await db.query(
      `SELECT
        cv.id,
        cv.company_id,
        cv.user_id,
        cv.status,
        cv.documents,
        cv.notes,
        cv.rejection_reason,
        cv.submitted_at,
        cv.reviewed_at,
        cv.company_name,
        cv.industry,
        cv.website,
        cv.location,
        cv.contact_email,
        cv.contact_person
       FROM company_verifications cv
       WHERE cv.user_id = ?
       ORDER BY cv.submitted_at DESC`,
      [userId]
    );

    return res.json(rows);
  } catch (error) {
    console.error('Get company verification requests error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createCompanyVerificationRequest,
  getCompanyVerificationRequests
};
