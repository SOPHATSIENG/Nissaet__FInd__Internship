const db = require('../config/db');

/**
 * Helper to identify database field errors (missing columns/tables)
 */
const isBadFieldError = (error) => error && error.code === 'ER_BAD_FIELD_ERROR';

/**
 * Helper to get company ID by user ID
 */
const getCompanyIdByUserId = async (userId) => {
    try {
        const rows = await db.query('SELECT id FROM companies WHERE user_id = ? LIMIT 1', [userId]);
        return rows.length > 0 ? rows[0].id : null;
    } catch (error) {
        console.error('Error getting company ID:', error);
        return null;
    }
};

/**
 * Get all internships with dynamic filtering and search
 */
const getAllInternships = async (req, res) => {
    try {
        const {
            search,
            location,
            type,
            remote,
            hybrid,
            min_stipend,
            max_stipend,
            skills, // comma-separated skill IDs
            limit = 10,
            offset = 0,
            sort = 'recent'
        } = req.query;

<<<<<<< HEAD
        let whereClause = "WHERE i.status = 'active'";
        const params = [];
=======
        const internships = await db.query(
            `SELECT
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
             ORDER BY i.created_at DESC
             ${limit ? `LIMIT ${limit}` : ''}`
        );
>>>>>>> feature/phat

        // Keyword Search
        if (search) {
            whereClause += ` AND (i.title LIKE ? OR i.description LIKE ? OR c.name LIKE ?)`;
            const searchVal = `%${search}%`;
            params.push(searchVal, searchVal, searchVal);
        }

        // Location Filter
        if (location) {
            whereClause += ` AND (i.location LIKE ? OR c.headquarters LIKE ?)`;
            const locVal = `%${location}%`;
            params.push(locVal, locVal);
        }

        // Type Filter
        if (type && type !== 'all') {
            whereClause += ` AND i.type = ?`;
            params.push(type);
        }

        // Work Mode Filters
        if (remote === 'true' || remote === '1') {
            whereClause += ` AND i.is_remote = 1`;
        }
        if (hybrid === 'true' || hybrid === '1') {
            whereClause += ` AND i.is_hybrid = 1`;
        }

        // Stipend / Salary Filters
        if (min_stipend) {
            whereClause += ` AND i.stipend >= ?`;
            params.push(Number(min_stipend));
        }
        if (max_stipend) {
            whereClause += ` AND i.stipend <= ?`;
            params.push(Number(max_stipend));
        }

        // Skill Filters
        if (skills) {
            const skillIds = String(skills).split(',').map(id => Number(id)).filter(id => !isNaN(id));
            if (skillIds.length > 0) {
                whereClause += ` AND i.id IN (
                    SELECT internship_id FROM internship_skills 
                    WHERE skill_id IN (${skillIds.map(() => '?').join(',')})
                )`;
                params.push(...skillIds);
            }
        }

        // Get total count first
        const countSql = `
            SELECT COUNT(*) as total 
            FROM internships i
            JOIN companies c ON i.company_id = c.id
            ${whereClause}
        `;
        const countResult = await db.query(countSql, params);
        const total = countResult[0].total;

        // Sorting
        let orderBy = "ORDER BY i.created_at DESC";
        switch (sort) {
            case 'salary_desc':
                orderBy = ` ORDER BY i.stipend DESC, i.created_at DESC`;
                break;
            case 'salary_asc':
                orderBy = ` ORDER BY i.stipend ASC, i.created_at DESC`;
                break;
            case 'popular':
                orderBy = ` ORDER BY i.applications_count DESC, i.created_at DESC`;
                break;
            case 'recent':
            default:
                orderBy = ` ORDER BY i.created_at DESC`;
        }

        let sql = `
            SELECT
                i.*,
                c.name AS company_name,
                c.logo AS company_logo,
                c.industry AS company_industry,
                c.headquarters AS company_location,
                CASE 
                    WHEN i.is_remote = 1 THEN 'Remote'
                    WHEN i.is_hybrid = 1 THEN 'Hybrid'
                    ELSE 'On-site'
                END AS work_mode
            FROM internships i
            JOIN companies c ON i.company_id = c.id
            ${whereClause}
            ${orderBy}
            LIMIT ? OFFSET ?
        `;
        
        const queryParams = [...params, Number.parseInt(limit, 10), Number.parseInt(offset, 10)];

        let internships;
        try {
            internships = await db.query(sql, queryParams);
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
<<<<<<< HEAD
                c.industry,
                c.headquarters AS location,
                c.is_verified,
                COUNT(i.id) AS open_positions
            FROM companies c
            LEFT JOIN internships i ON i.company_id = c.id AND i.status = 'active'
            GROUP BY c.id, c.name, c.description, c.logo, c.industry, c.headquarters, c.is_verified
            ORDER BY open_positions DESC, c.is_verified DESC
            LIMIT ?
        `;
=======
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
>>>>>>> feature/phat

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

<<<<<<< HEAD
        let sql = `
            SELECT
                i.*,
                c.name AS company_name,
=======
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
>>>>>>> feature/phat
                c.description AS company_description,
                c.logo AS company_logo,
                c.website AS company_website,
                c.industry AS company_industry,
<<<<<<< HEAD
                c.headquarters AS company_location,
                CASE 
                    WHEN i.is_remote = 1 THEN 'Remote'
                    WHEN i.is_hybrid = 1 THEN 'Hybrid'
                    ELSE 'On-site'
                END AS work_mode
            FROM internships i
            JOIN companies c ON i.company_id = c.id
            WHERE i.id = ?
        `;
=======
                c.company_size
             FROM internships i
             JOIN companies c ON i.company_id = c.id
             WHERE i.id = ? AND i.status = 'active'`,
            [id]
        );
>>>>>>> feature/phat

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
        const {
<<<<<<< HEAD
            title, description, requirements, responsibilities, benefits,
            location, is_remote, is_hybrid, type, duration_months,
            stipend, stipend_currency = 'USD', application_deadline,
            start_date, end_date, skills
=======
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
            end_date
>>>>>>> feature/phat
        } = req.body;

        let companyId = req.body.company_id;
        if (req.user && req.user.role === 'company') {
            companyId = await getCompanyIdByUserId(req.user.userId);
        }

<<<<<<< HEAD
        if (!companyId || !title || !description) {
            return res.status(400).json({ success: false, message: 'Required fields missing' });
        }

        const sql = `
            INSERT INTO internships (
                company_id, title, description, requirements, responsibilities, 
                benefits, location, is_remote, is_hybrid, type, 
                duration_months, stipend, stipend_currency, application_deadline, 
                start_date, end_date, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
        `;
=======
        if (!companyId || !title || !description || !location || !duration_months || !application_deadline) {
            return res.status(400).json({ message: 'Required fields are missing' });
        }

        const result = await db.query(
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
>>>>>>> feature/phat

        const params = [
            companyId, title, description, requirements || null, responsibilities || null,
            benefits || null, location || null, is_remote ? 1 : 0, is_hybrid ? 1 : 0, type || 'full-time',
            duration_months || null, stipend || 0, stipend_currency, application_deadline || null,
            start_date || null, end_date || null
        ];

        let result;
        try {
            result = await db.query(sql, params);
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
        const updates = req.body;
        
        let companyId = null;
        if (req.user && req.user.role === 'company') {
            companyId = await getCompanyIdByUserId(req.user.userId);
            
            // Verify ownership
            const existing = await db.query('SELECT company_id FROM internships WHERE id = ?', [id]);
            if (existing.length === 0) return res.status(404).json({ message: 'Not found' });
            if (existing[0].company_id !== companyId) return res.status(403).json({ message: 'Forbidden' });
        }

        // Filter valid fields for update based on schema
        const fields = [
            'title', 'description', 'requirements', 'responsibilities', 'benefits',
            'location', 'is_remote', 'is_hybrid', 'type', 'duration_months',
            'stipend', 'stipend_currency', 'application_deadline', 'start_date',
            'end_date', 'status'
        ];

        const updateSet = [];
        const params = [];

        for (const field of fields) {
            if (updates[field] !== undefined) {
                updateSet.push(`${field} = ?`);
                params.push(updates[field]);
            }
        }

        if (updateSet.length === 0) return res.status(400).json({ message: 'No fields to update' });

        params.push(id);
        await db.query(`UPDATE internships SET ${updateSet.join(', ')} WHERE id = ?`, params);

        return res.json({ success: true, message: 'Internship updated' });
    } catch (error) {
        console.error('Update failed:', error);
        return res.status(500).json({ message: 'Server error' });
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

module.exports = {
    getAllInternships,
    getFeaturedCompanies,
    getAllCompanies,
    getInternshipById,
    createInternship,
    updateInternship,
    deleteInternship,
    getRecommendedInternships
};
