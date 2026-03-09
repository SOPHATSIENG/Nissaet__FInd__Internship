const db = require('../config/db');

const getStudentIdByUserId = async (userId) => {
    const rows = await db.query('SELECT id FROM students WHERE user_id = ? LIMIT 1', [userId]);
    return rows.length > 0 ? rows[0].id : null;
};

const getCompanyUserIdByInternshipId = async (internshipId) => {
    const rows = await db.query(
        `SELECT c.user_id
         FROM internships i
         JOIN companies c ON i.company_id = c.id
         WHERE i.id = ? LIMIT 1`,
        [internshipId]
    );
    return rows.length > 0 ? rows[0].user_id : null;
};

const applyForInternship = async (req, res) => {
    try {
        const { internship_id, cover_letter } = req.body;
        const userId = req.user && req.user.role === 'student' ? req.user.userId : null;
        const studentId = userId ? await getStudentIdByUserId(userId) : null;

        if (!studentId || !internship_id) {
            return res.status(400).json({ message: 'Authenticated student and internship ID are required' });
        }

        const existingApplication = await db.query(
            'SELECT id FROM applications WHERE student_id = ? AND internship_id = ?',
            [studentId, internship_id]
        );

        if (existingApplication.length > 0) {
            return res.status(400).json({ message: 'You have already applied for this internship' });
        }

        const result = await db.query(
            'INSERT INTO applications (student_id, internship_id, cover_letter, status) VALUES (?, ?, ?, ?)',
            [studentId, internship_id, cover_letter || null, 'pending']
        );

        await db.query(
            'UPDATE internships SET applications_count = applications_count + 1 WHERE id = ?',
            [internship_id]
        );

        return res.status(201).json({
            message: 'Application submitted successfully',
            applicationId: result.insertId
        });
    } catch (error) {
        console.error('Error applying for internship:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const getStudentApplications = async (req, res) => {
    try {
        const requestedStudentId = Number(req.params.student_id);
        const isAdmin = req.user && req.user.role === 'admin';

        let targetStudentId = requestedStudentId;
        if (!isAdmin) {
            if (!req.user || req.user.role !== 'student') {
                return res.status(403).json({ message: 'Forbidden' });
            }

            const ownStudentId = await getStudentIdByUserId(req.user.userId);
            if (!ownStudentId) {
                return res.status(404).json({ message: 'Student profile not found' });
            }

            const matchesOwnRecord =
                requestedStudentId === ownStudentId || requestedStudentId === req.user.userId;

            if (!matchesOwnRecord) {
                return res.status(403).json({ message: 'Forbidden' });
            }

            targetStudentId = ownStudentId;
        }

        const applications = await db.query(
            `SELECT
                a.id,
                a.student_id,
                a.internship_id,
                a.cover_letter,
                a.resume_url,
                a.status,
                a.created_at,
                a.updated_at,
                i.title,
                i.company_id,
                c.company_name
             FROM applications a
             JOIN internships i ON a.internship_id = i.id
             JOIN companies c ON i.company_id = c.id
             WHERE a.student_id = ?
             ORDER BY a.created_at DESC`,
            [targetStudentId]
        );

        return res.json({ applications });
    } catch (error) {
        console.error('Error fetching student applications:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const getInternshipApplications = async (req, res) => {
    try {
        const internshipId = Number(req.params.internship_id);
        const companyOwnerUserId = await getCompanyUserIdByInternshipId(internshipId);

        if (!companyOwnerUserId) {
            return res.status(404).json({ message: 'Internship not found' });
        }

        const isAdmin = req.user && req.user.role === 'admin';
        const isOwnerCompany = req.user && req.user.role === 'company' && Number(req.user.userId) === Number(companyOwnerUserId);

        if (!isAdmin && !isOwnerCompany) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const applications = await db.query(
            `SELECT
                a.id,
                a.student_id,
                a.internship_id,
                a.cover_letter,
                a.resume_url,
                a.status,
                a.created_at,
                a.updated_at,
                u.full_name,
                u.email,
                s.phone,
                s.university,
                s.education
             FROM applications a
             JOIN students s ON a.student_id = s.id
             JOIN users u ON s.user_id = u.id
             WHERE a.internship_id = ?
             ORDER BY a.created_at DESC`,
            [internshipId]
        );

        return res.json({ applications });
    } catch (error) {
        console.error('Error fetching internship applications:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const updateApplicationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const validStatuses = new Set(['pending', 'reviewing', 'accepted', 'rejected', 'withdrawn']);

        if (!validStatuses.has(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const appRows = await db.query(
            `SELECT a.id, a.internship_id
             FROM applications a
             WHERE a.id = ?`,
            [id]
        );

        if (appRows.length === 0) {
            return res.status(404).json({ message: 'Application not found' });
        }

        const application = appRows[0];
        const companyOwnerUserId = await getCompanyUserIdByInternshipId(application.internship_id);

        const isAdmin = req.user && req.user.role === 'admin';
        const isOwnerCompany = req.user && req.user.role === 'company' && Number(req.user.userId) === Number(companyOwnerUserId);

        if (!isAdmin && !isOwnerCompany) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        await db.query('UPDATE applications SET status = ? WHERE id = ?', [status, id]);

        return res.json({ message: 'Application status updated successfully' });
    } catch (error) {
        console.error('Error updating application status:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    applyForInternship,
    getStudentApplications,
    getInternshipApplications,
    updateApplicationStatus
};
