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
            end_date
        } = req.body;

        let companyId = req.body.company_id;

        if (req.user && req.user.role === 'company') {
            companyId = await getCompanyIdByUserId(req.user.userId);
        }

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

        return res.status(201).json({
            message: 'Internship created successfully',
            internshipId: result.insertId
        });
    } catch (error) {
        console.error('Error creating internship:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getAllInternships,
    getFeaturedCompanies,
    getInternshipById,
    createInternship
};
