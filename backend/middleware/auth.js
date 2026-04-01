const jwt = require('jsonwebtoken');
const db = require('../config/db');

const isBadFieldError = (error) => error && error.code === 'ER_BAD_FIELD_ERROR';
let usersColumnsPromise;
const getUsersColumns = async () => {
    if (!usersColumnsPromise) {
        usersColumnsPromise = db
            .query('SHOW COLUMNS FROM users')
            .then((rows) => new Set(rows.map((row) => row.Field)))
            .catch(() => new Set());
    }
    return usersColumnsPromise;
};

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

        let users;
        try {
            users = await db.query('SELECT id, role, status FROM users WHERE id = ? LIMIT 1', [userId]);
        } catch (error) {
            if (!isBadFieldError(error)) throw error;
            const columns = await getUsersColumns();
            const hasStatus = columns.has('status');
            const fallbackSql = hasStatus
                ? 'SELECT id, role, status FROM users WHERE id = ? LIMIT 1'
                : 'SELECT id, role FROM users WHERE id = ? LIMIT 1';
            users = await db.query(fallbackSql, [userId]);
        }
        if (!users || users.length === 0) {
            return res.status(401).json({ message: 'Account no longer exists' });
        }

        const user = users[0];
        if (user.status && String(user.status).toLowerCase() === 'suspended') {
            return res.status(403).json({ message: 'Account suspended' });
        }

        const normalizedRole = String(user.role || decoded.role || '').toLowerCase();
        req.user = {
            ...decoded,
            role: normalizedRole,
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
