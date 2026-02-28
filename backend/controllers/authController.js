const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const getJwtSecret = () => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not configured');
    }
    return process.env.JWT_SECRET;
};

const createToken = (payload) => {
    return jwt.sign(payload, getJwtSecret(), { expiresIn: '24h' });
};

// Basic registration (for quick signup)
const register = async (req, res) => {
    try {
        const { email, password, full_name, role = 'student' } = req.body;
        
        if (!email || !password || !full_name) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const existingUser = await db.query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existingUser.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await db.query(
            'INSERT INTO users (email, password, full_name, role) VALUES (?, ?, ?, ?)',
            [email, hashedPassword, full_name, role]
        );

        const token = createToken({ userId: result.insertId, email, role });

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: { id: result.insertId, email, full_name, role }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Complete student registration
const registerStudentComplete = async (req, res) => {
    let conn;
    try {
        const {
            email,
            password,
            full_name,
            phone,
            dob,
            address,
            education,
            university,
            graduation_year,
            bio,
            skills
        } = req.body;

        if (!email || !password || !full_name) {
            return res.status(400).json({ message: 'Required fields are missing' });
        }

        conn = await db.pool.getConnection();
        await conn.beginTransaction();

        const [existingUser] = await conn.execute('SELECT id FROM users WHERE email = ?', [email]);

        if (existingUser.length > 0) {
            await conn.rollback();
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [userResult] = await conn.execute(
            'INSERT INTO users (email, password, full_name, role, phone, dob, address, education, university, graduation_year, bio) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [email, hashedPassword, full_name, 'student', phone, dob, address, education, university, graduation_year, bio]
        );

        const userId = userResult.insertId;

        // Insert skills if provided
        if (skills && Array.isArray(skills)) {
            for (const skill of skills) {
                // First check if skill exists, if not create it
                const [existingSkill] = await conn.execute('SELECT id FROM skills WHERE name = ?', [skill.name]);
                let skillId;
                
                if (existingSkill.length === 0) {
                    let newSkill;
                    try {
                        [newSkill] = await conn.execute('INSERT INTO skills (name, category) VALUES (?, ?)', [skill.name, skill.category || 'general']);
                    } catch (error) {
                        if (error && error.code === 'ER_BAD_FIELD_ERROR') {
                            [newSkill] = await conn.execute('INSERT INTO skills (name) VALUES (?)', [skill.name]);
                        } else {
                            throw error;
                        }
                    }
                    skillId = newSkill.insertId;
                } else {
                    skillId = existingSkill[0].id;
                }

                try {
                    await conn.execute(
                        'INSERT INTO user_skills (user_id, skill_id, proficiency) VALUES (?, ?, ?)',
                        [userId, skillId, skill.proficiency || 'intermediate']
                    );
                } catch (error) {
                    if (error && error.code === 'ER_BAD_FIELD_ERROR') {
                        await conn.execute(
                            'INSERT INTO user_skills (user_id, skill_id) VALUES (?, ?)',
                            [userId, skillId]
                        );
                    } else {
                        throw error;
                    }
                }
            }
        }

        await conn.commit();

        const token = createToken({ userId, email, role: 'student' });

        res.status(201).json({
            message: 'Student registered successfully',
            token,
            user: { id: userId, email, full_name, role: 'student' }
        });
    } catch (error) {
        if (conn) {
            try {
                await conn.rollback();
            } catch (rollbackError) {
                console.error('Rollback error:', rollbackError);
            }
        }
        console.error('Student registration error:', error);
        res.status(500).json({ message: 'Server error' });
    } finally {
        if (conn) {
            conn.release();
        }
    }
};

// Complete company registration
const registerCompanyComplete = async (req, res) => {
    try {
        const {
            email,
            password,
            full_name: contact_person,
            company_name,
            industry,
            website,
            location,
            contact_phone,
            bio: company_bio
        } = req.body;

        if (!email || !password || !contact_person || !company_name) {
            return res.status(400).json({ message: 'Required fields are missing' });
        }

        const existingUser = await db.query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existingUser.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        const userResult = await db.query(
            'INSERT INTO users (email, password, full_name, role, company_name, industry, website, location, contact_person, contact_phone, bio) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [email, hashedPassword, contact_person, 'company', company_name, industry, website, location, contact_person, contact_phone, company_bio]
        );

        const token = createToken({ userId: userResult.insertId, email, role: 'company' });

        res.status(201).json({
            message: 'Company registered successfully',
            token,
            user: { id: userResult.insertId, email, full_name: contact_person, role: 'company' }
        });
    } catch (error) {
        console.error('Company registration error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Admin registration (with verification code)
const registerAdmin = async (req, res) => {
    try {
        const {
            email,
            password,
            full_name,
            admin_code,
            department
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

        const existingUser = await db.query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existingUser.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await db.query(
            'INSERT INTO users (email, password, full_name, role, admin_code, department) VALUES (?, ?, ?, ?, ?, ?)',
            [email, hashedPassword, full_name, 'admin', admin_code, department]
        );

        const token = createToken({ userId: result.insertId, email, role: 'admin' });

        res.status(201).json({
            message: 'Admin registration submitted for verification',
            token,
            user: { id: result.insertId, email, full_name, role: 'admin' }
        });
    } catch (error) {
        console.error('Admin registration error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const users = await db.query(
            'SELECT id, email, password, full_name, role FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = users[0];
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = createToken({ userId: user.id, email: user.email, role: user.role });

        res.json({
            message: 'Login successful',
            token,
            user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    register,
    registerStudentComplete,
    registerCompanyComplete,
    registerAdmin,
    login
};