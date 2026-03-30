const db = require('../config/db');

/**
 * Helper to identify database field errors (missing columns/tables)
 */
const isBadFieldError = (error) => error && error.code === 'ER_BAD_FIELD_ERROR';
const isMissingTableError = (error) => error && error.code === 'ER_NO_SUCH_TABLE';
const isSchemaMismatchError = (error) => isBadFieldError(error) || isMissingTableError(error);
const companyPostImageSubquery = `
    SELECT p.image_url
    FROM posts p
    WHERE p.company_id = i.company_id
      AND p.status = 'published'
      AND p.image_url IS NOT NULL
      AND p.image_url != ''
    ORDER BY p.created_at DESC
    LIMIT 1
`;
const getInternshipColumns = async () => {
    const rows = await db.query('SHOW COLUMNS FROM internships');
    return new Set(rows.map((row) => row.Field));
};

const getTableColumns = async (tableName) => {
    const rows = await db.query(`SHOW COLUMNS FROM ${tableName}`);
    return new Set(rows.map((row) => row.Field));
};
const getPostsColumns = async () => getTableColumns('posts');
const runExecutor = async (executor, sql, params = []) => {
    if (executor && typeof executor.execute === 'function') {
        const [rows] = await executor.execute(sql, params);
        return rows;
    }
    return db.query(sql, params);
};
const buildInternshipPostPayload = (internship, companyId, adminId = null) => {
    const plainDescription = String(internship.description || '').trim();
    const plainRequirements = String(internship.requirements || '').trim();
    const shortDescriptionSource = plainDescription || plainRequirements || internship.title || '';
    const shortDescription = shortDescriptionSource.slice(0, 500);

    return {
        title: internship.title,
        content: plainDescription || plainRequirements || internship.title || 'Internship opportunity',
        short_description: shortDescription || null,
        image_url: internship.image || null,
        post_type: 'internship',
        internship_id: internship.id,
        company_id: companyId,
        admin_id: adminId,
        location: internship.location || null,
        event_date: internship.application_deadline || null,
        status: internship.status === 'active' ? 'published' : 'archived'
    };
};
const syncInternshipPost = async (executor, internship, companyId, adminId = null) => {
    try {
        const postColumns = await getPostsColumns();
        const payload = buildInternshipPostPayload(internship, companyId, adminId);
        const hasInternshipId = postColumns.has('internship_id');

        let existingPost = [];
        if (hasInternshipId) {
            existingPost = await runExecutor(
                executor,
                'SELECT id FROM posts WHERE internship_id = ? LIMIT 1',
                [internship.id]
            );
        } else {
            existingPost = await runExecutor(
                executor,
                'SELECT id FROM posts WHERE company_id = ? AND post_type = ? AND title = ? ORDER BY id DESC LIMIT 1',
                [companyId, 'internship', internship.title]
            );
        }

        const columns = [];
        const values = [];
        Object.entries(payload).forEach(([key, value]) => {
            if (postColumns.has(key)) {
                columns.push(key);
                values.push(value);
            }
        });

        if (columns.length === 0) {
            return;
        }

        if (existingPost.length > 0) {
            const updateSql = `
                UPDATE posts
                SET ${columns.map((column) => `${column} = ?`).join(', ')},
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `;
            await runExecutor(executor, updateSql, [...values, existingPost[0].id]);
            return;
        }

        const placeholders = columns.map(() => '?').join(', ');
        const insertSql = `INSERT INTO posts (${columns.join(', ')}) VALUES (${placeholders})`;
        await runExecutor(executor, insertSql, values);
    } catch (error) {
        if (error && (error.code === 'ER_NO_SUCH_TABLE' || error.code === 'ER_BAD_FIELD_ERROR')) {
            console.warn('Skipping internship post sync because posts schema is not ready:', error.message);
            return;
        }
        throw error;
    }
};
const archiveInternshipPost = async (executor, internshipId, companyId, title = null) => {
    try {
        const postColumns = await getPostsColumns();
        if (postColumns.has('internship_id')) {
            await runExecutor(
                executor,
                'UPDATE posts SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE internship_id = ?',
                ['archived', internshipId]
            );
            return;
        }

        if (title) {
            await runExecutor(
                executor,
                'UPDATE posts SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE company_id = ? AND post_type = ? AND title = ?',
                ['archived', companyId, 'internship', title]
            );
        }
    } catch (error) {
        if (error && (error.code === 'ER_NO_SUCH_TABLE' || error.code === 'ER_BAD_FIELD_ERROR')) {
            console.warn('Skipping internship post archive because posts schema is not ready:', error.message);
            return;
        }
        throw error;
    }
};

