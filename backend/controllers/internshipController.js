const db = require('../config/db');

const getCompanyIdByUserId = async (userId) => {
    const rows = await db.query('SELECT id FROM companies WHERE user_id = ? LIMIT 1', [userId]);
    return rows.length > 0 ? rows[0].id : null;
};

const getAllInternships = async (req, res) => {
    try {
        const parsedLimit = Number.parseInt(req.query.limit, 10);
        const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 100) : null;

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

const updateInternship = async (req, res) => {
    try {
        console.log('=== UPDATE INTERNSHIP FUNCTION CALLED ===');
        console.log('Request method:', req.method);
        console.log('Request URL:', req.originalUrl);
        console.log('Update internship request received:', req.body);
        console.log('Internship ID:', req.params.id);
        console.log('User from token:', req.user);

        const { id } = req.params;
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

        if (!title || !description || !location || !duration_months || !application_deadline) {
            return res.status(400).json({ message: 'Required fields are missing' });
        }

        // Check if internship exists and belongs to the company
        const existingInternship = await db.query(
            'SELECT company_id FROM internships WHERE id = ? AND status = "active"',
            [id]
        );

        if (existingInternship.length === 0) {
            return res.status(404).json({ message: 'Internship not found' });
        }

        let companyId = existingInternship[0].company_id;

        // If user is a company, verify ownership
        if (req.user && req.user.role === 'company') {
            const userCompanyId = await getCompanyIdByUserId(req.user.userId);
            if (companyId !== userCompanyId) {
                return res.status(403).json({ message: 'You can only update your own internships' });
            }
        }

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

            // Update skills: remove existing skills and add new ones
            await connection.execute(
                'DELETE FROM internship_skills WHERE internship_id = ?',
                [id]
            );

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
                        [id, skillId]
                    );
                }
            }

            await connection.commit();
            console.log('Update transaction committed successfully');

            return res.json({
                message: 'Internship updated successfully',
                internshipId: parseInt(id)
            });
        } catch (error) {
            await connection.rollback();
            console.error('Update transaction rolled back due to error:', error);
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error updating internship:', error);
        return res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

const deleteInternship = async (req, res) => {
    try {
        console.log('Delete internship request received for ID:', req.params.id);
        console.log('User from token:', req.user);

        const { id } = req.params;
        
        // Validate ID
        if (!id || isNaN(parseInt(id))) {
            console.log('Invalid internship ID:', id);
            return res.status(400).json({ message: 'Invalid internship ID' });
        }

        // Check if internship exists and belongs to the company
        const existingInternship = await db.query(
            'SELECT company_id FROM internships WHERE id = ? AND status = "active"',
            [id]
        );

        console.log('Existing internship query result:', existingInternship);

        if (existingInternship.length === 0) {
            console.log('Internship not found or already deleted:', id);
            return res.status(404).json({ message: 'Internship not found' });
        }

        let companyId = existingInternship[0].company_id;
        console.log('Internship belongs to company ID:', companyId);

        // If user is a company, verify ownership
        if (req.user && req.user.role === 'company') {
            const userCompanyId = await getCompanyIdByUserId(req.user.userId);
            console.log('User company ID:', userCompanyId);
            if (companyId !== userCompanyId) {
                console.log('Authorization failed: User does not own this internship');
                return res.status(403).json({ message: 'You can only delete your own internships' });
            }
        }

        // Soft delete by setting status to 'deleted'
        const updateResult = await db.query(
            'UPDATE internships SET status = "deleted", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [id]
        );

        console.log('Update query result:', updateResult);
        console.log('Internship deleted successfully:', id);

        return res.json({
            message: 'Internship deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting internship:', error);
        return res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

module.exports = {
    getAllInternships,
    getFeaturedCompanies,
    getInternshipById,
    createInternship,
    updateInternship,
    deleteInternship,
    getMatchingInternships
};
