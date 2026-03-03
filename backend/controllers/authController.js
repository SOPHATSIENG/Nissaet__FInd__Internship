const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const DEFAULT_ROLE = 'student';
const VALID_ROLES = new Set(['student', 'company', 'admin']);
const VALID_SKILL_LEVELS = new Set(['beginner', 'intermediate', 'advanced', 'expert']);

const getJwtSecret = () => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not configured');
    }
    return process.env.JWT_SECRET;
};

const normalizeRole = (role) => {
    if (!role) return DEFAULT_ROLE;
    return VALID_ROLES.has(role) ? role : DEFAULT_ROLE;
};

const normalizeSkillLevel = (skillLevel) => {
    if (!skillLevel) return 'intermediate';
    return VALID_SKILL_LEVELS.has(skillLevel) ? skillLevel : 'intermediate';
};

const createToken = (payload) => {
    return jwt.sign(payload, getJwtSecret(), { expiresIn: '24h' });
};

const buildAuthResponse = (userId, email, fullName, role) => {
    const normalizedRole = normalizeRole(role);
    return {
        token: createToken({ userId, email, role: normalizedRole }),
        user: {
            id: userId,
            email,
            full_name: fullName,
            role: normalizedRole
        }
    };
};

const getUserByEmail = async (email) => {
    const users = await db.query(
        'SELECT id, email, password, full_name, role FROM users WHERE email = ?',
        [email]
    );
    return users[0] || null;
};

const createStudentProfile = async (conn, userId, payload = {}) => {
    await conn.execute(
        `INSERT INTO students
         (user_id, phone, dob, address, education, university, graduation_year, bio, cv_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            userId,
            payload.phone || null,
            payload.dob || null,
            payload.address || null,
            payload.education || null,
            payload.university || null,
            payload.graduation_year || null,
            payload.bio || null,
            payload.cv_url || null
        ]
    );
};

const createCompanyProfile = async (conn, userId, payload = {}) => {
    await conn.execute(
        `INSERT INTO companies
         (user_id, company_name, logo, description, industry, location, website, contact_person, contact_phone)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            userId,
            payload.company_name || payload.full_name || 'Company',
            payload.logo || null,
            payload.company_bio || payload.bio || null,
            payload.industry || null,
            payload.location || null,
            payload.website || null,
            payload.contact_person || payload.full_name || null,
            payload.contact_phone || payload.phone || null
        ]
    );
};

const register = async (req, res) => {
    let conn;
    try {
        const {
            email,
            password,
            full_name,
            role = DEFAULT_ROLE
        } = req.body;

        if (!email || !password || !full_name) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const existingUser = await getUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        conn = await db.pool.getConnection();
        await conn.beginTransaction();

        const hashedPassword = await bcrypt.hash(password, 10);
        const normalizedRole = normalizeRole(role);

        const [userResult] = await conn.execute(
            'INSERT INTO users (email, password, full_name, role) VALUES (?, ?, ?, ?)',
            [email, hashedPassword, full_name, normalizedRole]
        );

        const userId = userResult.insertId;

        if (normalizedRole === 'student') {
            await createStudentProfile(conn, userId, req.body);
        } else if (normalizedRole === 'company') {
            await createCompanyProfile(conn, userId, req.body);
        }

        await conn.commit();

        const response = buildAuthResponse(userId, email, full_name, normalizedRole);
        return res.status(201).json({
            message: 'User registered successfully',
            ...response
        });
    } catch (error) {
        if (conn) {
            await conn.rollback();
        }
        console.error('Registration error:', error);
        return res.status(500).json({ message: 'Server error' });
    } finally {
        if (conn) conn.release();
    }
};

