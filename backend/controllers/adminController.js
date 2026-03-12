const db = require('../config/db');

const getAllUsers = async (req, res) => {
    try {
        const users = await db.query(`
            SELECT id, full_name as name, email, role, 
            CASE WHEN role = 'admin' THEN 'Active' ELSE 'Active' END as status,
            DATE_FORMAT(created_at, '%b %d, %Y') as date,
            LEFT(full_name, 1) as initial,
            'bg-blue-100' as color
            FROM users 
            ORDER BY created_at DESC
        `);
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getStats = async (req, res) => {
    try {
        const [userCount] = await db.query('SELECT COUNT(*) as count FROM users');
        const [studentCount] = await db.query("SELECT COUNT(*) as count FROM users WHERE role = 'student'");
        const [companyCount] = await db.query("SELECT COUNT(*) as count FROM users WHERE role = 'company'");
        const [internshipCount] = await db.query('SELECT COUNT(*) as count FROM internships');

        res.json({
            totalUsers: userCount.count,
            students: studentCount.count,
            companies: companyCount.count,
            internships: internshipCount.count
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getAllUsers,
    getStats
};
