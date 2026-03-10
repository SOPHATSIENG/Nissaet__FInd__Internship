const db = require('../config/db');

const getCompanyIdByUserId = async (userId) => {
    const rows = await db.query('SELECT id FROM companies WHERE user_id = ? LIMIT 1', [userId]);
    return rows.length > 0 ? rows[0].id : null;
};

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

const parsePagination = (query = {}) => {
    const parsedPage = Number.parseInt(query.page, 10);
    const parsedLimit = Number.parseInt(query.limit, 10);

    const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
    const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 100) : 10;
    const offset = (page - 1) * limit;

    return { page, limit, offset };
};

const getMyApplications = async (req, res) => {
    try {
        const userId = req.user?.userId;
        
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        if (req.user?.role !== 'student') {
            return res.status(403).json({ message: 'Only students can view their applications' });
        }

        const studentId = await getStudentIdByUserId(userId);
        
        if (!studentId) {
            return res.status(404).json({ message: 'Student profile not found' });
        }

        const { page, limit, offset } = parsePagination(req.query);

        const applications = await db.query(
            `SELECT
                a.id,
                a.student_id,
                a.internship_id,
                a.cover_letter,
                a.resume_url,
                a.status,
                a.applied_at AS created_at,
                a.updated_at,
                i.title,
                i.company_id,
                i.location,
                i.type AS work_mode,
                i.stipend AS salary,
                i.application_deadline AS deadline,
                c.name AS company_name,
                c.logo AS company_logo
             FROM applications a
             JOIN internships i ON a.internship_id = i.id
             JOIN companies c ON i.company_id = c.id
             WHERE a.student_id = ?
             ORDER BY a.applied_at DESC
             LIMIT ? OFFSET ?`,
            [studentId, limit, offset]
        );

        const countRows = await db.query(
            'SELECT COUNT(*) AS total FROM applications WHERE student_id = ?',
            [studentId]
        );
        const total = Number(countRows[0]?.total || 0);
        const totalPages = total > 0 ? Math.ceil(total / limit) : 0;

        return res.json({
            applications,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.error('Error fetching my applications:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const applyForInternship = async (req, res) => {
    try {
        const { internship_id, cover_letter } = req.body;
        const userId = req.user?.role === 'student' ? req.user.userId : null;
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
        const { page, limit, offset } = parsePagination(req.query);
        const isAdmin = req.user?.role === 'admin';

        let targetStudentId = requestedStudentId;
        if (!isAdmin) {
            if (req.user?.role !== 'student') {
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
                a.applied_at AS created_at,
                a.updated_at,
                i.title,
                i.company_id,
                c.name AS company_name
             FROM applications a
             JOIN internships i ON a.internship_id = i.id
             JOIN companies c ON i.company_id = c.id
             WHERE a.student_id = ?
             ORDER BY a.applied_at DESC
             LIMIT ? OFFSET ?`,
            [targetStudentId, limit, offset]
        );

        const countRows = await db.query(
            'SELECT COUNT(*) AS total FROM applications WHERE student_id = ?',
            [targetStudentId]
        );
        const total = Number(countRows[0]?.total || 0);
        const totalPages = total > 0 ? Math.ceil(total / limit) : 0;

        return res.json({
            applications,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.error('Error fetching student applications:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const getInternshipApplications = async (req, res) => {
    try {
        const internshipId = Number(req.params.internship_id);
        const { page, limit, offset } = parsePagination(req.query);
        const companyOwnerUserId = await getCompanyUserIdByInternshipId(internshipId);

        if (!companyOwnerUserId) {
            return res.status(404).json({ message: 'Internship not found' });
        }

        const isAdmin = req.user?.role === 'admin';
        const isOwnerCompany = req.user?.role === 'company' && Number(req.user.userId) === Number(companyOwnerUserId);

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
                a.applied_at AS created_at,
                a.updated_at,
                u.full_name,
                u.email,
                s.phone,
                s.university,
                s.current_education_level
             FROM applications a
             JOIN students s ON a.student_id = s.id
             JOIN users u ON s.user_id = u.id
             WHERE a.internship_id = ?
             ORDER BY a.applied_at DESC
             LIMIT ? OFFSET ?`,
            [internshipId, limit, offset]
        );

        const countRows = await db.query(
            'SELECT COUNT(*) AS total FROM applications WHERE internship_id = ?',
            [internshipId]
        );
        const total = Number(countRows[0]?.total || 0);
        const totalPages = total > 0 ? Math.ceil(total / limit) : 0;

        return res.json({
            applications,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        });
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

        const isAdmin = req.user?.role === 'admin';
        const isOwnerCompany = req.user?.role === 'company' && Number(req.user.userId) === Number(companyOwnerUserId);

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

const getCompanyApplications = async (req, res) => {
    try {
        const companyId = await getCompanyIdByUserId(req.user.userId);
        
        if (!companyId) {
            return res.status(404).json({ message: 'Company not found' });
        }

        const { page, limit, offset } = parsePagination(req.query);
        const isAdmin = req.user?.role === 'admin';

        let targetCompanyId = companyId;
        if (!isAdmin) {
            const ownCompanyId = await getCompanyIdByUserId(req.user.userId);
            if (!ownCompanyId) {
                return res.status(404).json({ message: 'Company profile not found' });
            }
            targetCompanyId = ownCompanyId;
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
                u.phone,
                s.university,
                s.education,
                i.title,
                i.company_id,
                c.company_name
             FROM applications a
             JOIN students s ON a.student_id = s.id
             JOIN users u ON s.user_id = u.id
             JOIN internships i ON a.internship_id = i.id
             JOIN companies c ON i.company_id = c.id
             WHERE i.company_id = ?
             ORDER BY a.created_at DESC
             LIMIT ${limit} OFFSET ${offset}`,
            [targetCompanyId]
        );

        const countRows = await db.query(
            `SELECT COUNT(*) AS total FROM applications a
             JOIN internships i ON a.internship_id = i.id
             WHERE i.company_id = ${companyId}`,
            [targetCompanyId]
        );
        const total = Number(countRows[0]?.total || 0);
        const totalPages = total > 0 ? Math.ceil(total / limit) : 0;

        return res.json({
            applications,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.error('Error fetching company applications:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const bulkUpdateApplicationStatus = async (req, res) => {
    try {
        const { ids, status } = req.body;
        const companyId = await getCompanyIdByUserId(req.user.userId);
        
        if (!companyId) {
            return res.status(404).json({ message: 'Company not found' });
        }

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'Application IDs are required' });
        }

        const validStatuses = new Set(['pending', 'reviewing', 'shortlisted', 'rejected', 'withdrawn']);
        if (!validStatuses.has(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        // Verify all applications belong to this company
        const applicationChecks = await db.query(
            `SELECT a.id, i.company_id
             FROM applications a
             JOIN internships i ON a.internship_id = i.id
             WHERE a.id IN (${ids.map(() => '?').join(',')}) AND i.company_id = ${companyId}`,
            [ids, companyId]
        );

        if (applicationChecks.length !== ids.length) {
            return res.status(404).json({ message: 'Some applications not found or do not belong to your company' });
        }

        const connection = await db.connection();
        try {
            await connection.beginTransaction();

            for (const id of ids) {
                await connection.execute(
                    'UPDATE applications SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                    [status, id]
                );
            }

            await connection.commit();
            return res.json({ 
                message: `${ids.length} application(s) updated successfully`,
                updatedCount: ids.length
            });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error bulk updating application status:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const testDatabaseConnection = async (req, res) => {
    try {
        // Test basic database connection
        const testQuery = await db.query('SELECT 1 as test');
        console.log('Database connection test:', testQuery);
        
        // Test if applications table exists and has data
        const applicationsCount = await db.query('SELECT COUNT(*) as count FROM applications');
        console.log('Applications count:', applicationsCount);
        
        // Test if companies table exists
        const companiesCount = await db.query('SELECT COUNT(*) as count FROM companies');
        console.log('Companies count:', companiesCount);
        
        return res.json({
            databaseConnected: true,
            applicationsCount: applicationsCount[0]?.count || 0,
            companiesCount: companiesCount[0]?.count || 0,
            message: 'Database connection successful'
        });
    } catch (error) {
        console.error('Database test failed:', error);
        return res.status(500).json({
            databaseConnected: false,
            error: error.message,
            message: 'Database connection failed'
        });
    }
};

module.exports = {
    applyForInternship,
    getMyApplications,
    getStudentApplications,
    getInternshipApplications,
    updateApplicationStatus,
    getCompanyApplications,
    bulkUpdateApplicationStatus,
    testDatabaseConnection
};