const registerStudentComplete = async (req, res) => {
    let conn;
    try {
        const {
            email,
            password,
            full_name,
            skills
        } = req.body;

        if (!email || !password || !full_name) {
            return res.status(400).json({ message: 'Required fields are missing' });
        }

        const existingUser = await getUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        conn = await db.pool.getConnection();
        await conn.beginTransaction();

        const hashedPassword = await bcrypt.hash(password, 10);

        const [userResult] = await conn.execute(
            'INSERT INTO users (email, password, full_name, role) VALUES (?, ?, ?, ?)',
            [email, hashedPassword, full_name, 'student']
        );

        const userId = userResult.insertId;
        await createStudentProfile(conn, userId, req.body);

        if (Array.isArray(skills) && skills.length > 0) {
            for (const skill of skills) {
                if (!skill || !skill.name) continue;

                const [existingSkill] = await conn.execute(
                    'SELECT id FROM skills WHERE name = ?',
                    [skill.name]
                );

                let skillId;
                if (existingSkill.length > 0) {
                    skillId = existingSkill[0].id;
                } else {
                    const [newSkillResult] = await conn.execute(
                        'INSERT INTO skills (name, category) VALUES (?, ?)',
                        [skill.name, skill.category || 'general']
                    );
                    skillId = newSkillResult.insertId;
                }

                await conn.execute(
                    `INSERT INTO user_skills (user_id, skill_id, skill_level)
                     VALUES (?, ?, ?)
                     ON DUPLICATE KEY UPDATE skill_level = VALUES(skill_level)`,
                    [userId, skillId, normalizeSkillLevel(skill.proficiency || skill.skill_level)]
                );
            }
        }

        await conn.commit();

        const response = buildAuthResponse(userId, email, full_name, 'student');
        return res.status(201).json({
            message: 'Student registered successfully',
            ...response
        });
    } catch (error) {
        if (conn) {
            await conn.rollback();
        }
        console.error('Student registration error:', error);
        return res.status(500).json({ message: 'Server error' });
    } finally {
        if (conn) conn.release();
    }
};

const registerCompanyComplete = async (req, res) => {
    let conn;
    try {
        const {
            email,
            password,
            full_name,
            company_name
        } = req.body;

        if (!email || !password || !full_name || !company_name) {
            return res.status(400).json({ message: 'Required fields are missing' });
        }

        const existingUser = await getUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        conn = await db.pool.getConnection();
        await conn.beginTransaction();

        const hashedPassword = await bcrypt.hash(password, 10);

        const [userResult] = await conn.execute(
            'INSERT INTO users (email, password, full_name, role) VALUES (?, ?, ?, ?)',
            [email, hashedPassword, full_name, 'company']
        );

        const userId = userResult.insertId;
        await createCompanyProfile(conn, userId, req.body);

        await conn.commit();

        const response = buildAuthResponse(userId, email, full_name, 'company');
        return res.status(201).json({
            message: 'Company registered successfully',
            ...response
        });
    } catch (error) {
        if (conn) {
            await conn.rollback();
        }
        console.error('Company registration error:', error);
        return res.status(500).json({ message: 'Server error' });
    } finally {
        if (conn) conn.release();
    }
};

