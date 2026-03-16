const db = require('../config/db');

/**
 * Helper to identify database field errors (missing columns/tables)
 */
const isBadFieldError = (error) => error && error.code === 'ER_BAD_FIELD_ERROR';

/**
 * Helper to get company ID by user ID
 */
const getCompanyIdByUserId = async (userId) => {
    console.log('Looking up company ID for user ID:', userId);
    const rows = await db.query('SELECT id FROM companies WHERE user_id = ? LIMIT 1', [userId]);
    console.log('Company query result:', rows);
    const companyId = rows.length > 0 ? rows[0].id : null;
    console.log('Final company ID:', companyId);
    return companyId;
};

// Helper function to build IN clause with proper placeholders
const buildInClause = (columnName, items) => {
    if (!items || items.length === 0) {
        return { clause: '', params: [] };
    }
    const placeholders = items.map(() => '?').join(', ');
    return {
        clause: `${columnName} IN (${placeholders})`,
        params: items
    };
};

/**
 * Get all internships with dynamic filtering and search
 */
const getAllInternships = async (req, res) => {
    try {
        const { search, location, work_mode, salary_type, limit: queryLimit } = req.query;
        const parsedLimit = Number.parseInt(queryLimit, 10);
        const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 100) : null;

        let query = `
            SELECT
                i.id,
                i.company_id,
                i.title,
                i.description,
                i.requirements,
                i.location,
                i.type AS work_mode,
                i.duration_months AS duration,
                i.stipend AS salary_min,
                i.stipend AS salary_max,
                CASE 
                    WHEN i.stipend > 0 THEN 'paid'
                    ELSE 'unpaid'
                END AS salary_type,
                i.positions,
                i.application_deadline AS deadline,
                i.status AS is_active,
                i.views_count AS views,
                i.applications_count,
                i.created_at,
                i.updated_at,
                c.name AS company_name,
                c.logo AS company_logo,
                c.industry AS company_industry,
                c.headquarters AS company_location,
                c.logo AS company_logo
             FROM internships i
             JOIN companies c ON i.company_id = c.id
             WHERE i.status = 'active'
        `;

        const queryParams = [];

        if (search) {
            query += ' AND (i.title LIKE ? OR i.description LIKE ? OR c.name LIKE ?)';
            const searchPattern = `%${search}%`;
            queryParams.push(searchPattern, searchPattern, searchPattern);
        }

        if (location) {
            query += ' AND (i.location LIKE ? OR c.headquarters LIKE ?)';
            const locationPattern = `%${location}%`;
            queryParams.push(locationPattern, locationPattern);
        }

        if (work_mode && work_mode !== 'All') {
            query += ' AND i.type = ?';
            queryParams.push(work_mode.toLowerCase());
        }

        if (salary_type && salary_type !== 'All') {
            if (salary_type.toLowerCase() === 'paid') {
                query += ' AND i.stipend > 0';
            } else if (salary_type.toLowerCase() === 'unpaid') {
                query += ' AND i.stipend = 0';
            }
        }

        query += ' ORDER BY i.created_at DESC';

        if (limit) {
            query += ' LIMIT ?';
            queryParams.push(limit);
        }

        let internships = await db.query(query, queryParams);

        // Get total count for pagination
        let totalQuery = query.replace(/SELECT.*?FROM/, 'SELECT COUNT(*) as total FROM').replace(/ORDER BY.*$/, '');
        const totalResult = await db.query(totalQuery, queryParams);
        const total = totalResult[0]?.total || 0;

        try {
            // Test if the query works with current schema
            await db.query(query, queryParams);
        } catch (error) {
            if (!isBadFieldError(error)) throw error;
            
            // Fallback for legacy schema
            console.warn('Query failed, trying legacy schema fallback...');
            let fallbackSql = `
                SELECT
                    i.*,
                    c.company_name,
                    c.logo AS company_logo,
                    c.location AS company_location
                FROM internships i
                JOIN companies c ON i.company_id = c.id
                WHERE (i.is_active = 1 OR i.status = 'active')
                ORDER BY i.created_at DESC LIMIT ?
            `;
            internships = await db.query(fallbackSql, [Number.parseInt(limit, 10)]);
        }

        return res.json({ 
            success: true,
            total,
            count: internships.length,
            internships 
        });
    } catch (error) {
        console.error('Error fetching internships:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Get featured companies
 */
const getFeaturedCompanies = async (req, res) => {
    try {
        const limit = Number.parseInt(req.query.limit, 10) || 8;

        let sql = `
            SELECT
                c.id,
                c.name AS company_name,
                c.description,
                c.logo,
                c.headquarters AS location,
                COUNT(i.id) AS open_positions
             FROM companies c
             LEFT JOIN internships i
                ON i.company_id = c.id
                AND i.status = 'active'
             GROUP BY c.id, c.name, c.description, c.logo, c.headquarters
             ORDER BY open_positions DESC, c.name ASC
             LIMIT ${limit}
        `;

        let companies;
        try {
            companies = await db.query(sql, [limit]);
        } catch (error) {
            if (!isBadFieldError(error)) throw error;
            
            const fallbackSql = `
                SELECT
                    c.id,
                    c.company_name,
                    c.description,
                    c.logo,
                    c.location,
                    COUNT(i.id) AS open_positions
                FROM companies c
                LEFT JOIN internships i ON i.company_id = c.id
                GROUP BY c.id, c.company_name, c.description, c.logo, c.location
                ORDER BY open_positions DESC
                LIMIT ?
            `;
            companies = await db.query(fallbackSql, [limit]);
        }

        return res.json({ success: true, companies });
    } catch (error) {
        console.error('Error fetching featured companies:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Get internship details by ID
 */
const getInternshipById = async (req, res) => {
    try {
        const { id } = req.params;

        const sql = `
            SELECT
                i.id,
                i.company_id,
                i.title,
                i.description,
                i.requirements,
                i.responsibilities,
                i.benefits,
                i.location,
                i.is_remote,
                i.is_hybrid,
                i.type AS work_mode,
                i.duration_months AS duration,
                i.stipend,
                i.stipend_currency,
                i.application_deadline AS deadline,
                i.start_date,
                i.end_date,
                i.status,
                i.views_count AS views,
                i.applications_count,
                i.created_at,
                i.updated_at,
                c.name AS company_name,
                c.headquarters AS company_location,
                c.description AS company_description,
                c.logo AS company_logo,
                c.website AS company_website,
                c.industry AS company_industry,
                c.company_size
             FROM internships i
             JOIN companies c ON i.company_id = c.id
             WHERE i.id = ? AND i.status = 'active'
        `;

        let results;
        try {
            results = await db.query(sql, [id]);
        } catch (error) {
            if (!isBadFieldError(error)) throw error;
            
            results = await db.query(`
                SELECT i.*, c.company_name, c.logo AS company_logo 
                FROM internships i 
                JOIN companies c ON i.company_id = c.id 
                WHERE i.id = ?
            `, [id]);
        }

        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Internship not found' });
        }

        const internship = results[0];

        // Increment view count
        try {
            await db.query('UPDATE internships SET views_count = views_count + 1 WHERE id = ?', [id]);
        } catch (err) {
            // Silently fail if column doesn't exist
            db.query('UPDATE internships SET views = views + 1 WHERE id = ?', [id]).catch(() => {});
        }

        // Get skills
        try {
            const skills = await db.query(`
                SELECT s.id, s.name, s.category, isk.skill_level, isk.is_required
                FROM internship_skills isk
                JOIN skills s ON isk.skill_id = s.id
                WHERE isk.internship_id = ?
            `, [id]);
            internship.skills = skills;
        } catch (err) {
            internship.skills = [];
        }

        return res.json({ success: true, internship });
    } catch (error) {
        console.error('Error fetching internship details:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Create a new internship
 */
const createInternship = async (req, res) => {
    try {
        console.log('=== CREATE INTERNSHIP FUNCTION CALLED ===');
        console.log('Request method:', req.method);
        console.log('Request URL:', req.originalUrl);
        console.log('Create internship request received:', req.body);
        console.log('User from token:', req.user);

        // Ensure this is not being called with an ID parameter (which would indicate routing issue)
        if (req.params.id) {
            console.error('ERROR: createInternship called with ID parameter:', req.params.id);
            return res.status(400).json({ message: 'Invalid request: createInternship should not be called with an ID' });
        }

        const {
            title,
            description,
            requirements,
            responsibilities,
            benefits,
            location,
            is_remote = false,
            is_hybrid = false,
            type = 'full-time',
            duration_months,
            stipend = 0,
            stipend_currency = 'USD',
            positions = 1,
            application_deadline,
            start_date,
            end_date,
            skills
        } = req.body;

        let companyId = req.body.company_id;
        if (req.user && req.user.role === 'company') {
            console.log('Getting company ID for user:', req.user.userId);
            companyId = await getCompanyIdByUserId(req.user.userId);
            console.log('Company ID found:', companyId);
        }

        if (!companyId || !title || !description || !location || !duration_months || !application_deadline) {
            console.log('Validation failed:', { companyId, title: !!title, description: !!description, location: !!location, duration_months: !!duration_months, application_deadline: !!application_deadline });
            return res.status(400).json({ message: 'Required fields are missing' });
        }

        const params = [
            companyId, title, description, requirements || null, responsibilities || null,
            benefits || null, location || null, is_remote ? 1 : 0, is_hybrid ? 1 : 0, type || 'full-time',
            duration_months || null, stipend || 0, stipend_currency, positions || 1,
            application_deadline || null, start_date || null, end_date || null, 'active'
        ];

        let result;
        try {
            result = await db.query(
                `INSERT INTO internships (
                    company_id, title, description, requirements, responsibilities, benefits,
                    location, is_remote, is_hybrid, type, duration_months, stipend, stipend_currency,
                    positions, application_deadline, start_date, end_date, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                params
            );
        } catch (error) {
            if (!isBadFieldError(error)) throw error;
            
            // Legacy schema fallback
            const workMode = is_remote ? 'Remote' : (is_hybrid ? 'Hybrid' : 'On-site');
            result = await db.query(
                `INSERT INTO internships (company_id, title, description, location, work_mode, duration, deadline, is_active) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
                [companyId, title, description, location || null, workMode, duration_months ? `${duration_months} mo` : null, application_deadline || null]
            );
        }

        const internshipId = result.insertId;

        // Skills insertion
        if (Array.isArray(skills)) {
            for (const skill of skills) {
                const skillId = skill.id || skill.skill_id;
                if (skillId) {
                    await db.query(
                        'INSERT INTO internship_skills (internship_id, skill_id, skill_level, is_required) VALUES (?, ?, ?, ?)',
                        [internshipId, skillId, skill.level || 'intermediate', skill.required !== false]
                    ).catch(err => console.error('Skill insert failed:', err.message));
                }
            }
        }

        return res.status(201).json({ success: true, message: 'Internship created', internshipId });
    } catch (error) {
        console.error('Error creating internship:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};


/**
 * Update an internship
 */
const updateInternship = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = await getCompanyIdByUserId(req.user.userId);
        
        if (!companyId) {
            return res.status(404).json({ message: 'Company not found' });
        }

        // Check if the internship belongs to this company
        const internship = await db.query(
            'SELECT id FROM internships WHERE id = ? AND company_id = ?',
            [id, companyId]
        );

        if (internship.length === 0) {
            return res.status(404).json({ message: 'Internship not found or does not belong to your company' });
        }

        const {
            title,
            description,
            requirements,
            location,
            type = 'full-time',
            duration_months,
            stipend = 0,
            stipend_currency = 'USD',
            positions = 1,
            application_deadline,
            start_date,
            end_date,
            skills = []
        } = req.body;

        const connection = await db.connection();
        
        try {
            await connection.beginTransaction();

            // Update internship
            await connection.execute(
                `UPDATE internships SET
                    title = ?, description = ?, requirements = ?, location = ?,
                    type = ?, duration_months = ?, stipend = ?, stipend_currency = ?,
                    positions = ?, application_deadline = ?, start_date = ?, end_date = ?,
                    updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?`,
                [
                    title,
                    description,
                    requirements || null,
                    location,
                    type,
                    duration_months,
                    stipend,
                    stipend_currency,
                    positions,
                    application_deadline,
                    start_date || null,
                    end_date || null,
                    id
                ]
            );

            // Handle skills - remove existing skills and add new ones
            await connection.execute(
                'DELETE FROM internship_skills WHERE internship_id = ?',
                [id]
            );

            if (skills && skills.length > 0) {
                for (const skillName of skills) {
                    // Check if skill exists, if not create it
                    const [existingSkills] = await connection.execute(
                        'SELECT id FROM skills WHERE name = ?',
                        [skillName]
                    );

                    let skillId;
                    if (existingSkills.length === 0) {
                        // Create new skill
                        const [newSkill] = await connection.execute(
                            'INSERT INTO skills (name) VALUES (?)',
                            [skillName]
                        );
                        skillId = newSkill.insertId;
                    } else {
                        skillId = existingSkills[0].id;
                    }

                    // Link skill to internship
                    await connection.execute(
                        'INSERT INTO internship_skills (internship_id, skill_id) VALUES (?, ?)',
                        [id, skillId]
                    );
                }
            }

            await connection.commit();

            return res.json({ message: 'Internship updated successfully' });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error updating internship:', error);
        return res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

/**
 * Delete an internship
 */
const deleteInternship = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (req.user && req.user.role === 'company') {
            const companyId = await getCompanyIdByUserId(req.user.userId);
            const existing = await db.query('SELECT company_id FROM internships WHERE id = ?', [id]);
            if (existing.length === 0) return res.status(404).json({ message: 'Not found' });
            if (existing[0].company_id !== companyId) return res.status(403).json({ message: 'Forbidden' });
        }

        await db.query('DELETE FROM internships WHERE id = ?', [id]);
        return res.json({ success: true, message: 'Internship deleted' });
    } catch (error) {
        console.error('Delete failed:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Get recommended internships for a student based on their skills
 */
const getRecommendedInternships = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'student') {
            return res.status(401).json({ message: 'Only students can get recommendations' });
        }

        // Get student's skills from user_skills table
        const userSkills = await db.query(`
            SELECT skill_id FROM user_skills
            WHERE user_id = ?
        `, [req.user.userId]);

        if (userSkills.length === 0) {
            // If no skills listed, return empty list or latest internships
            // To avoid circular call or too much data, let's return empty if no skills
            return res.json({ success: true, internships: [] });
        }

        const skillIds = userSkills.map(s => s.skill_id);

        // Find internships that require these skills
        const sql = `
            SELECT 
                i.*, 
                c.name AS company_name, 
                c.logo AS company_logo,
                COUNT(isk.skill_id) AS matching_skills_count,
                CASE 
                    WHEN i.is_remote = 1 THEN 'Remote'
                    WHEN i.is_hybrid = 1 THEN 'Hybrid'
                    ELSE 'On-site'
                END AS work_mode
            FROM internships i
            JOIN companies c ON i.company_id = c.id
            JOIN internship_skills isk ON i.id = isk.internship_id
            WHERE i.status = 'active' AND isk.skill_id IN (${skillIds.map(() => '?').join(',')})
            GROUP BY i.id
            ORDER BY matching_skills_count DESC, i.created_at DESC
            LIMIT 4
        `;

        const internships = await db.query(sql, skillIds);

        return res.json({ success: true, internships });
    } catch (error) {
        console.error('Recommendation failed:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Get all companies with filtering
 */
const getAllCompanies = async (req, res) => {
    try {
        const {
            search,
            location,
            industry,
            limit = 12,
            offset = 0
        } = req.query;

        let whereClause = "WHERE 1=1";
        const params = [];

        if (search) {
            whereClause += ` AND (c.name LIKE ? OR c.description LIKE ? OR c.industry LIKE ?)`;
            const searchVal = `%${search}%`;
            params.push(searchVal, searchVal, searchVal);
        }

        if (location) {
            whereClause += ` AND c.headquarters LIKE ?`;
            params.push(`%${location}%`);
        }

        if (industry && industry !== 'all') {
            whereClause += ` AND c.industry = ?`;
            params.push(industry);
        }

        // Get total count
        const countSql = `SELECT COUNT(*) as total FROM companies c ${whereClause}`;
        const countResult = await db.query(countSql, params);
        const total = countResult[0].total;

        const sql = `
            SELECT
                c.id,
                c.name AS company_name,
                c.description,
                c.logo,
                c.industry,
                c.headquarters AS location,
                c.is_verified,
                c.company_size,
                COUNT(i.id) AS open_positions
            FROM companies c
            LEFT JOIN internships i ON i.company_id = c.id AND i.status = 'active'
            ${whereClause}
            GROUP BY c.id 
            ORDER BY c.is_verified DESC, c.name ASC 
            LIMIT ? OFFSET ?
        `;
        
        const queryParams = [...params, Number.parseInt(limit, 10), Number.parseInt(offset, 10)];
        const companies = await db.query(sql, queryParams);

        return res.json({ 
            success: true, 
            total,
            count: companies.length,
            companies 
        });
    } catch (error) {
        console.error('Error fetching companies:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Get all internships for the authenticated company
 */
const getCompanyInternships = async (req, res) => {
    try {
        const userId = req.user.userId;
        const companyId = await getCompanyIdByUserId(userId);

        if (!companyId) {
            return res.status(404).json({ success: false, message: 'Company profile not found' });
        }

        const sql = `
            SELECT
                i.*,
                c.name AS company_name,
                c.logo AS company_logo,
                COUNT(a.id) AS applicant_count
            FROM internships i
            JOIN companies c ON i.company_id = c.id
            LEFT JOIN applications a ON i.id = a.internship_id
            WHERE i.company_id = ?
            GROUP BY i.id, c.name, c.logo
            ORDER BY i.created_at DESC
        `;

        const internships = await db.query(sql, [companyId]);

        return res.json({ success: true, internships });
    } catch (error) {
        console.error('Error fetching company internships:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Save/Bookmark functions
const getSavedInternships = async (req, res) => {
    try {
        const userId = req.user?.userId;
        
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        // Get student's ID
        const studentRows = await db.query(
            'SELECT id FROM students WHERE user_id = ? LIMIT 1',
            [userId]
        );

        if (studentRows.length === 0) {
            return res.status(404).json({ message: 'Student profile not found' });
        }

        const studentId = studentRows[0].id;

        const savedInternships = await db.query(
            `SELECT 
                i.id,
                i.company_id,
                i.title,
                i.description,
                i.location,
                i.type AS work_mode,
                i.duration_months AS duration,
                i.stipend AS salary_min,
                i.stipend AS salary_max,
                CASE 
                    WHEN i.stipend > 0 THEN 'paid'
                    ELSE 'unpaid'
                END AS salary_type,
                i.positions,
                i.application_deadline AS deadline,
                i.status AS is_active,
                i.views_count AS views,
                i.applications_count,
                i.created_at,
                c.name AS company_name,
                c.headquarters AS company_location,
                c.logo AS company_logo,
                si.created_at AS saved_at
             FROM saved_internships si
             JOIN internships i ON si.internship_id = i.id
             JOIN companies c ON i.company_id = c.id
             WHERE si.student_id = ? AND i.status = 'active'
             ORDER BY si.created_at DESC`,
            [studentId]
        );

        return res.json({ internships: savedInternships });
    } catch (error) {
        console.error('Error fetching saved internships:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const saveInternship = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        // Get student's ID
        const studentRows = await db.query(
            'SELECT id FROM students WHERE user_id = ? LIMIT 1',
            [userId]
        );

        if (studentRows.length === 0) {
            return res.status(404).json({ message: 'Student profile not found' });
        }

        const studentId = studentRows[0].id;

        // Check if internship exists
        const internshipRows = await db.query(
            'SELECT id FROM internships WHERE id = ? AND status = "active"',
            [id]
        );

        if (internshipRows.length === 0) {
            return res.status(404).json({ message: 'Internship not found' });
        }

        // Check if already saved
        const existingSave = await db.query(
            'SELECT id FROM saved_internships WHERE student_id = ? AND internship_id = ?',
            [studentId, id]
        );

        if (existingSave.length > 0) {
            return res.status(400).json({ message: 'Internship already saved' });
        }

        // Save the internship
        await db.query(
            'INSERT INTO saved_internships (student_id, internship_id) VALUES (?, ?)',
            [studentId, id]
        );

        return res.status(201).json({ message: 'Internship saved successfully' });
    } catch (error) {
        console.error('Error saving internship:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const unsaveInternship = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        // Get student's ID
        const studentRows = await db.query(
            'SELECT id FROM students WHERE user_id = ? LIMIT 1',
            [userId]
        );

        if (studentRows.length === 0) {
            return res.status(404).json({ message: 'Student profile not found' });
        }

        const studentId = studentRows[0].id;

        // Check if save exists
        const existingSave = await db.query(
            'SELECT id FROM saved_internships WHERE student_id = ? AND internship_id = ?',
            [studentId, id]
        );

        if (existingSave.length === 0) {
            return res.status(404).json({ message: 'Saved internship not found' });
        }

        // Remove the save
        await db.query(
            'DELETE FROM saved_internships WHERE student_id = ? AND internship_id = ?',
            [studentId, id]
        );

        return res.json({ message: 'Internship unsaved successfully' });
    } catch (error) {
        console.error('Error unsaving internship:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const getDashboardStats = async (req, res) => {
    try {
        const companyId = await getCompanyIdByUserId(req.user.userId);
        
        if (!companyId) {
            return res.status(404).json({ message: 'Company not found' });
        }

        // Get total posts
        const totalPostsResult = await db.query(
            'SELECT COUNT(*) as total FROM internships WHERE company_id = ?',
            [companyId]
        );

        // Get active posts (status = 'active' and deadline not passed)
        const activePostsResult = await db.query(
            'SELECT COUNT(*) as active FROM internships WHERE company_id = ? AND status = "active" AND application_deadline > NOW()',
            [companyId]
        );

        // Get expired posts (deadline passed or status not active)
        const expiredPostsResult = await db.query(
            'SELECT COUNT(*) as expired FROM internships WHERE company_id = ? AND (status != "active" OR application_deadline <= NOW())',
            [companyId]
        );

        // Get total applicants
        const totalApplicantsResult = await db.query(
            'SELECT COALESCE(SUM(applications_count), 0) as total FROM internships WHERE company_id = ?',
            [companyId]
        );

        // Calculate trends (compare with last month)
        const lastMonthResult = await db.query(
            'SELECT COUNT(*) as last_month FROM internships WHERE company_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)',
            [companyId]
        );

        const previousMonthResult = await db.query(
            'SELECT COUNT(*) as previous_month FROM internships WHERE company_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 2 MONTH) AND created_at < DATE_SUB(NOW(), INTERVAL 1 MONTH)',
            [companyId]
        );

        const totalPosts = totalPostsResult[0].total;
        const activePosts = activePostsResult[0].active;
        const expiredPosts = expiredPostsResult[0].expired;
        const totalApplicants = totalApplicantsResult[0].total;
        const lastMonthPosts = lastMonthResult[0].last_month;
        const previousMonthPosts = previousMonthResult[0].previous_month;

        // Calculate trends
        let postsTrend = 'Stable';
        if (previousMonthPosts > 0) {
            const postsChange = ((lastMonthPosts - previousMonthPosts) / previousMonthPosts) * 100;
            postsTrend = postsChange >= 0 ? `+${postsChange.toFixed(0)}%` : `${postsChange.toFixed(0)}%`;
        }

        return res.json({
            totalPosted: totalPosts,
            activePosts: activePosts,
            expiredPosts: expiredPosts,
            totalApplicants: totalApplicants,
            postsTrend: postsTrend
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const getApplicationTrends = async (req, res) => {
    try {
        const companyId = await getCompanyIdByUserId(req.user.userId);
        
        if (!companyId) {
            return res.status(404).json({ message: 'Company not found' });
        }

        // Get monthly application trends for last 6 months
        const trends = await db.query(
            `SELECT 
                DATE_FORMAT(created_at, '%Y-%m') as month,
                COUNT(*) as posts,
                COALESCE(SUM(applications_count), 0) as applications
             FROM internships 
             WHERE company_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
             GROUP BY DATE_FORMAT(created_at, '%Y-%m')
             ORDER BY month ASC`,
            [companyId]
        );

        return res.json({ trends });
    } catch (error) {
        console.error('Error fetching application trends:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getAllInternships,
    getFeaturedCompanies,
    getAllCompanies,
    getInternshipById,
    createInternship,
    getCompanyInternships,
    deleteInternship,
    updateInternship,
    getDashboardStats,
    getApplicationTrends,
    getRecommendedInternships,
    getMatchingInternships: getRecommendedInternships,
    getSavedInternships,
    saveInternship,
    unsaveInternship
};