const buildSalaryMaxSelect = (columns, minExpr = 'i.stipend') => (
    columns.has('stipend_max')
        ? `COALESCE(i.stipend_max, ${minExpr})`
        : minExpr
);

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
 * Helper to get student ID by user ID
 */
const getStudentIdByUserId = async (userId) => {
    const rows = await db.query('SELECT id FROM students WHERE user_id = ? LIMIT 1', [userId]);
    return rows.length > 0 ? rows[0].id : null;
};

/**
 * Helper to resolve company ID by ID or user_id
 */
const resolveCompanyId = async (rawId) => {
    const numericId = Number.parseInt(rawId, 10);
    if (Number.isNaN(numericId)) return null;

    const direct = await db.query('SELECT id FROM companies WHERE id = ? LIMIT 1', [numericId]);
    if (direct.length > 0) return direct[0].id;

    const byUser = await db.query('SELECT id FROM companies WHERE user_id = ? LIMIT 1', [numericId]);
    if (byUser.length > 0) return byUser[0].id;

    return null;
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

const normalizeCategoryName = (value) => {
    if (!value) return '';
    return String(value).trim().replace(/\s+/g, ' ');
};

const ensureCategoriesForInternship = async (companyId, skills) => {
    try {
        if (companyId) {
            const [company] = await db.query('SELECT industry FROM companies WHERE id = ? LIMIT 1', [companyId]);
            const industryName = normalizeCategoryName(company?.industry);
            if (industryName) {
                await db.query('INSERT IGNORE INTO categories (name, is_active) VALUES (?, 1)', [industryName]);
            }
        }

        if (Array.isArray(skills) && skills.length > 0) {
            const skillIds = skills
                .map((skill) => skill?.id || skill?.skill_id)
                .filter((value) => Number.isFinite(Number(value)))
                .map((value) => Number(value));

            const skillNames = skills
                .map((skill) => (typeof skill === 'string' ? skill : skill?.name))
                .filter((value) => typeof value === 'string' && String(value).trim().length > 0)
                .map((value) => String(value).trim());

            let categories = [];

            if (skillIds.length > 0) {
                const placeholders = skillIds.map(() => '?').join(', ');
                categories = categories.concat(
                    await db.query(`SELECT DISTINCT category AS name FROM skills WHERE id IN (${placeholders})`, skillIds)
                );
            }

            if (skillNames.length > 0) {
                const placeholders = skillNames.map(() => '?').join(', ');
                categories = categories.concat(
                    await db.query(`SELECT DISTINCT category AS name FROM skills WHERE name IN (${placeholders})`, skillNames)
                );
            }

            const uniqueNames = Array.from(
                new Set(categories.map((row) => normalizeCategoryName(row.name)).filter(Boolean))
            );

            for (const name of uniqueNames) {
                await db.query('INSERT IGNORE INTO categories (name, is_active) VALUES (?, 1)', [name]);
            }
        }
    } catch (error) {
        console.error('Error ensuring categories for internship:', error);
    }
};

/**
 * Get all internships with dynamic filtering and search
 */
const getAllInternships = async (req, res) => {
    try {
        await normalizeInternshipStatusByDeadline();
        await expireInternshipsByDeadline();
        const internshipColumns = await getInternshipColumns();
        const salaryMaxSelect = buildSalaryMaxSelect(internshipColumns);
        const { search, location, industry, companySize, skills, work_mode, salary_type, limit: queryLimit, page: queryPage } = req.query;
        const parsedLimit = Number.parseInt(queryLimit, 10);
        const parsedPage = Number.parseInt(queryPage, 10);
        const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 100) : 100;
        const requestedPage = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

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
                ${salaryMaxSelect} AS salary_max,
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
        let page = requestedPage;
        let totalPages = 0;

        try {
            const countResult = await db.query(countQuery, countParams);
            total = countResult[0]?.total || 0;
            totalPages = total > 0 ? Math.ceil(total / limit) : 0;
            page = totalPages > 0 ? Math.min(requestedPage, totalPages) : 1;
            const offset = (page - 1) * limit;
            query += ' LIMIT ? OFFSET ?';
            queryParams.push(limit, offset);
            internships = await db.query(query, queryParams);
        } catch (error) {
            console.warn('Primary query failed:', error);
            // Fallback for legacy schema or SQL differences
            try {
                const fallbackCountResult = await db.query(
                    `SELECT COUNT(*) as total
                     FROM internships i
                     JOIN companies c ON i.company_id = c.id
                     WHERE i.status = 'active'`,
                    []
                );
                total = fallbackCountResult[0]?.total || 0;
                totalPages = total > 0 ? Math.ceil(total / limit) : 0;
                page = totalPages > 0 ? Math.min(requestedPage, totalPages) : 1;
                const fallbackOffset = (page - 1) * limit;
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
                    LIMIT ? OFFSET ?
                `;
                internships = await db.query(fallbackSql, [limit, fallbackOffset]);
            } catch (fallbackError) {
                console.error('Fallback query failed:', fallbackError);
                throw fallbackError;
            }
        }

        return res.json({ 
            success: true,
            total,
            page,
            limit,
            totalPages,
            count: internships.length,
            hasNextPage: totalPages > 0 && page < totalPages,
            hasPrevPage: page > 1,
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
                COALESCE(op.open_positions, 0) AS open_positions,
                COALESCE(cr.rating, 0) AS rating,
                COALESCE(cr.rating_count, 0) AS rating_count
             FROM companies c
             LEFT JOIN (
                SELECT company_id, COUNT(*) AS open_positions
                FROM internships
                WHERE status = 'active' AND is_flagged = 0
                GROUP BY company_id
             ) op ON op.company_id = c.id
             LEFT JOIN (
                SELECT company_id, ROUND(AVG(rating), 2) AS rating, COUNT(*) AS rating_count
                FROM company_ratings
                GROUP BY company_id
             ) cr ON cr.company_id = c.id
             ORDER BY op.open_positions DESC, c.name ASC
             LIMIT ?
        `;

        let companies;
        try {
            companies = await db.query(sql, [limit]);
        } catch (error) {
            if (!isSchemaMismatchError(error)) throw error;

            try {
                // Fallback when ratings table/columns are missing (keep modern company schema)
                const noRatingsSql = `
                    SELECT
                        c.id,
                        c.name AS company_name,
                        c.description,
                        c.logo,
                        c.headquarters AS location,
                        COALESCE(op.open_positions, 0) AS open_positions,
                        0 AS rating,
                        0 AS rating_count
                    FROM companies c
                    LEFT JOIN (
                        SELECT company_id, COUNT(*) AS open_positions
                        FROM internships
                        WHERE status = 'active' AND is_flagged = 0
                        GROUP BY company_id
                    ) op ON op.company_id = c.id
                    ORDER BY op.open_positions DESC, c.name ASC
                    LIMIT ?
                `;
                companies = await db.query(noRatingsSql, [limit]);
            } catch (fallbackError) {
                if (!isSchemaMismatchError(fallbackError)) throw fallbackError;

                // Legacy schema fallback (company_name/location columns) without ratings
                const legacySql = `
                    SELECT
                        c.id,
                        c.company_name,
                        c.description,
                        c.logo,
                        c.location,
                        COALESCE(op.open_positions, 0) AS open_positions,
                        0 AS rating,
                        0 AS rating_count
                    FROM companies c
                    LEFT JOIN (
                        SELECT company_id, COUNT(*) AS open_positions
                        FROM internships
                        WHERE status = 'active'
                        GROUP BY company_id
                    ) op ON op.company_id = c.id
                    ORDER BY open_positions DESC
                    LIMIT ?
                `;
                companies = await db.query(legacySql, [limit]);
            }
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
        const internshipColumns = await getInternshipColumns();
        const stipendMaxSelect = buildSalaryMaxSelect(internshipColumns);

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
                COALESCE(i.image, (${companyPostImageSubquery})) AS image,
                i.is_remote,
                i.is_hybrid,
                i.type,
                i.type AS work_mode,
                i.duration_months,
                i.duration_months AS duration,
                i.stipend,
                ${stipendMaxSelect} AS stipend_max,
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
            stipend_max = 0,
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
        add('stipend_max', Number.isFinite(Number(stipend_max)) ? Number(stipend_max) : (Number.isFinite(Number(stipend)) ? Number(stipend) : 0));
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

        const connection = await db.connection();

        try {
        await connection.beginTransaction();

        const [result] = await connection.execute(sql, insertValues);
        const internshipId = result.insertId;

        if (Array.isArray(skills)) {
            for (const skill of skills) {
                const skillId = skill.id || skill.skill_id;
                if (skillId) {
                    await connection.execute(
                        'INSERT INTO internship_skills (internship_id, skill_id, skill_level, is_required) VALUES (?, ?, ?, ?)',
                        [internshipId, skillId, skill.level || 'intermediate', skill.required !== false]
                    ).catch(err => console.error('Skill insert failed:', err.message));
                }
            }
        }

        await ensureCategoriesForInternship(companyId, skills);

            await syncInternshipPost(
                connection,
                {
                    id: internshipId,
                    title,
                    description,
                    requirements,
                    image,
                    location,
                    application_deadline,
                    status: 'active'
                },
                companyId,
                req.user?.userId || null
            );

            await connection.commit();
            return res.status(201).json({ success: true, message: 'Internship created', internshipId });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
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
              stipend_max = 0,
            stipend_currency = 'USD',
            positions = 1,
            application_deadline,
            start_date,
            end_date,
            skills = []
        } = req.body;

        await ensureCategoriesForInternship(companyId, skills);

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
                        type = ?, duration_months = ?, stipend = ?, stipend_max = ?, stipend_currency = ?,
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
                        stipend_max,
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

            await syncInternshipPost(
                connection,
                {
                    id: Number(id),
                    title,
                    description,
                    requirements,
                    image,
                    location,
                    application_deadline,
                    status: nextStatus
                },
                companyId,
                req.user?.userId || null
            );

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
            const existing = await db.query('SELECT company_id, title FROM internships WHERE id = ?', [id]);
            if (existing.length === 0) return res.status(404).json({ message: 'Not found' });
            if (existing[0].company_id !== companyId) return res.status(403).json({ message: 'Forbidden' });
            await archiveInternshipPost(db, id, companyId, existing[0].title || null);
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
                c.user_id,
                c.name AS company_name,
                c.description,
                c.logo,
                c.industry,
                c.headquarters AS location,
                c.is_verified,
                c.company_size,
                COALESCE(op.open_positions, 0) AS open_positions,
                COALESCE(cr.rating, 0) AS rating,
                COALESCE(cr.rating_count, 0) AS rating_count
            FROM companies c
            LEFT JOIN (
                SELECT company_id, COUNT(*) AS open_positions
                FROM internships
                WHERE status = 'active' AND is_flagged = 0
                GROUP BY company_id
            ) op ON op.company_id = c.id
            LEFT JOIN (
                SELECT company_id, ROUND(AVG(rating), 2) AS rating, COUNT(*) AS rating_count
                FROM company_ratings
                GROUP BY company_id
            ) cr ON cr.company_id = c.id
            ${whereClause}
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
 * Get public company profile by ID (student-facing)
 */
const getCompanyProfileById = async (req, res) => {
    try {
        const companyId = Number.parseInt(req.params.id, 10);
        if (Number.isNaN(companyId)) {
            return res.status(400).json({ message: 'Invalid company ID' });
        }
        const by = String(req.query?.by || '').toLowerCase();
        const preferUserId = by === 'user';

        const primaryQuery = `
            SELECT
                c.id,
                c.user_id,
                c.name AS company_name,
                c.description,
                c.logo,
                c.industry,
                c.website,
                c.company_size,
                c.founded_year,
                c.headquarters AS location,
                c.is_verified,
                COALESCE(op.open_positions, 0) AS open_positions,
                COALESCE(cr.rating, 0) AS rating,
                COALESCE(cr.rating_count, 0) AS rating_count
             FROM companies c
             LEFT JOIN (
                SELECT company_id, COUNT(*) AS open_positions
                FROM internships
                WHERE status = 'active' AND is_flagged = 0
                GROUP BY company_id
             ) op ON op.company_id = c.id
             LEFT JOIN (
                SELECT company_id, ROUND(AVG(rating), 2) AS rating, COUNT(*) AS rating_count
                FROM company_ratings
                GROUP BY company_id
             ) cr ON cr.company_id = c.id
             WHERE ${preferUserId ? 'c.user_id' : 'c.id'} = ?`;

        const fallbackQuery = `
            SELECT
                c.id,
                c.user_id,
                c.name AS company_name,
                c.description,
                c.logo,
                c.industry,
                c.website,
                c.company_size,
                c.founded_year,
                c.headquarters AS location,
                c.is_verified,
                COALESCE(op.open_positions, 0) AS open_positions,
                COALESCE(cr.rating, 0) AS rating,
                COALESCE(cr.rating_count, 0) AS rating_count
             FROM companies c
             LEFT JOIN (
                SELECT company_id, COUNT(*) AS open_positions
                FROM internships
                WHERE status = 'active'
                GROUP BY company_id
             ) op ON op.company_id = c.id
             LEFT JOIN (
                SELECT company_id, ROUND(AVG(rating), 2) AS rating, COUNT(*) AS rating_count
                FROM company_ratings
                GROUP BY company_id
             ) cr ON cr.company_id = c.id
             WHERE ${preferUserId ? 'c.user_id' : 'c.id'} = ?`;

        let companyRows;
        try {
            companyRows = await db.query(primaryQuery, [companyId]);
        } catch (error) {
            if (!isBadFieldError(error)) throw error;
            companyRows = await db.query(fallbackQuery, [companyId]);
        }

        if (!companyRows || companyRows.length === 0) {
            // fallback: if we were looking by ID, try looking by User ID (and vice-versa)
            try {
                const altQuery = !preferUserId ? primaryQuery.replace('c.id = ?', 'c.user_id = ?') : primaryQuery.replace('c.user_id = ?', 'c.id = ?');
                const altFallbackQuery = !preferUserId ? fallbackQuery.replace('c.id = ?', 'c.user_id = ?') : fallbackQuery.replace('c.user_id = ?', 'c.id = ?');
                
                companyRows = await db.query(altQuery, [companyId]);
                if (!companyRows || companyRows.length === 0) {
                    companyRows = await db.query(altFallbackQuery, [companyId]);
                }
            } catch (error) {
                if (!isBadFieldError(error)) throw error;
            }
        }

        if (!companyRows || companyRows.length === 0) {
            // Last resort fallback: read directly from users table for basic info
            try {
                const userColumns = await getTableColumns('users');
                const columnsToSelect = ['id'];
                const potentialFields = ['full_name', 'name', 'company_name', 'profile_image', 'profile', 'website', 'location', 'industry', 'bio'];
                potentialFields.forEach((col) => {
                    if (userColumns.has(col)) columnsToSelect.push(col);
                });

                const userRows = await db.query(
                    `SELECT ${columnsToSelect.join(', ')} FROM users WHERE id = ? LIMIT 1`,
                    [companyId]
                );

                if (userRows.length > 0) {
                    const userRow = userRows[0];
                    const companyName = userRow.company_name || userRow.full_name || userRow.name || 'Company';
                    const logo = userRow.profile_image || userRow.profile || null;
                    return res.json({
                        company: {
                            id: companyId,
                            user_id: companyId,
                            company_name: companyName,
                            description: userRow.bio || '',
                            logo,
                            industry: userRow.industry || '',
                            website: userRow.website || '',
                            company_size: null,
                            founded_year: null,
                            location: userRow.location || '',
                            is_verified: false,
                            open_positions: 0,
                            rating: 0,
                            rating_count: 0
                        },
                        internships: []
                    });
                }
            } catch (error) {
                console.warn('User table fallback failed:', error.message);
            }
            return res.status(404).json({ message: 'Company not found' });
        }

        let internships = [];
        const resolvedCompanyId = companyRows[0].id;
        try {
            internships = await db.query(
                `SELECT
                    i.id,
                    i.title,
                    i.location,
                    i.type AS work_mode,
                    i.stipend,
                    i.stipend_currency,
                    i.application_deadline,
                    i.created_at
                 FROM internships i
                 WHERE i.company_id = ?
                   AND i.status = 'active'
                   AND i.is_flagged = 0
                 ORDER BY i.created_at DESC
                 LIMIT 6`,
                [resolvedCompanyId]
            );
        } catch (error) {
            if (!isBadFieldError(error)) throw error;
            internships = await db.query(
                `SELECT
                    i.id,
                    i.title,
                    i.location,
                    i.type AS work_mode,
                    i.stipend,
                    i.stipend_currency,
                    i.application_deadline,
                    i.created_at
                 FROM internships i
                 WHERE i.company_id = ?
                   AND i.status = 'active'
                 ORDER BY i.created_at DESC
                 LIMIT 6`,
                [resolvedCompanyId]
            );
        }

        return res.json({
            company: companyRows[0],
            internships
        });
    } catch (error) {
        console.error('Error fetching company profile:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Create or update a student rating for a company
 */
const rateCompany = async (req, res) => {
    try {
        const companyId = await resolveCompanyId(req.params.id);
        if (!companyId) {
            return res.status(400).json({ message: 'Invalid company ID' });
        }

        const ratingValue = Number.parseInt(req.body?.rating, 10);
        if (!Number.isFinite(ratingValue) || ratingValue < 1 || ratingValue > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5' });
        }

        const userId = req.user?.userId || req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        let studentId = await getStudentIdByUserId(userId);
        if (!studentId) {
            // Auto-create minimal student profile if missing
            try {
                const insertResult = await db.query(
                    'INSERT INTO students (user_id) VALUES (?)',
                    [userId]
                );
                studentId = insertResult?.insertId || null;
            } catch (createError) {
                console.error('Failed to create student profile:', createError);
            }
        }
        if (!studentId) {
            return res.status(404).json({ message: 'Student profile not found' });
        }

        const eligibility = await db.query(
            `SELECT 1
             FROM applications a
             JOIN internships i ON i.id = a.internship_id
             WHERE a.student_id = ? AND i.company_id = ? AND a.status IN ('accepted','shortlisted')
             LIMIT 1`,
            [studentId, companyId]
        );
        if (eligibility.length === 0) {
            return res.status(403).json({ message: 'You can rate a company only after being accepted for an internship.' });
        }

        const existingRows = await db.query(
            'SELECT id FROM company_ratings WHERE company_id = ? AND student_id = ? LIMIT 1',
            [companyId, studentId]
        );

        if (existingRows.length > 0) {
            await db.query(
                'UPDATE company_ratings SET rating = ?, review_text = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [ratingValue, req.body?.review_text || null, existingRows[0].id]
            );
        } else {
            await db.query(
                'INSERT INTO company_ratings (company_id, student_id, rating, review_text) VALUES (?, ?, ?, ?)',
                [companyId, studentId, ratingValue, req.body?.review_text || null]
            );
        }

        const summaryRows = await db.query(
            'SELECT ROUND(AVG(rating), 2) AS rating, COUNT(*) AS rating_count FROM company_ratings WHERE company_id = ?',
            [companyId]
        );
        const summary = summaryRows[0] || { rating: 0, rating_count: 0 };

        return res.json({
            message: existingRows.length > 0 ? 'Rating updated' : 'Rating submitted',
            rating: Number(summary.rating) || 0,
            rating_count: Number(summary.rating_count) || 0,
            user_rating: ratingValue
        });
    } catch (error) {
        console.error('Error rating company:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Get company ratings (public)
 */
const getCompanyRatings = async (req, res) => {
    try {
        const companyId = await resolveCompanyId(req.params.id);
        if (!companyId) {
            return res.status(400).json({ message: 'Invalid company ID' });
        }

        const rows = await db.query(
            `SELECT
                cr.id,
                cr.rating,
                cr.review_text,
                cr.created_at,
                s.id AS student_id,
                u.full_name,
                u.profile_image
             FROM company_ratings cr
             JOIN students s ON s.id = cr.student_id
             JOIN users u ON u.id = s.user_id
             WHERE cr.company_id = ?
             ORDER BY cr.created_at DESC`,
            [companyId]
        );

        return res.json({ ratings: rows || [] });
    } catch (error) {
        console.error('Error fetching company ratings:', error);
        return res.status(500).json({ message: 'Server error' });
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
        const internshipColumns = await getInternshipColumns();
        const salaryMaxSelect = buildSalaryMaxSelect(internshipColumns);
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
                    ${salaryMaxSelect} AS salary_max,
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
                    ${salaryMaxSelect} AS salary_max,
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
            else if (status === 'rejected' || status === 'unshortlisted') statusDistribution.rejected += row.count;
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
                    a.applied_at as time,
                    u.profile_image
                 FROM applications a
                 JOIN students s ON a.student_id = s.id
                 JOIN users u ON s.user_id = u.id
                 JOIN internships i ON a.internship_id = i.id
                 WHERE i.company_id = ?
                 ORDER BY a.applied_at DESC
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
        const internshipColumns = await getInternshipColumns();
        const stipendMaxSelect = buildSalaryMaxSelect(internshipColumns);
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
                ${stipendMaxSelect} AS stipend_max,
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
        await db.query(
            `DELETE FROM internships
             WHERE company_id = ?
             AND status = 'archived'
             AND updated_at < DATE_SUB(NOW(), INTERVAL 1 MONTH)`,
            [companyId]
        );

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

        const restoredRows = await db.query(
            'SELECT id, title, description, requirements, image, location, application_deadline, status, company_id FROM internships WHERE id = ? LIMIT 1',
            [id]
        );
        if (restoredRows.length > 0) {
            await syncInternshipPost(
                db,
                restoredRows[0],
                restoredRows[0].company_id,
                req.user?.userId || null
            );
        }

        return res.json({ success: true, message: 'Internship restored' });
    } catch (error) {
        console.error('Restore failed:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Permanently delete an archived internship
 */
const permanentlyDeleteInternship = async (req, res) => {
    try {
        const { id } = req.params;

        if (req.user && req.user.role === 'company') {
            const companyId = await getCompanyIdByUserId(req.user.userId);
            const existing = await db.query('SELECT company_id, status FROM internships WHERE id = ?', [id]);
            if (existing.length === 0) return res.status(404).json({ message: 'Not found' });
            if (existing[0].company_id !== companyId) return res.status(403).json({ message: 'Forbidden' });
            if (existing[0].status !== 'archived') {
                return res.status(400).json({ message: 'Only archived internships can be permanently deleted' });
            }
        }

        await db.query('DELETE FROM internships WHERE id = ? AND status = ?', [id, 'archived']);
        return res.json({ success: true, message: 'Archived internship deleted permanently' });
    } catch (error) {
        console.error('Permanent delete failed:', error);
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

        const granularity = String(req.query?.granularity || '').toLowerCase();
        const now = new Date();

        if (granularity === 'year') {
            const requestedYears = Number.parseInt(String(req.query?.years ?? ''), 10);
            const yearsWindow = Number.isFinite(requestedYears)
                ? Math.min(10, Math.max(1, requestedYears))
                : 5;

            const endYear = now.getFullYear();
            const startYear = endYear - (yearsWindow - 1);
            const startDateKey = `${startYear}-01-01`;

            let trends;
            try {
                trends = await db.query(
                    `SELECT
                        YEAR(created_at) AS year,
                        COUNT(*) AS posts,
                        COALESCE(SUM(applications_count), 0) AS applications
                     FROM internships
                     WHERE company_id = ? AND created_at >= ? AND is_flagged = 0
                     GROUP BY YEAR(created_at)
                     ORDER BY year ASC`,
                    [companyId, startDateKey]
                );
            } catch (error) {
                if (!isBadFieldError(error)) throw error;
                trends = await db.query(
                    `SELECT
                        YEAR(created_at) AS year,
                        COUNT(*) AS posts,
                        COALESCE(SUM(applications_count), 0) AS applications
                     FROM internships
                     WHERE company_id = ? AND created_at >= ?
                     GROUP BY YEAR(created_at)
                     ORDER BY year ASC`,
                    [companyId, startDateKey]
                );
            }

            const rows = Array.isArray(trends) ? trends : [];
            const byYear = new Map(
                rows
                    .filter((row) => row && (row.year !== undefined && row.year !== null))
                    .map((row) => [String(row.year), row])
            );

            const filled = Array.from({ length: yearsWindow }, (_, index) => String(startYear + index)).map((year) => {
                const row = byYear.get(year);
                return {
                    year,
                    posts: row ? Number(row.posts) || 0 : 0,
                    applications: row ? Number(row.applications) || 0 : 0
                };
            });

            return res.json({ trends: filled });
        }

        if (granularity === 'month' && req.query?.year) {
            const requestedYear = Number.parseInt(String(req.query.year), 10);
            const targetYear = Number.isFinite(requestedYear) ? requestedYear : now.getFullYear();

            const monthKeys = Array.from({ length: 12 }, (_, index) => `${targetYear}-${String(index + 1).padStart(2, '0')}`);
            const startKey = `${targetYear}-01-01`;
            const endKey = `${targetYear + 1}-01-01`;

            let trends;
            try {
                trends = await db.query(
                    `SELECT
                        DATE_FORMAT(created_at, '%Y-%m') AS month,
                        COUNT(*) AS posts,
                        COALESCE(SUM(applications_count), 0) AS applications
                     FROM internships
                     WHERE company_id = ? AND created_at >= ? AND created_at < ? AND is_flagged = 0
                     GROUP BY DATE_FORMAT(created_at, '%Y-%m')
                     ORDER BY month ASC`,
                    [companyId, startKey, endKey]
                );
            } catch (error) {
                if (!isBadFieldError(error)) throw error;
                trends = await db.query(
                    `SELECT
                        DATE_FORMAT(created_at, '%Y-%m') AS month,
                        COUNT(*) AS posts,
                        COALESCE(SUM(applications_count), 0) AS applications
                     FROM internships
                     WHERE company_id = ? AND created_at >= ? AND created_at < ?
                     GROUP BY DATE_FORMAT(created_at, '%Y-%m')
                     ORDER BY month ASC`,
                    [companyId, startKey, endKey]
                );
            }

            const rows = Array.isArray(trends) ? trends : [];
            const byMonth = new Map(
                rows
                    .filter((row) => row && row.month)
                    .map((row) => [String(row.month), row])
            );

            const filled = monthKeys.map((month) => {
                const row = byMonth.get(month);
                return {
                    month,
                    posts: row ? Number(row.posts) || 0 : 0,
                    applications: row ? Number(row.applications) || 0 : 0
                };
            });

            return res.json({ trends: filled });
        }

        // Backward-compatible rolling-window monthly trends (?months=...)
        const requestedMonths = Number.parseInt(String(req.query?.months ?? ''), 10);
        const monthsWindow = Number.isFinite(requestedMonths)
            ? Math.min(24, Math.max(1, requestedMonths))
            : 12;

        const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        startMonth.setMonth(startMonth.getMonth() - (monthsWindow - 1));
        const startMonthKey = `${startMonth.getFullYear()}-${String(startMonth.getMonth() + 1).padStart(2, '0')}-01`;

        const monthKeys = Array.from({ length: monthsWindow }, (_, index) => {
            const date = new Date(startMonth.getFullYear(), startMonth.getMonth() + index, 1);
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        });

        let trends;
        try {
            trends = await db.query(
                `SELECT
                    DATE_FORMAT(created_at, '%Y-%m') as month,
                    COUNT(*) as posts,
                    COALESCE(SUM(applications_count), 0) as applications
                 FROM internships
                 WHERE company_id = ? AND created_at >= ? AND is_flagged = 0
                 GROUP BY DATE_FORMAT(created_at, '%Y-%m')
                 ORDER BY month ASC`,
                [companyId, startMonthKey]
            );
        } catch (error) {
            if (!isBadFieldError(error)) throw error;
            trends = await db.query(
                `SELECT
                    DATE_FORMAT(created_at, '%Y-%m') as month,
                    COUNT(*) as posts,
                    COALESCE(SUM(applications_count), 0) as applications
                 FROM internships
                 WHERE company_id = ? AND created_at >= ?
                 GROUP BY DATE_FORMAT(created_at, '%Y-%m')
                 ORDER BY month ASC`,
                [companyId, startMonthKey]
            );
        }

        const rows = Array.isArray(trends) ? trends : [];
        const byMonth = new Map(
            rows
                .filter((row) => row && row.month)
                .map((row) => [String(row.month), row])
        );

        const filled = monthKeys.map((month) => {
            const row = byMonth.get(month);
            return {
                month,
                posts: row ? Number(row.posts) || 0 : 0,
                applications: row ? Number(row.applications) || 0 : 0
            };
        });

        return res.json({ trends: filled });
    } catch (error) {
        console.error('Error fetching application trends:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getAllInternships,
    getFeaturedCompanies,
    getAllCompanies,
    getCompanyProfileById,
    getCompanyRatings,
    rateCompany,
    getInternshipById,
    getCompanyInternshipById,
    createInternship,
    getCompanyInternships,
    getCompanyArchivedInternships,
    restoreInternship,
    permanentlyDeleteInternship,
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