const registerAdmin = async (req, res) => {
    try {
        const {
            email,
            password,
            full_name,
            admin_code
        } = req.body;

        if (!email || !password || !full_name || !admin_code) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (!process.env.ADMIN_REGISTRATION_CODE) {
            return res.status(500).json({ message: 'Admin registration is not configured' });
        }

        if (admin_code !== process.env.ADMIN_REGISTRATION_CODE) {
            return res.status(400).json({ message: 'Invalid admin code' });
        }

        const existingUser = await getUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await db.query(
            'INSERT INTO users (email, password, full_name, role) VALUES (?, ?, ?, ?)',
            [email, hashedPassword, full_name, 'admin']
        );

        const response = buildAuthResponse(result.insertId, email, full_name, 'admin');
        return res.status(201).json({
            message: 'Admin registered successfully',
            ...response
        });
    } catch (error) {
        console.error('Admin registration error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await getUserByEmail(email);
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const response = buildAuthResponse(user.id, user.email, user.full_name, user.role);
        return res.json({
            message: 'Login successful',
            ...response
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const socialLogin = async (req, res) => {
    let conn;
    try {
        const {
            provider = 'social',
            email,
            fullName,
            role = DEFAULT_ROLE,
            companyName,
            location
        } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const existingUser = await getUserByEmail(email);
        if (existingUser) {
            const response = buildAuthResponse(
                existingUser.id,
                existingUser.email,
                existingUser.full_name,
                existingUser.role
            );
            return res.json({
                message: `${provider} login successful`,
                ...response
            });
        }

        conn = await db.pool.getConnection();
        await conn.beginTransaction();

        const normalizedRole = normalizeRole(role);
        const generatedPassword = crypto.randomBytes(24).toString('hex');
        const hashedPassword = await bcrypt.hash(generatedPassword, 10);
        const normalizedName = fullName || `${provider} user`;

        const [userResult] = await conn.execute(
            'INSERT INTO users (email, password, full_name, role, google_id) VALUES (?, ?, ?, ?, ?)',
            [email, hashedPassword, normalizedName, normalizedRole, provider === 'google' ? `google:${email}` : null]
        );

        const userId = userResult.insertId;

        if (normalizedRole === 'student') {
            await createStudentProfile(conn, userId, req.body);
        } else if (normalizedRole === 'company') {
            await createCompanyProfile(conn, userId, {
                ...req.body,
                company_name: companyName || req.body.company_name,
                location
            });
        }

        await conn.commit();

        const response = buildAuthResponse(userId, email, normalizedName, normalizedRole);
        return res.status(201).json({
            message: `${provider} login successful`,
            ...response
        });
    } catch (error) {
        if (conn) {
            await conn.rollback();
        }
        console.error('Social login error:', error);
        return res.status(500).json({ message: 'Server error' });
    } finally {
        if (conn) conn.release();
    }
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const user = await getUserByEmail(email);
        if (!user) {
            return res.json({ message: 'If that email exists, a reset token was generated.' });
        }

        const resetToken = jwt.sign(
            { userId: user.id, purpose: 'password_reset' },
            getJwtSecret(),
            { expiresIn: '15m' }
        );

        return res.json({
            message: 'Reset token generated successfully',
            reset_token: resetToken,
            expires_in: '15m'
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ message: 'Token and newPassword are required' });
        }

        if (String(newPassword).length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters' });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, getJwtSecret());
        } catch (error) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        if (!decoded || decoded.purpose !== 'password_reset' || !decoded.userId) {
            return res.status(400).json({ message: 'Invalid reset token' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, decoded.userId]);

        return res.json({ message: 'Password reset successful' });
    } catch (error) {
        console.error('Reset password error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const getCurrentUser = async (req, res) => {
    try {
        if (!req.user || !req.user.userId) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const users = await db.query(
            'SELECT id, email, full_name, role, profile_pic, is_verified, created_at FROM users WHERE id = ?',
            [req.user.userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = users[0];

        if (user.role === 'student') {
            const students = await db.query(
                'SELECT id, phone, dob, address, education, university, graduation_year, bio, cv_url FROM students WHERE user_id = ? LIMIT 1',
                [user.id]
            );
            if (students.length > 0) {
                user.student_profile = students[0];
            }
        } else if (user.role === 'company') {
            const companies = await db.query(
                'SELECT id, company_name, logo, description, industry, location, website, contact_person, contact_phone, rating FROM companies WHERE user_id = ? LIMIT 1',
                [user.id]
            );
            if (companies.length > 0) {
                user.company_profile = companies[0];
            }
        }

        return res.json({ user });
    } catch (error) {
        console.error('Get current user error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    register,
    registerStudentComplete,
    registerCompanyComplete,
    registerAdmin,
    login,
    socialLogin,
    forgotPassword,
    resetPassword,
    getCurrentUser
};
