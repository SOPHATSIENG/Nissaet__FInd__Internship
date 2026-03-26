const db = require('../config/db');
const { createNotification } = require('./notificationController');

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
        const { page, limit, offset } = parsePagination(req.query);
        
        if (!studentId) {
            return res.json({
                applications: [],
                pagination: {
                    page,
                    limit,
                    total: 0,
                    totalPages: 0,
                    hasNext: false,
                    hasPrev: false
                }
            });
        }
        const internshipFilterRaw = req.query?.internship_id;
        const internshipFilter = Number.isFinite(Number(internshipFilterRaw))
            ? Number(internshipFilterRaw)
            : null;
        const hasInternshipFilter = internshipFilter && internshipFilter > 0;

        const applications = await db.query(
            `SELECT
                a.id,
                a.student_id,
                a.internship_id,
                a.cover_letter,
                COALESCE(a.resume_url, s.resume_url) AS resume_url,
                a.status,
                a.applied_at AS created_at,
                a.updated_at,
                i.title,
                i.company_id,
                i.location,
                i.type AS work_mode,
                i.duration_months AS duration,
                i.stipend AS salary,
                i.application_deadline AS deadline,
                c.name AS company_name,
                c.logo AS company_logo
             FROM applications a
             JOIN students s ON a.student_id = s.id
             JOIN internships i ON a.internship_id = i.id
             JOIN companies c ON i.company_id = c.id
             WHERE a.student_id = ?
             ${hasInternshipFilter ? 'AND a.internship_id = ?' : ''}
             ORDER BY a.applied_at DESC
             LIMIT ? OFFSET ?`,
            hasInternshipFilter
                ? [studentId, internshipFilter, limit, offset]
                : [studentId, limit, offset]
        );

        const countRows = await db.query(
            `SELECT COUNT(*) AS total
             FROM applications
             WHERE student_id = ?
             ${hasInternshipFilter ? 'AND internship_id = ?' : ''}`,
            hasInternshipFilter ? [studentId, internshipFilter] : [studentId]
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
        const { internship_id, cover_letter, resume_url } = req.body;
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

        const providedResumeUrl = typeof resume_url === 'string' && resume_url.trim() ? resume_url.trim() : null;
        const resumeRows = await db.query(
            'SELECT resume_url FROM students WHERE id = ? LIMIT 1',
            [studentId]
        );
        const resumeUrl = providedResumeUrl || resumeRows[0]?.resume_url || null;

        const result = await db.query(
            'INSERT INTO applications (student_id, internship_id, cover_letter, resume_url, status) VALUES (?, ?, ?, ?, ?)',
            [studentId, internship_id, cover_letter || null, resumeUrl, 'pending']
        );

        await db.query(
            'UPDATE internships SET applications_count = applications_count + 1 WHERE id = ?',
            [internship_id]
        );

        try {
            // Notify the company
            const internshipRows = await db.query(
                'SELECT i.title, c.user_id FROM internships i JOIN companies c ON i.company_id = c.id WHERE i.id = ?',
                [internship_id]
            );
            
            if (internshipRows.length > 0) {
                const companyUserId = internshipRows[0].user_id;
                const internshipTitle = internshipRows[0].title;
                const studentName = req.user.fullName || 'A student';
                
                await createNotification(
                    companyUserId,
                    'New Application',
                    `${studentName} has applied for "${internshipTitle}"`,
                    'application',
                    'application',
                    result.insertId,
                    `/company/applications`
                );
            }
        } catch (notifyError) {
            console.error('Notification insert failed:', notifyError.message);
        }

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
                COALESCE(a.resume_url, s.resume_url) AS resume_url,
                a.status,
                a.applied_at AS created_at,
                a.updated_at,
                i.title,
                i.company_id,
                c.name AS company_name
             FROM applications a
             JOIN students s ON a.student_id = s.id
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
                COALESCE(a.resume_url, s.resume_url) AS resume_url,
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

const buildStatusNotification = (status, internshipTitle, companyName) => {
    let title = 'Application Update';
    let message = `Your application for "${internshipTitle}" at ${companyName} has been updated to: ${status}`;

    if (status === 'shortlisted' || status === 'accepted') {
        title = status === 'accepted' ? 'Application Accepted!' : 'Application Shortlisted!';
        message =
            status === 'accepted'
                ? `Great news! Your application for "${internshipTitle}" at ${companyName} has been accepted.`
                : `Congratulations! You have been shortlisted for "${internshipTitle}" at ${companyName}.`;
    } else if (status === 'rejected') {
        title = 'Application Status';
        message = `We regret to inform you that your application for "${internshipTitle}" at ${companyName} was not selected at this time.`;
    }

    return { title, message };
};

const updateApplicationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const validStatuses = new Set(['pending', 'reviewing', 'accepted', 'shortlisted', 'rejected', 'withdrawn']);

        if (!validStatuses.has(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        // For testing: Allow status updates without authentication
        console.log(`ðŸ”„ Updating application ${id} to status: ${status}`);

        // Check if application exists
        const appRows = await db.query(
            `SELECT a.id, a.internship_id, a.status
             FROM applications a
             WHERE a.id = ?`,
            [id]
        );

        if (appRows.length === 0) {
            return res.status(404).json({ message: 'Application not found' });
        }

        const application = appRows[0];
        console.log(`ðŸ“‹ Found application: ID=${application.id}, Current status=${application.status}`);

        // Update the status in database
        await db.query('UPDATE applications SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, id]);

        // Notify the student
        const studentInfoRows = await db.query(
            `SELECT u.id as user_id, i.title as internship_title, c.name as company_name
             FROM applications a
             JOIN students s ON a.student_id = s.id
             JOIN users u ON s.user_id = u.id
             JOIN internships i ON a.internship_id = i.id
             JOIN companies c ON i.company_id = c.id
             WHERE a.id = ?`,
            [id]
        );

        if (studentInfoRows.length > 0) {
            const { user_id, internship_title, company_name } = studentInfoRows[0];
            const { title, message } = buildStatusNotification(status, internship_title, company_name);

            await createNotification(
                user_id,
                title,
                message,
                'application',
                'application',
                id,
                `/account-settings?tab=applications`
            );
        }

        console.log(`âœ… Successfully updated application ${id} to status: ${status}`);

        return res.json({ 
            message: 'Application status updated successfully',
            applicationId: id,
            oldStatus: application.status,
            newStatus: status
        });
    } catch (error) {
        console.error('Error updating application status:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const updateMyApplication = async (req, res) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        if (req.user?.role !== 'student') {
            return res.status(403).json({ message: 'Only students can update their applications' });
        }

        const studentId = await getStudentIdByUserId(userId);
        if (!studentId) {
            return res.status(404).json({ message: 'Student profile not found' });
        }

        const applicationId = Number(req.params.id);
        if (!applicationId) {
            return res.status(400).json({ message: 'Application ID is required' });
        }

        const coverLetter = typeof req.body?.cover_letter === 'string' ? req.body.cover_letter.trim() : null;
        const resumeUrl = typeof req.body?.resume_url === 'string' && req.body.resume_url.trim()
            ? req.body.resume_url.trim()
            : null;

        const result = await db.query(
            `UPDATE applications 
             SET cover_letter = ?, resume_url = COALESCE(?, resume_url), updated_at = CURRENT_TIMESTAMP 
             WHERE id = ? AND student_id = ?`,
            [coverLetter || null, resumeUrl, applicationId, studentId]
        );

        if (!result?.affectedRows) {
            return res.status(404).json({ message: 'Application not found' });
        }

        return res.json({ message: 'Application updated successfully' });
    } catch (error) {
        console.error('Error updating application:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const deleteMyApplication = async (req, res) => {
    const userId = req.user?.userId;

    if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
    }

    if (req.user?.role !== 'student') {
        return res.status(403).json({ message: 'Only students can delete their applications' });
    }

    const studentId = await getStudentIdByUserId(userId);
    if (!studentId) {
        return res.status(404).json({ message: 'Student profile not found' });
    }

    const applicationId = Number(req.params.id);
    if (!applicationId) {
        return res.status(400).json({ message: 'Application ID is required' });
    }

    const connection = await db.connection();
    try {
        await connection.beginTransaction();

        const [rows] = await connection.execute(
            'SELECT id, internship_id FROM applications WHERE id = ? AND student_id = ? LIMIT 1',
            [applicationId, studentId]
        );

        if (!rows || rows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Application not found' });
        }

        const internshipId = rows[0].internship_id;

        await connection.execute('DELETE FROM applications WHERE id = ? AND student_id = ?', [applicationId, studentId]);

        if (internshipId) {
            await connection.execute(
                'UPDATE internships SET applications_count = GREATEST(applications_count - 1, 0) WHERE id = ?',
                [internshipId]
            );
        }

        await connection.commit();
        return res.json({ message: 'Application deleted successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Error deleting application:', error);
        return res.status(500).json({ message: 'Server error' });
    } finally {
        connection.release();
    }
};

const deleteMyApplicationByInternship = async (req, res) => {
    const userId = req.user?.userId;

    if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
    }

    if (req.user?.role !== 'student') {
        return res.status(403).json({ message: 'Only students can delete their applications' });
    }

    const studentId = await getStudentIdByUserId(userId);
    if (!studentId) {
        return res.status(404).json({ message: 'Student profile not found' });
    }

    const internshipId = Number(req.params.internship_id);
    if (!internshipId) {
        return res.status(400).json({ message: 'Internship ID is required' });
    }

    const connection = await db.connection();
    try {
        await connection.beginTransaction();

        const [rows] = await connection.execute(
            'SELECT id FROM applications WHERE internship_id = ? AND student_id = ? LIMIT 1',
            [internshipId, studentId]
        );

        if (!rows || rows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Application not found' });
        }

        await connection.execute(
            'DELETE FROM applications WHERE internship_id = ? AND student_id = ?',
            [internshipId, studentId]
        );

        await connection.execute(
            'UPDATE internships SET applications_count = GREATEST(applications_count - 1, 0) WHERE id = ?',
            [internshipId]
        );

        await connection.commit();
        return res.json({ message: 'Application deleted successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Error deleting application by internship:', error);
        return res.status(500).json({ message: 'Server error' });
    } finally {
        connection.release();
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
                COALESCE(a.resume_url, s.resume_url) AS resume_url,
                a.status,
                a.applied_at,
                a.updated_at,
                u.full_name,
                u.email,
                u.phone,
                COALESCE(u.profile_image, u.profile) AS profile_image,
                s.university,
                s.current_education_level,
                s.major,
                s.is_available,
                GROUP_CONCAT(sk.name ORDER BY sk.name SEPARATOR ',') AS skills,
                i.title AS internship_title,
                i.company_id,
                c.name AS company_name
             FROM applications a
             JOIN students s ON a.student_id = s.id
             JOIN users u ON s.user_id = u.id
             JOIN internships i ON a.internship_id = i.id
             JOIN companies c ON i.company_id = c.id
             LEFT JOIN user_skills us ON us.user_id = u.id
             LEFT JOIN skills sk ON sk.id = us.skill_id
             WHERE i.company_id = ?
             GROUP BY a.id
             ORDER BY a.applied_at DESC
             LIMIT ? OFFSET ?`,
            [targetCompanyId, limit, offset]
        );

        const countRows = await db.query(
            `SELECT COUNT(*) AS total
             FROM applications a
             JOIN internships i ON a.internship_id = i.id
             WHERE i.company_id = ?`,
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

        const validStatuses = new Set(['pending', 'reviewing', 'accepted', 'shortlisted', 'rejected', 'withdrawn']);
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

            // Notify students
            try {
                const rows = await db.query(
                    `SELECT 
                        a.id,
                        u.id as user_id,
                        i.title as internship_title,
                        c.name as company_name
                     FROM applications a
                     JOIN students s ON a.student_id = s.id
                     JOIN users u ON s.user_id = u.id
                     JOIN internships i ON a.internship_id = i.id
                     JOIN companies c ON i.company_id = c.id
                     WHERE a.id IN (${ids.map(() => '?').join(',')})`,
                    ids
                );
                for (const row of rows) {
                    const { title, message } = buildStatusNotification(status, row.internship_title, row.company_name);
                    await createNotification(
                        row.user_id,
                        title,
                        message,
                        'application',
                        'application',
                        row.id,
                        '/account-settings?tab=applications'
                    );
                }
            } catch (notifyError) {
                console.error('Bulk notification failed:', notifyError.message);
            }

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

const getAllApplications = async (req, res) => {
    try {
        const applications = await db.query(
            `SELECT
                a.id,
                a.student_id,
                a.internship_id,
                a.cover_letter,
                COALESCE(a.resume_url, s.resume_url) AS resume_url,
                a.status,
                a.applied_at,
                a.updated_at,
                u.full_name,
                u.email,
                u.phone,
                s.university,
                s.current_education_level,
                s.major,
                i.title AS internship_title,
                i.company_id,
                c.name AS company_name
             FROM applications a
             JOIN students s ON a.student_id = s.id
             JOIN users u ON s.user_id = u.id
             JOIN internships i ON a.internship_id = i.id
             JOIN companies c ON i.company_id = c.id
             ORDER BY a.applied_at DESC
             LIMIT 50`
        );

        return res.json({
            applications,
            total: applications.length
        });
    } catch (error) {
        console.error('Error fetching all applications:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    applyForInternship,
    getMyApplications,
    getStudentApplications,
    getInternshipApplications,
    updateApplicationStatus,
    updateMyApplication,
    deleteMyApplication,
    deleteMyApplicationByInternship,
    getCompanyApplications,
    getAllApplications,
    bulkUpdateApplicationStatus,
    testDatabaseConnection
};


