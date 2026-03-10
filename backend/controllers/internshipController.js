const db = require('../config/db');

const getCompanyIdByUserId = async (userId) => {
    console.log('Looking up company ID for user ID:', userId);
    const rows = await db.query('SELECT id FROM companies WHERE user_id = ? LIMIT 1', [userId]);
    console.log('Company query result:', rows);
    const companyId = rows.length > 0 ? rows[0].id : null;
    console.log('Final company ID:', companyId);
    return companyId;
};

const getAllInternships = async (req, res) => {
    try {
        const { search, location, skills, salary_type, limit: queryLimit } = req.query;
        
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
                c.headquarters AS company_location,
                c.logo AS company_logo
            FROM internships i
            JOIN companies c ON i.company_id = c.id
            WHERE i.status = 'active'
        `;

        const queryParams = [];

        if (search) {
            query += ` AND (i.title LIKE ? OR c.name LIKE ?)`;
            queryParams.push(`%${search}%`, `%${search}%`);
        }

        if (location && location !== 'All Locations') {
            query += ` AND i.location LIKE ?`;
            queryParams.push(`%${location}%`);
        }

        if (salary_type && salary_type !== 'All') {
            if (salary_type.toLowerCase() === 'paid') {
                query += ` AND i.stipend > 0`;
            } else if (salary_type.toLowerCase() === 'unpaid') {
                query += ` AND i.stipend = 0`;
            }
        }

        if (skills) {
            const skillList = Array.isArray(skills) ? skills : [skills];
            if (skillList.length > 0) {
                query += ` AND i.id IN (
                    SELECT iskill.internship_id 
                    FROM internship_skills iskill 
                    JOIN skills s ON iskill.skill_id = s.id 
                    WHERE s.name IN (?)
                )`;
                queryParams.push(skillList);
            }
        }

        query += ` ORDER BY i.created_at DESC`;

        if (limit) {
            query += ` LIMIT ?`;
            queryParams.push(limit);
        }

        const internships = await db.query(query, queryParams);

        return res.json({ internships });
    } catch (error) {
        console.error('Error fetching internships:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const getFeaturedCompanies = async (req, res) => {
    try {
        const parsedLimit = Number.parseInt(req.query.limit, 10);
        const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 24) : 8;

        const companies = await db.query(
            `SELECT
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
             LIMIT ${limit}`
        );

        return res.json({ companies });
    } catch (error) {
        console.error('Error fetching featured companies:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const getInternshipById = async (req, res) => {
    try {
        const { id } = req.params;

        const internships = await db.query(
            `SELECT
                i.id,
                i.company_id,
                i.title,
                i.description,
                i.requirements,
                i.responsibilities,
                i.benefits,
                i.location,
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
             WHERE i.id = ? AND i.status = 'active'`,
            [id]
        );

        if (internships.length === 0) {
            return res.status(404).json({ message: 'Internship not found' });
        }

        return res.json({ internship: internships[0] });
    } catch (error) {
        console.error('Error fetching internship:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const createInternship = async (req, res) => {
    try {
        console.log('Create internship request received:', req.body);
        console.log('User from token:', req.user);

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

        const connection = await db.connection();
        
        try {
            await connection.beginTransaction();

            // Insert internship
            const [result] = await connection.execute(
                `INSERT INTO internships (
                    company_id, title, description, requirements, location,
                    type, duration_months, stipend, stipend_currency,
                    positions, application_deadline, start_date, end_date, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
                [
                    companyId,
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
                    end_date || null
                ]
            );

            const internshipId = result.insertId;
            console.log('Internship created with ID:', internshipId);

            // Handle skills if provided
            if (skills && skills.length > 0) {
                console.log('Processing skills:', skills);
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
                        console.log('Created new skill:', skillName, 'with ID:', skillId);
                    } else {
                        skillId = existingSkills[0].id;
                        console.log('Found existing skill:', skillName, 'with ID:', skillId);
                    }

                    // Link skill to internship
                    await connection.execute(
                        'INSERT INTO internship_skills (internship_id, skill_id) VALUES (?, ?)',
                        [internshipId, skillId]
                    );
                }
            }

            await connection.commit();
            console.log('Transaction committed successfully');

            return res.status(201).json({
                message: 'Internship created successfully',
                internshipId: internshipId
            });
        } catch (error) {
            await connection.rollback();
            console.error('Transaction rolled back due to error:', error);
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error creating internship:', error);
        return res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

const getMatchingInternships = async (req, res) => {
    try {
        const userId = req.user?.userId;
        
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        // Get student's skills
        const studentSkills = await db.query(
            `SELECT s.id, s.name, ss.skill_level
             FROM student_skills ss
             JOIN skills s ON ss.skill_id = s.id
             JOIN students st ON ss.student_id = st.id
             WHERE st.user_id = ?`,
            [userId]
        );

        if (studentSkills.length === 0) {
            return res.json({ internships: [] });
        }

        const skillIds = studentSkills.map(skill => skill.id);
        
        // Find internships that match student's skills
        const matchingInternships = await db.query(
            `SELECT DISTINCT
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
                c.headquarters AS company_location,
                c.logo AS company_logo,
                COUNT(iskill.skill_id) AS matching_skills_count
             FROM internships i
             JOIN companies c ON i.company_id = c.id
             JOIN internship_skills iskill ON i.id = iskill.internship_id
             WHERE i.status = 'active' AND iskill.skill_id IN (?)
             GROUP BY i.id, c.id
             HAVING matching_skills_count > 0
             ORDER BY matching_skills_count DESC, i.created_at DESC`,
            [skillIds]
        );

        return res.json({ internships: matchingInternships });
    } catch (error) {
        console.error('Error fetching matching internships:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const getCompanyInternships = async (req, res) => {
    try {
        console.log('Getting company internships for user:', req.user);
        const companyId = await getCompanyIdByUserId(req.user.userId);
        console.log('Company ID found:', companyId);
        
        if (!companyId) {
            console.log('Company not found for user:', req.user.userId);
            return res.status(404).json({ message: 'Company not found' });
        }

        const internships = await db.query(
            `SELECT
                i.id,
                i.title,
                i.location,
                i.type,
                i.duration_months,
                i.stipend,
                i.application_deadline,
                i.status,
                i.views_count,
                i.applications_count,
                i.created_at,
                i.updated_at,
                c.name AS company_name
             FROM internships i
             JOIN companies c ON i.company_id = c.id
             WHERE i.company_id = ?
             ORDER BY i.created_at DESC`,
            [companyId]
        );

        console.log('Found internships:', internships.length, 'for company:', companyId);
        console.log('Internships data:', internships);

        return res.json({ internships });
    } catch (error) {
        console.error('Error fetching company internships:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const deleteInternship = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = await getCompanyIdByUserId(req.user.userId);
        
        if (!companyId) {
            return res.status(404).json({ message: 'Company not found' });
        }

        // First check if the internship belongs to this company
        const internship = await db.query(
            'SELECT id FROM internships WHERE id = ? AND company_id = ?',
            [id, companyId]
        );

        if (internship.length === 0) {
            return res.status(404).json({ message: 'Internship not found or does not belong to your company' });
        }

        // Delete the internship
        await db.query('DELETE FROM internships WHERE id = ?', [id]);

        return res.json({ message: 'Internship deleted successfully' });
    } catch (error) {
        console.error('Error deleting internship:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

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

            return res.json({
                message: 'Internship updated successfully'
            });
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
    getInternshipById,
    createInternship,
    getMatchingInternships,
    getCompanyInternships,
    deleteInternship,
    updateInternship,
    getDashboardStats,
    getApplicationTrends
};
