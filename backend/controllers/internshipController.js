const db = require('../config/db');

const getAllInternships = async (req, res) => {
    try {
        const internships = await db.query(`
            SELECT 
                i.*,
                COALESCE(u.company_name, u.full_name) AS company_name,
                u.location AS company_location
            FROM internships i
            JOIN users u ON i.company_id = u.id
            WHERE i.is_active = 1
            ORDER BY i.created_at DESC
        `);
        
        res.json(internships);
    } catch (error) {
        console.error('Error fetching internships:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getInternshipById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const internships = await db.query(`
            SELECT 
                i.*,
                COALESCE(u.company_name, u.full_name) AS company_name,
                u.location AS company_location,
                u.bio AS company_description
            FROM internships i
            JOIN users u ON i.company_id = u.id
            WHERE i.id = ? AND i.is_active = 1
        `, [id]);
        
        if (internships.length === 0) {
            return res.status(404).json({ message: 'Internship not found' });
        }
        
        res.json(internships[0]);
    } catch (error) {
        console.error('Error fetching internship:', error);
        res.status(500).json({ message: 'Server error' });
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
            companyId = req.user.userId;
        }

        if (!companyId || !title || !description || !location || !duration || !deadline) {
            return res.status(400).json({ message: 'Required fields are missing' });
        }

        const result = await db.query(`
            INSERT INTO internships (
                company_id, title, description, requirements, location, 
                work_mode, duration, salary_type, salary_min, salary_max, 
                positions, deadline
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            companyId, title, description, requirements, location,
            work_mode, duration, salary_type, salary_min, salary_max,
            positions, deadline
        ]);

        res.status(201).json({
            message: 'Internship created successfully',
            internshipId: result.insertId
        });
    } catch (error) {
        console.error('Error creating internship:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getAllInternships,
    getInternshipById,
    createInternship
};