const jwt = require('jsonwebtoken');
const db = require('../config/db');

const getJwtSecret = () => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not configured');
    }
    return process.env.JWT_SECRET;
};

const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization || '';
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const decoded = jwt.verify(token, getJwtSecret());
        const userId = decoded && decoded.userId ? Number(decoded.userId) : null;
        if (!userId) {
            return res.status(401).json({ message: 'Invalid or expired token' });
        }

        const users = await db.query('SELECT id, role, status FROM users WHERE id = ? LIMIT 1', [userId]);
        if (!users || users.length === 0) {
            return res.status(401).json({ message: 'Account no longer exists' });
        }

        const user = users[0];
        if (user.status && String(user.status).toLowerCase() === 'suspended') {
            return res.status(403).json({ message: 'Account suspended' });
        }

        req.user = {
            ...decoded,
            role: user.role || decoded.role,
            userId: user.id
        };
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        next();
    };
};

module.exports = {
    authenticate,
    authorize
};
