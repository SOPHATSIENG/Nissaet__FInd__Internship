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
                i.work_mode,
                i.duration,
                i.salary_type,
                i.salary_min,
                i.salary_max,
                i.positions,
                i.deadline,
                i.is_active,
                i.views,
                i.applications_count,
                i.created_at,
                i.updated_at,
                c.company_name,
                c.location AS company_location,
                c.logo AS company_logo
             FROM internships i
             JOIN companies c ON i.company_id = c.id
             WHERE i.is_active = 1
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
                c.company_name,
                c.description,
                c.logo,
                c.location,
                c.rating,
                COUNT(i.id) AS open_positions
             FROM companies c
             LEFT JOIN internships i
                ON i.company_id = c.id
                AND i.is_active = 1
             GROUP BY c.id, c.company_name, c.description, c.logo, c.location, c.rating
             ORDER BY open_positions DESC, c.rating DESC, c.company_name ASC
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
                i.*,
                c.company_name,
                c.location AS company_location,
                c.description AS company_description,
                c.logo AS company_logo,
                c.website AS company_website
             FROM internships i
             JOIN companies c ON i.company_id = c.id
             WHERE i.id = ? AND i.is_active = 1`,
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
            work_mode = 'On-site',
            duration,
            salary_type = 'unpaid',
            salary_min,
            salary_max,
            positions = 1,
            deadline
        } = req.body;

        let companyId = req.body.company_id;

        if (req.user && req.user.role === 'company') {
            companyId = await getCompanyIdByUserId(req.user.userId);
        }

        if (!companyId || !title || !description || !location || !duration || !deadline) {
            return res.status(400).json({ message: 'Required fields are missing' });
        }

        const result = await db.query(
            `INSERT INTO internships (
                company_id, title, description, requirements, location,
                work_mode, duration, salary_type, salary_min, salary_max,
                positions, deadline
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                companyId,
                title,
                description,
                requirements || null,
                location,
                work_mode,
                duration,
                salary_type,
                salary_min || null,
                salary_max || null,
                positions,
                deadline
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
