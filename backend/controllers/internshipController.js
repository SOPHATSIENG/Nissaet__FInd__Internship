const db = require('../config/db');

/**
 * Helper to identify database field errors (missing columns/tables)
 */
const isBadFieldError = (error) => error && error.code === 'ER_BAD_FIELD_ERROR';
const getInternshipColumns = async () => {
    const rows = await db.query('SHOW COLUMNS FROM internships');
    return new Set(rows.map((row) => row.Field));
};

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

/**
 * Helper to auto-close internships past their application deadline.
 * Uses CURDATE() so a date-only deadline stays active through the end of that day.
 */
const expireInternshipsByDeadline = async (companyId = null) => {
    const baseSql = `
        UPDATE internships
        SET status = 'closed'
        WHERE status = 'active'
          AND application_deadline IS NOT NULL
          AND application_deadline < CURDATE()
    `;
    if (companyId) {
        await db.query(`${baseSql} AND company_id = ?`, [companyId]);
    } else {
        await db.query(baseSql);
    }
};

/**
 * Helper to reopen/close internships based on deadline (keeps archived as-is)
 */
const normalizeInternshipStatusByDeadline = async (companyId = null) => {
    const baseSql = `
        UPDATE internships
        SET status = CASE
            WHEN application_deadline IS NOT NULL AND application_deadline < CURDATE() THEN 'closed'
            ELSE 'active'
        END
        WHERE status != 'archived'
          AND application_deadline IS NOT NULL
    `;
    if (companyId) {
        await db.query(`${baseSql} AND company_id = ?`, [companyId]);
    } else {
        await db.query(baseSql);
    }
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
        await normalizeInternshipStatusByDeadline();
        await expireInternshipsByDeadline();
        const { search, location, industry, companySize, skills, work_mode, salary_type, limit: queryLimit } = req.query;
        const parsedLimit = Number.parseInt(queryLimit, 10);
        const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 100) : 100;

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
                c.company_size,
                c.headquarters AS company_location
            FROM internships i
            JOIN companies c ON i.company_id = c.id
            WHERE i.status = 'active' AND i.is_flagged = 0
        `;

        const queryParams = [];

        if (search) {
            query += ' AND (i.title LIKE ? OR i.description LIKE ? OR c.name LIKE ?)';
            const searchPattern = `%${search}%`;
            queryParams.push(searchPattern, searchPattern, searchPattern);
        }

        if (location) {
            const locations = Array.isArray(location) ? location : (location.includes(',') ? location.split(',') : [location]);
            const filteredLocations = locations.filter(loc => loc && loc !== 'All Locations');
            if (filteredLocations.length > 0) {
                const placeholders = filteredLocations.map(() => 'i.location LIKE ? OR c.headquarters LIKE ?').join(' OR ');
                query += ` AND (${placeholders})`;
                filteredLocations.forEach(loc => {
                    const pattern = `%${loc}%`;
                    queryParams.push(pattern, pattern);
                });
            }
        }

        if (industry) {
            const industries = Array.isArray(industry) ? industry : (industry.includes(',') ? industry.split(',') : [industry]);
            if (industries.length > 0) {
                const placeholders = industries.map(() => '?').join(', ');
                query += ` AND c.industry IN (${placeholders})`;
                queryParams.push(...industries);
            }
        }

        if (companySize) {
            const sizes = Array.isArray(companySize) ? companySize : (companySize.includes(',') ? companySize.split(',') : [companySize]);
            if (sizes.length > 0) {
                const placeholders = sizes.map(() => '?').join(', ');
                query += ` AND c.company_size IN (${placeholders})`;
                queryParams.push(...sizes);
            }
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

        if (skills) {
            const skillList = Array.isArray(skills) ? (skills.includes(',') ? skills.split(',') : [skills]) : [skills];
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

        query += ' ORDER BY i.created_at DESC';

        if (limit) {
            query += ' LIMIT ?';
            queryParams.push(limit);
        }

        // Get total count before applying limit
        let countQuery = `
            SELECT COUNT(*) as total
            FROM internships i
            JOIN companies c ON i.company_id = c.id
            WHERE i.status = 'active' AND i.is_flagged = 0
        `;
        const countParams = [];
        
        if (search) {
            countQuery += ' AND (i.title LIKE ? OR i.description LIKE ? OR c.name LIKE ?)';
            const searchPattern = `%${search}%`;
            countParams.push(searchPattern, searchPattern, searchPattern);
        }
        
        if (location) {
            const locations = Array.isArray(location) ? location : (location.includes(',') ? location.split(',') : [location]);
            const filteredLocations = locations.filter(loc => loc && loc !== 'All Locations');
            if (filteredLocations.length > 0) {
                const placeholders = filteredLocations.map(() => 'i.location LIKE ? OR c.headquarters LIKE ?').join(' OR ');
                countQuery += ` AND (${placeholders})`;
                filteredLocations.forEach(loc => {
                    const pattern = `%${loc}%`;
                    countParams.push(pattern, pattern);
                });
            }
        }

        if (industry) {
            const industries = Array.isArray(industry) ? industry : (industry.includes(',') ? industry.split(',') : [industry]);
            if (industries.length > 0) {
                const placeholders = industries.map(() => '?').join(', ');
                countQuery += ` AND c.industry IN (${placeholders})`;
                countParams.push(...industries);
            }
        }

        if (companySize) {
            const sizes = Array.isArray(companySize) ? companySize : (companySize.includes(',') ? companySize.split(',') : [companySize]);
            if (sizes.length > 0) {
                const placeholders = sizes.map(() => '?').join(', ');
                countQuery += ` AND c.company_size IN (${placeholders})`;
                countParams.push(...sizes);
            }
        }
        
        if (work_mode && work_mode !== 'All') {
            countQuery += ' AND i.type = ?';
            countParams.push(work_mode.toLowerCase());
        }
        
        if (salary_type && salary_type !== 'All') {
            if (salary_type.toLowerCase() === 'paid') {
                countQuery += ' AND i.stipend > 0';
            } else if (salary_type.toLowerCase() === 'unpaid') {
                countQuery += ' AND i.stipend = 0';
            }
        }
        
        if (skills) {
            const skillList = Array.isArray(skills) ? (skills.includes(',') ? skills.split(',') : [skills]) : [skills];
            if (skillList.length > 0) {
                countQuery += ` AND i.id IN (
                    SELECT iskill.internship_id 
                    FROM internship_skills iskill 
                    JOIN skills s ON iskill.skill_id = s.id 
                    WHERE s.name IN (?)
                )`;
                countParams.push(skillList);
            }
        }

        let internships;
        let total = 0;

        try {
            const countResult = await db.query(countQuery, countParams);
            total = countResult[0]?.total || 0;
            internships = await db.query(query, queryParams);
        } catch (error) {
            console.warn('Primary query failed:', error);
            // Fallback for legacy schema or SQL differences
            try {
                let fallbackSql = `
                    SELECT
                        i.*,
                        c.name AS company_name,
                        c.logo AS company_logo,
                        c.headquarters AS company_location
                    FROM internships i
                    JOIN companies c ON i.company_id = c.id
                    WHERE i.status = 'active'
                    ORDER BY i.created_at DESC
                    LIMIT ?
                `;
                internships = await db.query(fallbackSql, [limit || 10]);
                total = internships.length;
            } catch (fallbackError) {
                console.error('Fallback query failed:', fallbackError);
                throw fallbackError;
            }
        }

        return res.json({ 
            success: true,
            total,
            count: internships.length,
            internships 
        });
    } catch (error) {
        console.error('Error fetching internships:', error);
        const message = error?.message || 'Server error';
        // include fallback detail for debugging in dev only
        return res.status(500).json({ success: false, message: `Server error: ${message}` });
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
                AND i.is_flagged = 0
             GROUP BY c.id, c.name, c.description, c.logo, c.headquarters
             ORDER BY open_positions DESC, c.name ASC
             LIMIT ?
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
                i.type,
                i.type AS work_mode,
                i.duration_months,
                i.duration_months AS duration,
                i.stipend,
                i.stipend_currency,
                i.application_deadline,
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
             WHERE i.id = ? AND i.status = 'active' AND i.is_flagged = 0
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
              image,
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

        const columns = await getInternshipColumns();
        const insertColumns = [];
        const insertValues = [];

        const add = (column, value) => {
            if (columns.has(column)) {
                insertColumns.push(column);
                insertValues.push(value);
            }
        };

        const workMode = is_remote ? 'Remote' : (is_hybrid ? 'Hybrid' : 'On-site');
        const durationValue = Number.isFinite(Number(duration_months)) ? Number(duration_months) : null;

        add('company_id', companyId);
        add('title', title);
        add('description', description);
        add('image', image || null);
        add('requirements', requirements || null);
        add('responsibilities', responsibilities || null);
        add('benefits', benefits || null);
        add('location', location || null);
        add('is_remote', is_remote ? 1 : 0);
        add('is_hybrid', is_hybrid ? 1 : 0);
        add('type', type || 'full-time');
        add('duration_months', durationValue);
        add('duration', durationValue ? `${durationValue} mo` : null);
        add('stipend', Number.isFinite(Number(stipend)) ? Number(stipend) : 0);
        add('stipend_currency', stipend_currency);
        add('positions', Number.isFinite(Number(positions)) ? Number(positions) : 1);
        add('application_deadline', application_deadline || null);
        add('deadline', application_deadline || null);
        add('start_date', start_date || null);
        add('end_date', end_date || null);
        add('status', 'active');
        add('is_active', 1);
        add('work_mode', workMode);

        if (insertColumns.length === 0) {
            return res.status(500).json({ success: false, message: 'Internships table schema not supported' });
        }

        const placeholders = insertColumns.map(() => '?').join(', ');
        const sql = `INSERT INTO internships (${insertColumns.join(', ')}) VALUES (${placeholders})`;

        const result = await db.query(sql, insertValues);

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
              image,
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

        const today = new Date();
        const deadlineDate = application_deadline ? new Date(application_deadline) : null;
        const nextStatus =
            deadlineDate && !Number.isNaN(deadlineDate.getTime()) && deadlineDate < new Date(today.getFullYear(), today.getMonth(), today.getDate())
                ? 'closed'
                : 'active';

        const connection = await db.connection();
        
        try {
            await connection.beginTransaction();

            // Update internship (allow reopening by deadline)
            try {
                await connection.execute(
                    `UPDATE internships SET
                        title = ?, description = ?, image = ?, requirements = ?, location = ?,
                        type = ?, duration_months = ?, stipend = ?, stipend_currency = ?,
                        positions = ?, application_deadline = ?, start_date = ?, end_date = ?,
                        status = ?,
                        is_flagged = 0,
                        updated_at = CURRENT_TIMESTAMP
                     WHERE id = ?`,
                    [
                        title,
                        description,
                        image || null,
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
                        nextStatus,
                        id
                    ]
                );
            } catch (error) {
                if (!isBadFieldError(error)) throw error;
                await connection.execute(
                    `UPDATE internships SET
                        title = ?, description = ?, image = ?, requirements = ?, location = ?,
                        type = ?, duration_months = ?, stipend = ?, stipend_currency = ?,
                        positions = ?, application_deadline = ?, start_date = ?, end_date = ?,
                        status = ?,
                        updated_at = CURRENT_TIMESTAMP
                     WHERE id = ?`,
                    [
                        title,
                        description,
                        image || null,
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
                        nextStatus,
                        id
                    ]
                );
            }

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

        try {
            await db.query(
                `UPDATE internships
                 SET status = 'archived', is_flagged = 1
                 WHERE id = ?`,
                [id]
            );
        } catch (error) {
            if (!isBadFieldError(error)) throw error;
            await db.query(
                `UPDATE internships
                 SET status = 'archived'
                 WHERE id = ?`,
                [id]
            );
        }
        return res.json({ success: true, message: 'Internship archived' });
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
            WHERE i.status = 'active' AND i.is_flagged = 0 AND isk.skill_id IN (${skillIds.map(() => '?').join(',')})
            GROUP BY i.id
            ORDER BY matching_skills_count DESC, i.created_at DESC
            LIMIT 4
        `;
        let internships;
        try {
            internships = await db.query(sql, skillIds);
        } catch (error) {
            if (!isBadFieldError(error)) throw error;
            const fallbackSql = `
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
            internships = await db.query(fallbackSql, skillIds);
        }

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
            limit: queryLimit,
            offset: queryOffset
        } = req.query;

        const parsedLimit = Number.parseInt(queryLimit, 10);
        const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 100) : 12;
        
        const parsedOffset = Number.parseInt(queryOffset, 10);
        const offset = Number.isFinite(parsedOffset) && parsedOffset >= 0 ? parsedOffset : 0;

        let whereClause = "WHERE 1=1";
        const params = [];

        if (search) {
            whereClause += ` AND (c.name LIKE ? OR c.description LIKE ? OR c.industry LIKE ?)`;
            const searchVal = `%${search}%`;
            params.push(searchVal, searchVal, searchVal);
        }

        if (location && location !== 'All Locations') {
            whereClause += ` AND c.headquarters LIKE ?`;
            params.push(`%${location}%`);
        }

        const industryParam = industry || req.query.industries;
        if (industryParam && industryParam !== 'all') {
            const industryList = industryParam.split(',').filter(Boolean);
            if (industryList.length > 0) {
                const placeholders = industryList.map(() => '?').join(',');
                whereClause += ` AND c.industry IN (${placeholders})`;
                params.push(...industryList);
            }
        }

        // Get total count
        const countSql = `SELECT COUNT(*) as total FROM companies c ${whereClause}`;
        const countResult = await db.query(countSql, params);
        const total = countResult[0]?.total || 0;

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
            LEFT JOIN internships i ON i.company_id = c.id AND i.status = 'active' AND i.is_flagged = 0
            ${whereClause}
            GROUP BY c.id, c.name, c.description, c.logo, c.industry, c.headquarters, c.is_verified, c.company_size
            ORDER BY c.is_verified DESC, c.name ASC 
            LIMIT ? OFFSET ?
        `;
        
        const queryParams = [...params, limit, offset];
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
        const userId = req.user?.userId || req.user?.id;
        const companyId = await getCompanyIdByUserId(userId);
        if (!companyId) {
            return res.status(404).json({ success: false, message: 'Company profile not found' });
        }

        await normalizeInternshipStatusByDeadline(companyId);
        await expireInternshipsByDeadline(companyId);

        const sql = `
            SELECT
                i.*,
                c.name AS company_name,
                c.logo AS company_logo,
                COUNT(a.id) AS applicant_count
            FROM internships i
            LEFT JOIN companies c ON c.id = i.company_id
            LEFT JOIN applications a ON i.id = a.internship_id
            WHERE i.company_id = ? AND i.is_flagged = 0
            GROUP BY i.id
            ORDER BY i.created_at DESC
        `;
        let internships;
        try {
            internships = await db.query(sql, [companyId]);
        } catch (error) {
            if (!isBadFieldError(error)) throw error;
            const fallbackSql = `
                SELECT
                    i.*,
                    COUNT(a.id) AS applicant_count
                FROM internships i
                LEFT JOIN applications a ON i.id = a.internship_id
                WHERE i.company_id = ?
                GROUP BY i.id
                ORDER BY i.created_at DESC
            `;
            internships = await db.query(fallbackSql, [companyId]);
        }

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

        let savedInternships;
        try {
            savedInternships = await db.query(
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
                 WHERE si.student_id = ? AND i.status = 'active' AND i.is_flagged = 0
                 ORDER BY si.created_at DESC`,
                [studentId]
            );
        } catch (error) {
            if (!isBadFieldError(error)) throw error;
            savedInternships = await db.query(
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
        }

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
        const userId = req.user?.userId || req.user?.id;
        const companyId = await getCompanyIdByUserId(userId);
        if (!companyId) {
            return res.status(404).json({ message: 'Company not found' });
        }

        await normalizeInternshipStatusByDeadline(companyId);
        await expireInternshipsByDeadline(companyId);

        // Get total posts
        let totalPostsResult;
        let activePostsResult;
        let expiredPostsResult;
        let totalApplicantsResult;
        let lastMonthResult;
        let previousMonthResult;

        try {
            totalPostsResult = await db.query(
                `SELECT COUNT(*) as total FROM internships WHERE company_id = ? AND is_flagged = 0`,
                [companyId]
            );
            activePostsResult = await db.query(
                `SELECT COUNT(*) as active FROM internships WHERE company_id = ? AND status = "active" AND application_deadline > NOW() AND is_flagged = 0`,
                [companyId]
            );
            expiredPostsResult = await db.query(
                `SELECT COUNT(*) as expired FROM internships WHERE company_id = ? AND (status != "active" OR application_deadline <= NOW()) AND is_flagged = 0`,
                [companyId]
            );
            totalApplicantsResult = await db.query(
                `SELECT COALESCE(SUM(applications_count), 0) as total FROM internships WHERE company_id = ? AND is_flagged = 0`,
                [companyId]
            );
            lastMonthResult = await db.query(
                `SELECT COUNT(*) as last_month FROM internships WHERE company_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH) AND is_flagged = 0`,
                [companyId]
            );
            previousMonthResult = await db.query(
                `SELECT COUNT(*) as previous_month FROM internships WHERE company_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 2 MONTH) AND created_at < DATE_SUB(NOW(), INTERVAL 1 MONTH) AND is_flagged = 0`,
                [companyId]
            );
        } catch (error) {
            if (!isBadFieldError(error)) throw error;
            totalPostsResult = await db.query(
                `SELECT COUNT(*) as total FROM internships WHERE company_id = ?`,
                [companyId]
            );
            activePostsResult = await db.query(
                `SELECT COUNT(*) as active FROM internships WHERE company_id = ? AND status = "active" AND application_deadline > NOW()`,
                [companyId]
            );
            expiredPostsResult = await db.query(
                `SELECT COUNT(*) as expired FROM internships WHERE company_id = ? AND (status != "active" OR application_deadline <= NOW())`,
                [companyId]
            );
            totalApplicantsResult = await db.query(
                `SELECT COALESCE(SUM(applications_count), 0) as total FROM internships WHERE company_id = ?`,
                [companyId]
            );
            lastMonthResult = await db.query(
                `SELECT COUNT(*) as last_month FROM internships WHERE company_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)`,
                [companyId]
            );
            previousMonthResult = await db.query(
                `SELECT COUNT(*) as previous_month FROM internships WHERE company_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 2 MONTH) AND created_at < DATE_SUB(NOW(), INTERVAL 1 MONTH)`,
                [companyId]
            );
        }

        const totalPosts = totalPostsResult[0].total;
        const activePosts = activePostsResult[0].active;
        const expiredPosts = expiredPostsResult[0].expired;
        const totalApplicants = totalApplicantsResult[0].total;
        const lastMonthPosts = lastMonthResult[0].last_month;
        const previousMonthPosts = previousMonthResult[0].previous_month;

        // Get status distribution (safe fallback)
        let statusDistributionResult = [];
        try {
            statusDistributionResult = await db.query(
                `SELECT a.status, COUNT(*) as count
                 FROM applications a
                 JOIN internships i ON a.internship_id = i.id
                 WHERE i.company_id = ?
                 GROUP BY a.status`,
                [companyId]
            );
        } catch (error) {
            console.warn('Status distribution query failed:', error.message);
            statusDistributionResult = [];
        }

        const statusDistribution = {
            pending: 0,
            shortlisted: 0,
            rejected: 0
        };

        statusDistributionResult.forEach(row => {
            const status = row.status.toLowerCase();
            if (status === 'pending' || status === 'reviewing') statusDistribution.pending += row.count;
            else if (status === 'shortlisted' || status === 'accepted') statusDistribution.shortlisted += row.count;
            else if (status === 'rejected') statusDistribution.rejected += row.count;
        });

        // Get recent applicants (safe fallback)
        let recentApplicants = [];
        try {
            recentApplicants = await db.query(
                `SELECT 
                    a.id, 
                    a.student_id,
                    u.full_name as name, 
                    i.title as role, 
                    a.created_at as time,
                    u.profile_image
                 FROM applications a
                 JOIN students s ON a.student_id = s.id
                 JOIN users u ON s.user_id = u.id
                 JOIN internships i ON a.internship_id = i.id
                 WHERE i.company_id = ?
                 ORDER BY a.created_at DESC
                 LIMIT 3`,
                [companyId]
            );
        } catch (error) {
            console.warn('Recent applicants query failed:', error.message);
            recentApplicants = [];
        }

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
            postsTrend: postsTrend,
            statusDistribution,
            recentApplicants
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Get internship details by ID for the authenticated company (any status)
 */
const getCompanyInternshipById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId || req.user?.id;
        const companyId = await getCompanyIdByUserId(userId);
        if (!companyId) {
            return res.status(404).json({ success: false, message: 'Company profile not found' });
        }

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
                i.type,
                i.type AS work_mode,
                i.duration_months,
                i.duration_months AS duration,
                i.stipend,
                i.stipend_currency,
                i.application_deadline,
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
             WHERE i.id = ? AND i.company_id = ?
        `;

        let results;
        try {
            results = await db.query(sql, [id, companyId]);
        } catch (error) {
            if (!isBadFieldError(error)) throw error;
            results = await db.query(
                `SELECT i.*, c.company_name, c.logo AS company_logo 
                 FROM internships i 
                 JOIN companies c ON i.company_id = c.id 
                 WHERE i.id = ? AND i.company_id = ?`,
                [id, companyId]
            );
        }

        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Internship not found' });
        }

        const internship = results[0];

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
        console.error('Error fetching company internship details:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Get archived internships for the authenticated company
 */
const getCompanyArchivedInternships = async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?.id;
        const companyId = await getCompanyIdByUserId(userId);
        if (!companyId) {
            return res.status(404).json({ success: false, message: 'Company profile not found' });
        }

        await expireInternshipsByDeadline(companyId);

        const sql = `
            SELECT
                i.*,
                c.name AS company_name,
                c.logo AS company_logo,
                COUNT(a.id) AS applicant_count
            FROM internships i
            LEFT JOIN companies c ON c.id = i.company_id
            LEFT JOIN applications a ON i.id = a.internship_id
            WHERE i.company_id = ? AND i.status = 'archived'
            GROUP BY i.id
            ORDER BY i.created_at DESC
        `;
        let internships;
        try {
            internships = await db.query(sql, [companyId]);
        } catch (error) {
            if (!isBadFieldError(error)) throw error;
            const fallbackSql = `
                SELECT
                    i.*,
                    COUNT(a.id) AS applicant_count
                FROM internships i
                LEFT JOIN applications a ON i.id = a.internship_id
                WHERE i.company_id = ? AND i.status = 'archived'
                GROUP BY i.id
                ORDER BY i.created_at DESC
            `;
            internships = await db.query(fallbackSql, [companyId]);
        }

        return res.json({ success: true, internships });
    } catch (error) {
        console.error('Error fetching archived internships:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Restore an archived internship
 */
const restoreInternship = async (req, res) => {
    try {
        const { id } = req.params;

        if (req.user && req.user.role === 'company') {
            const companyId = await getCompanyIdByUserId(req.user.userId);
            const existing = await db.query('SELECT company_id FROM internships WHERE id = ?', [id]);
            if (existing.length === 0) return res.status(404).json({ message: 'Not found' });
            if (existing[0].company_id !== companyId) return res.status(403).json({ message: 'Forbidden' });
        }

        try {
            await db.query(
                `UPDATE internships
                 SET status = CASE
                     WHEN application_deadline IS NOT NULL AND application_deadline < CURDATE()
                     THEN 'closed'
                     ELSE 'active'
                 END,
                 is_flagged = 0
                 WHERE id = ?`,
                [id]
            );
        } catch (error) {
            if (!isBadFieldError(error)) throw error;
            await db.query(
                `UPDATE internships
                 SET status = CASE
                     WHEN application_deadline IS NOT NULL AND application_deadline < CURDATE()
                     THEN 'closed'
                     ELSE 'active'
                 END
                 WHERE id = ?`,
                [id]
            );
        }

        return res.json({ success: true, message: 'Internship restored' });
    } catch (error) {
        console.error('Restore failed:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const getApplicationTrends = async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?.id;
        const companyId = await getCompanyIdByUserId(userId);
        if (!companyId) {
            return res.status(404).json({ message: 'Company not found' });
        }

        // Get monthly application trends for last 6 months
        let trends;
        try {
            trends = await db.query(
                `SELECT 
                    DATE_FORMAT(created_at, '%Y-%m') as month,
                    COUNT(*) as posts,
                    COALESCE(SUM(applications_count), 0) as applications
                 FROM internships 
                 WHERE company_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH) AND is_flagged = 0
                 GROUP BY DATE_FORMAT(created_at, '%Y-%m')
                 ORDER BY month ASC`,
                [companyId]
            );
        } catch (error) {
            if (!isBadFieldError(error)) throw error;
            trends = await db.query(
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
        }

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
    getCompanyInternshipById,
    createInternship,
    getCompanyInternships,
    getCompanyArchivedInternships,
    restoreInternship,
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

