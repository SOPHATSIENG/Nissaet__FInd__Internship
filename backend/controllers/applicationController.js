const db = require('../config/db');

const applyForInternship = async (req, res) => {
    try {
        const { internship_id, cover_letter } = req.body;
        const student_id = req.user && req.user.role === 'student' ? req.user.userId : null;

        if (!student_id || !internship_id) {
            return res.status(400).json({ message: 'Authenticated student and internship ID are required' });
        }

        const existingApplication = await db.query(
            'SELECT id FROM applications WHERE student_id = ? AND internship_id = ?',
            [student_id, internship_id]
        );

        if (existingApplication.length > 0) {
            return res.status(400).json({ message: 'You have already applied for this internship' });
        }

        const result = await db.query(
            'INSERT INTO applications (student_id, internship_id, cover_letter, status) VALUES (?, ?, ?, ?)',
            [student_id, internship_id, cover_letter, 'pending']
        );

        await db.query(
            'UPDATE internships SET applications_count = applications_count + 1 WHERE id = ?',
            [internship_id]
        );

        res.status(201).json({
            message: 'Application submitted successfully',
            applicationId: result.insertId
        });
    } catch (error) {
        console.error('Error applying for internship:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getStudentApplications = async (req, res) => {
    try {
        const { student_id } = req.params;
        const isAdmin = req.user && req.user.role === 'admin';
        const isOwnRecord = req.user && req.user.role === 'student' && Number(student_id) === Number(req.user.userId);

        if (!isAdmin && !isOwnRecord) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const applications = await db.query(`
            SELECT 
                a.*,
                i.title,
                i.company_id,
                COALESCE(u.company_name, u.full_name) AS company_name
            FROM applications a
            JOIN internships i ON a.internship_id = i.id
            JOIN users u ON i.company_id = u.id
            WHERE a.student_id = ?
            ORDER BY a.created_at DESC
        `, [student_id]);

        res.json(applications);
    } catch (error) {
        console.error('Error fetching student applications:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getInternshipApplications = async (req, res) => {
    try {
        const { internship_id } = req.params;
        const internshipRows = await db.query('SELECT company_id FROM internships WHERE id = ?', [internship_id]);

        if (internshipRows.length === 0) {
            return res.status(404).json({ message: 'Internship not found' });
        }

        const internship = internshipRows[0];
        const isAdmin = req.user && req.user.role === 'admin';
        const isOwnerCompany = req.user && req.user.role === 'company' && Number(req.user.userId) === Number(internship.company_id);

        if (!isAdmin && !isOwnerCompany) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const applications = await db.query(`
            SELECT 
                a.*,
                u.full_name,
                u.email,
                u.phone,
                u.university,
                u.education
            FROM applications a
            JOIN users u ON a.student_id = u.id
            WHERE a.internship_id = ?
            ORDER BY a.created_at DESC
        `, [internship_id]);

        res.json(applications);
    } catch (error) {
        console.error('Error fetching internship applications:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateApplicationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['pending', 'accepted', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const appRows = await db.query(
            `SELECT a.id, i.company_id
             FROM applications a
             JOIN internships i ON a.internship_id = i.id
             WHERE a.id = ?`,
            [id]
        );

        if (appRows.length === 0) {
            return res.status(404).json({ message: 'Application not found' });
        }

        const application = appRows[0];
        const isAdmin = req.user && req.user.role === 'admin';
        const isOwnerCompany = req.user && req.user.role === 'company' && Number(req.user.userId) === Number(application.company_id);

        if (!isAdmin && !isOwnerCompany) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        await db.query('UPDATE applications SET status = ? WHERE id = ?', [status, id]);

        res.json({ message: 'Application status updated successfully' });
    } catch (error) {
        console.error('Error updating application status:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    applyForInternship,
    getStudentApplications,
    getInternshipApplications,
    updateApplicationStatus
};