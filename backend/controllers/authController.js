const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const DEFAULT_ROLE = 'student';
const VALID_ROLES = new Set(['student', 'company', 'admin']);
const VALID_SKILL_LEVELS = new Set(['beginner', 'intermediate', 'advanced', 'expert']);
const VALID_COMPANY_SIZES = new Set(['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']);

const getJwtSecret = () => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not configured');
    }
    return process.env.JWT_SECRET;
};

const normalizeRole = (role) => {
    if (!role) return DEFAULT_ROLE;
    const normalized = String(role).toLowerCase();
    return VALID_ROLES.has(normalized) ? normalized : DEFAULT_ROLE;
};

const normalizeSkillLevel = (skillLevel) => {
    if (!skillLevel) return 'intermediate';
    return VALID_SKILL_LEVELS.has(skillLevel) ? skillLevel : 'intermediate';
};

const validatePasswordStrength = (value) => {
    const raw = String(value || '');
    if (raw.length < 8) {
        return 'Password must be at least 8 characters.';
    }
    if (!/[A-Za-z]/.test(raw) || !/\d/.test(raw) || !/[!@#$%]/.test(raw)) {
        return 'Password must include letters, numbers, and one of ! @ # $ %.';
    }
    return '';
};

const isBadFieldError = (error) => error && error.code === 'ER_BAD_FIELD_ERROR';

const touchUserActivity = async (userId) => {
    if (!userId) return;
    try {
        await db.query(
            `UPDATE users
             SET last_active_at = NOW()
             WHERE id = ?
               AND (last_active_at IS NULL OR last_active_at < DATE_SUB(NOW(), INTERVAL 30 SECOND))`,
            [userId]
        );
    } catch (error) {
        if (!isBadFieldError(error)) throw error;
    }
};

const recordUserLogin = async (userId) => {
    if (!userId) return;
    try {
        await db.query(
            `UPDATE users
             SET last_login_at = NOW(),
                 last_active_at = NOW()
             WHERE id = ?`,
            [userId]
        );
    } catch (error) {
        if (!isBadFieldError(error)) throw error;
    }
};

const normalizeUserRecord = (rawUser) => {
    if (!rawUser) return null;
    return {
        ...rawUser,
        password: rawUser.password || rawUser.password_hash || null,
        full_name: rawUser.full_name || rawUser.name || 'User',
        role: normalizeRole(rawUser.role || DEFAULT_ROLE)
    };
};

const getTrimmed = (value) => String(value || '').trim();

const getTableColumns = async (conn, tableName) => {
    try {
        const [rows] = await conn.execute(`SHOW COLUMNS FROM ${tableName}`);
        return new Set(rows.map((row) => row.Field));
    } catch (error) {
        return new Set();
    }
};

const updateUserProfileExtras = async (conn, userId, payload = {}) => {
    const columns = await getTableColumns(conn, 'users');
    if (columns.size === 0) return;

    const updates = {};
    const assignIfColumn = (column, value) => {
        if (columns.has(column) && value !== undefined) {
            updates[column] = value;
        }
    };

    const dobValue = getTrimmed(payload.dob || payload.date_of_birth);
    assignIfColumn('phone', getTrimmed(payload.phone) || null);
    assignIfColumn('dob', dobValue || null);
    assignIfColumn('date_of_birth', dobValue || null);
    assignIfColumn('address', getTrimmed(payload.address) || null);
    assignIfColumn('bio', getTrimmed(payload.bio) || null);
    assignIfColumn('education', getTrimmed(payload.education) || null);
    assignIfColumn('university', getTrimmed(payload.university) || null);
    assignIfColumn('graduation_year', payload.graduation_year || null);
    assignIfColumn('cv_url', getTrimmed(payload.cv_url || payload.resume_url) || null);

    const entries = Object.entries(updates).filter(([, value]) => value !== undefined);
    if (entries.length === 0) return;

    const sql = `UPDATE users SET ${entries.map(([column]) => `${column} = ?`).join(', ')} WHERE id = ?`;
    await conn.execute(sql, [...entries.map(([, value]) => value), userId]);
};

const validateStudentRegistration = (payload = {}, options = {}) => {
    const requireSkills = Boolean(options.requireSkills);

    if (!getTrimmed(payload.phone)) return 'Phone number is required.';
    const dobValue = getTrimmed(payload.dob || payload.date_of_birth);
    if (!dobValue) return 'Date of birth is required.';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dobValue)) return 'Date of birth must be a valid date.';
    if (!getTrimmed(payload.address)) return 'Address is required.';
    if (!getTrimmed(payload.education)) return 'Education level is required.';
    const gradYearValue = getTrimmed(payload.graduation_year);
    if (!gradYearValue) return 'Graduation year is required.';
    if (!/^\d{4}$/.test(gradYearValue)) return 'Graduation year must be a 4-digit year.';
    if (!getTrimmed(payload.university)) return 'University / institution name is required.';
    if (!getTrimmed(payload.bio)) return 'Bio is required.';
    if (!getTrimmed(payload.cv_url || payload.resume_url)) return 'Resume / CV is required.';

    if (requireSkills) {
        if (!Array.isArray(payload.skills) || payload.skills.length === 0) {
            return 'Please add at least one skill.';
        }
    }

    return '';
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

const ensureRoleProfile = async (role, userId, payload = {}) => {
    const normalizedRole = normalizeRole(role);
    if (normalizedRole === 'company') {
        const companies = await db.query('SELECT id FROM companies WHERE user_id = ? LIMIT 1', [userId]);
        if (companies.length > 0) return;

        let conn;
        try {
            conn = await db.pool.getConnection();
            await conn.beginTransaction();
            await createCompanyProfile(conn, userId, payload);
            await conn.commit();
        } catch (error) {
            if (conn) await conn.rollback();
            throw error;
        } finally {
            if (conn) conn.release();
        }
        return;
    }

    if (normalizedRole === 'student') {
        const students = await db.query('SELECT id FROM students WHERE user_id = ? LIMIT 1', [userId]);
        if (students.length > 0) return;

        let conn;
        try {
            conn = await db.pool.getConnection();
            await conn.beginTransaction();
            await createStudentProfile(conn, userId, payload);
            await conn.commit();
        } catch (error) {
            if (conn) await conn.rollback();
            throw error;
        } finally {
            if (conn) conn.release();
        }
    }
};

const getUserByEmail = async (email) => {
    const users = await db.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
    return normalizeUserRecord(users[0]);
};

const insertUser = async (conn, { email, hashedPassword, fullName, role, googleId = null }) => {
    // FIXED: try compatible user schemas in a safe order.
    const attempts = [];
    if (googleId !== null && googleId !== undefined) {
        attempts.push({
            sql: 'INSERT INTO users (email, password, full_name, role, google_id) VALUES (?, ?, ?, ?, ?)',
            params: [email, hashedPassword, fullName, role, googleId]
        });
    }

    attempts.push(
        {
            sql: 'INSERT INTO users (email, password, full_name, role) VALUES (?, ?, ?, ?)',
            params: [email, hashedPassword, fullName, role]
        },
        {
            sql: 'INSERT INTO users (email, password_hash, full_name, role) VALUES (?, ?, ?, ?)',
            params: [email, hashedPassword, fullName, role]
        },
        {
            sql: 'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
            params: [email, hashedPassword, fullName, role]
        },
        {
            sql: 'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)',
            params: [email, hashedPassword, fullName, role]
        }
    );

    let lastBadFieldError = null;
    for (const attempt of attempts) {
        try {
            const [result] = await conn.execute(attempt.sql, attempt.params);
            return result;
        } catch (error) {
            if (!isBadFieldError(error)) throw error;
            lastBadFieldError = error;
        }
    }

    throw lastBadFieldError || new Error('Unable to insert user with available schema variants.');
};

const createStudentProfile = async (conn, userId, payload = {}) => {
    const normalizedEducation =
        payload.education === 'phd'
            ? 'postgraduate'
            : (payload.education || payload.current_education_level || null);

    try {
        await conn.execute(
            `INSERT INTO students
             (user_id, date_of_birth, gender, nationality, current_education_level, university, major, graduation_year, gpa, resume_url, linkedin_url, portfolio_url, is_available)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                userId,
                payload.dob || payload.date_of_birth || null,
                payload.gender || null,
                payload.nationality || null,
                normalizedEducation,
                payload.university || null,
                payload.major || null,
                payload.graduation_year || null,
                payload.gpa || null,
                payload.cv_url || payload.resume_url || null,
                payload.linkedin_url || null,
                payload.portfolio_url || null,
                typeof payload.is_available === 'boolean' ? payload.is_available : true
            ]
        );
    } catch (error) {
        if (!isBadFieldError(error)) throw error;

        // FIXED: fallback for legacy students schema.
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
    }
};

const getStudentIdByUserId = async (conn, userId) => {
    try {
        const [rows] = await conn.execute(
            'SELECT id FROM students WHERE user_id = ? ORDER BY id DESC LIMIT 1',
            [userId]
        );
        return rows[0]?.id || null;
    } catch (error) {
        if (!isBadFieldError(error)) throw error;
        const [rows] = await conn.execute(
            'SELECT id FROM students WHERE user_id = ? ORDER BY id DESC LIMIT 1',
            [userId]
        );
        return rows[0]?.id || null;
    }
};

const createCompanyProfile = async (conn, userId, payload = {}) => {
    const companySize = VALID_COMPANY_SIZES.has(payload.company_size) ? payload.company_size : null;
    const rawCompanyName = payload.company_name || payload.name || payload.full_name || 'Company';
    const companyName = String(rawCompanyName || '').trim().replace(/\s+/g, ' ');

    if (companyName) {
        const normalized = companyName;
        const checkDuplicates = async (sql, params) => {
            const [rows] = await conn.execute(sql, params);
            if (rows?.length) {
                throw new Error('Company name already exists');
            }
        };
        try {
            const [cols] = await conn.execute(
                `SELECT COLUMN_NAME
                 FROM INFORMATION_SCHEMA.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE()
                   AND TABLE_NAME = 'companies'`
            );
            const columnSet = new Set((cols || []).map((row) => row.COLUMN_NAME));
            const clauses = [];
            const params = [];
            if (columnSet.has('name')) {
                clauses.push('LOWER(TRIM(name)) = LOWER(?)');
                params.push(normalized);
            }
            if (columnSet.has('company_name')) {
                clauses.push('LOWER(TRIM(company_name)) = LOWER(?)');
                params.push(normalized);
            }
            if (clauses.length > 0) {
                await checkDuplicates(
                    `SELECT id FROM companies WHERE ${clauses.join(' OR ')} LIMIT 1`,
                    params
                );
            }
        } catch (error) {
            if (error?.message === 'Company name already exists') throw error;
            // Fallbacks for unknown schema or permission issues
            try {
                await checkDuplicates(
                    `SELECT id FROM companies WHERE LOWER(TRIM(company_name)) = LOWER(?) LIMIT 1`,
                    [normalized]
                );
            } catch (fallbackError) {
                if (fallbackError?.message === 'Company name already exists') throw fallbackError;
                try {
                    await checkDuplicates(
                        `SELECT id FROM companies WHERE LOWER(TRIM(name)) = LOWER(?) LIMIT 1`,
                        [normalized]
                    );
                } catch (fallbackError2) {
                    if (fallbackError2?.message === 'Company name already exists') throw fallbackError2;
                    throw error;
                }
            }
        }
    }

    const logoValue = payload.logo || null;
    if (logoValue && String(logoValue).length > 255) {
        try {
            const [rows] = await conn.execute(
                `SELECT DATA_TYPE, CHARACTER_MAXIMUM_LENGTH AS max_len
                 FROM INFORMATION_SCHEMA.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE()
                   AND TABLE_NAME = 'companies'
                   AND COLUMN_NAME = 'logo'
                 LIMIT 1`
            );
            const column = rows?.[0];
            const dataType = String(column?.DATA_TYPE || '').toLowerCase();
            if (dataType && !['longtext', 'text', 'mediumtext'].includes(dataType)) {
                await conn.execute(`ALTER TABLE companies MODIFY COLUMN logo LONGTEXT`);
            }
        } catch (error) {
            console.warn('Could not ensure companies.logo is LONGTEXT:', error.message);
        }
    }
    try {
        await conn.execute(
            `INSERT INTO companies
             (user_id, name, description, industry, website, logo, company_size, founded_year, headquarters)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                userId,
                companyName,
                payload.company_bio || payload.bio || null,
                payload.industry || null,
                payload.website || null,
                logoValue,
                companySize,
                payload.founded_year || null,
                payload.location || payload.headquarters || null
            ]
        );
    } catch (error) {
        if (!isBadFieldError(error)) throw error;

        // FIXED: fallback for legacy companies schema.
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
    }
};

const getCompanyIdByUserId = async (conn, userId) => {
    try {
        const [rows] = await conn.execute(
            'SELECT id FROM companies WHERE user_id = ? ORDER BY id DESC LIMIT 1',
            [userId]
        );
        return rows[0]?.id || null;
    } catch (error) {
        if (!isBadFieldError(error)) throw error;
        const [rows] = await conn.execute(
            'SELECT id FROM companies WHERE user_id = ? ORDER BY id DESC LIMIT 1',
            [userId]
        );
        return rows[0]?.id || null;
    }
};

const getCompanyDetailsById = async (conn, companyId) => {
    try {
        const [rows] = await conn.execute(
            `SELECT
                name AS company_name,
                industry,
                website,
                headquarters AS location
             FROM companies
             WHERE id = ?
             LIMIT 1`,
            [companyId]
        );
        return rows[0] || {};
    } catch (error) {
        if (!isBadFieldError(error)) throw error;
        const [rows] = await conn.execute(
            `SELECT
                company_name,
                industry,
                website,
                location
             FROM companies
             WHERE id = ?
             LIMIT 1`,
            [companyId]
        );
        return rows[0] || {};
    }
};

const createCompanyVerificationRequest = async (conn, userId, payload = {}) => {
    try {
        const companyId = await getCompanyIdByUserId(conn, userId);
        if (!companyId) return;

        const [existing] = await conn.execute(
            `SELECT id, status FROM company_verifications
             WHERE company_id = ?
             ORDER BY submitted_at DESC
             LIMIT 1`,
            [companyId]
        );

        if (existing?.[0] && existing[0].status === 'pending') {
            return;
        }

        const companyDetails = await getCompanyDetailsById(conn, companyId);
        const documents = Array.isArray(payload.documents) ? payload.documents : [];
        await conn.execute(
            `INSERT INTO company_verifications
             (company_id, user_id, status, documents, notes, company_name, industry, website, location, contact_email, contact_person)
             VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                companyId,
                userId,
                JSON.stringify(documents),
                payload.notes || null,
                payload.company_name || payload.name || payload.full_name || companyDetails.company_name || null,
                payload.industry || companyDetails.industry || null,
                payload.website || companyDetails.website || null,
                payload.location || companyDetails.location || null,
                payload.email || null,
                payload.contact_person || payload.full_name || null
            ]
        );
    } catch (error) {
        if (error && error.code === 'ER_NO_SUCH_TABLE') {
            return;
        }
        throw error;
    }
};

const createStudentVerificationRequest = async (conn, userId, payload = {}) => {
    try {
        const studentId = await getStudentIdByUserId(conn, userId);
        if (!studentId) return;

        const [existing] = await conn.execute(
            `SELECT id, status FROM student_verifications
             WHERE student_id = ?
             ORDER BY submitted_at DESC
             LIMIT 1`,
            [studentId]
        );

        if (existing?.[0] && existing[0].status === 'pending') {
            return;
        }

        const [studentDetailsRows] = await conn.execute(
            'SELECT university, major, graduation_year FROM students WHERE id = ? LIMIT 1',
            [studentId]
        );
        const studentDetails = studentDetailsRows?.[0] || {};
        const documents = Array.isArray(payload.documents) ? payload.documents : [];
        await conn.execute(
            `INSERT INTO student_verifications
             (student_id, user_id, status, documents, notes, student_name, university, major, graduation_year, contact_email)
             VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?)`,
            [
                studentId,
                userId,
                JSON.stringify(documents),
                payload.notes || null,
                payload.full_name || payload.name || null,
                payload.university || studentDetails.university || null,
                payload.major || studentDetails.major || null,
                payload.graduation_year || studentDetails.graduation_year || null,
                payload.email || null
            ]
        );
    } catch (error) {
        if (error && error.code === 'ER_NO_SUCH_TABLE') {
            return;
        }
        throw error;
    }
};

const upsertUserSkill = async (conn, userId, skillId, level) => {
    try {
        await conn.execute(
            `INSERT INTO user_skills (user_id, skill_id, proficiency)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE proficiency = VALUES(proficiency)`,
            [userId, skillId, level]
        );
    } catch (error) {
        if (!isBadFieldError(error)) throw error;

        // FIXED: fallback for legacy user_skills schema with skill_level.
        await conn.execute(
            `INSERT INTO user_skills (user_id, skill_id, skill_level)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE skill_level = VALUES(skill_level)`,
            [userId, skillId, level]
        );
    }
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
        const passwordMessage = validatePasswordStrength(password);
        if (passwordMessage) {
            return res.status(400).json({ message: passwordMessage });
        }

        const existingUser = await getUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        conn = await db.pool.getConnection();
        await conn.beginTransaction();

        const hashedPassword = await bcrypt.hash(password, 10);
        const normalizedRole = normalizeRole(role);

        const userResult = await insertUser(conn, {
            email,
            hashedPassword,
            fullName: full_name,
            role: normalizedRole
        });

        const userId = userResult.insertId;

        if (normalizedRole === 'student') {
            const validationMessage = validateStudentRegistration(req.body, { requireSkills: false });
            if (validationMessage) {
                await conn.rollback();
                return res.status(400).json({ message: validationMessage });
            }
            await updateUserProfileExtras(conn, userId, req.body);
            await createStudentProfile(conn, userId, req.body);
            await createStudentVerificationRequest(conn, userId, req.body);
        } else if (normalizedRole === 'company') {
            await createCompanyProfile(conn, userId, req.body);
            await createCompanyVerificationRequest(conn, userId, req.body);
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
        if (error?.message === 'Company name already exists') {
            return res.status(400).json({ message: 'Company name already exists' });
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
        const passwordMessage = validatePasswordStrength(password);
        if (passwordMessage) {
            return res.status(400).json({ message: passwordMessage });
        }

        const validationMessage = validateStudentRegistration(req.body, { requireSkills: true });
        if (validationMessage) {
            return res.status(400).json({ message: validationMessage });
        }

        const existingUser = await getUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        conn = await db.pool.getConnection();
        await conn.beginTransaction();

        const hashedPassword = await bcrypt.hash(password, 10);

        const userResult = await insertUser(conn, {
            email,
            hashedPassword,
            fullName: full_name,
            role: 'student'
        });

        const userId = userResult.insertId;
        await updateUserProfileExtras(conn, userId, req.body);
        await createStudentProfile(conn, userId, req.body);
        await createStudentVerificationRequest(conn, userId, req.body);

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

                await upsertUserSkill(
                    conn,
                    userId,
                    skillId,
                    normalizeSkillLevel(skill.proficiency || skill.skill_level)
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
        const passwordMessage = validatePasswordStrength(password);
        if (passwordMessage) {
            return res.status(400).json({ message: passwordMessage });
        }

        const existingUser = await getUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        conn = await db.pool.getConnection();
        await conn.beginTransaction();

        const hashedPassword = await bcrypt.hash(password, 10);

        const userResult = await insertUser(conn, {
            email,
            hashedPassword,
            fullName: full_name,
            role: 'company'
        });

        const userId = userResult.insertId;
        await createCompanyProfile(conn, userId, req.body);
        await createCompanyVerificationRequest(conn, userId, req.body);

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
        if (error?.message === 'Company name already exists') {
            return res.status(400).json({ message: 'Company name already exists' });
        }
        console.error('Company registration error:', error);
        return res.status(500).json({ message: 'Server error' });
    } finally {
        if (conn) conn.release();
    }
};

const registerAdmin = async (req, res) => {
    let conn;
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
        const passwordMessage = validatePasswordStrength(password);
        if (passwordMessage) {
            return res.status(400).json({ message: passwordMessage });
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

        conn = await db.pool.getConnection();
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await insertUser(conn, {
            email,
            hashedPassword,
            fullName: full_name,
            role: 'admin'
        });

        const response = buildAuthResponse(result.insertId, email, full_name, 'admin');
        return res.status(201).json({
            message: 'Admin registered successfully',
            ...response
        });
    } catch (error) {
        console.error('Admin registration error:', error);
        return res.status(500).json({ message: 'Server error' });
    } finally {
        if (conn) conn.release();
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
            return res.status(401).json({ message: "We couldn't find an account with that email." });
        }

        if (!user.password) {
            return res.status(401).json({ message: 'Incorrect password. Please try again.' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Incorrect password. Please try again.' });
        }

        try {
            await ensureRoleProfile(user.role, user.id, user);
        } catch (error) {
            console.error('Login role/profile validation error:', error);
            return res.status(403).json({ message: 'Account role is not properly configured.' });
        }

        await recordUserLogin(user.id);

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
            try {
                await ensureRoleProfile(existingUser.role, existingUser.id, {
                    ...req.body,
                    full_name: existingUser.full_name,
                    company_name: companyName || req.body.company_name,
                    location
                });
            } catch (error) {
                console.error('Social login role/profile validation error:', error);
                return res.status(403).json({ message: 'Account role is not properly configured.' });
            }

            await recordUserLogin(existingUser.id);

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

        const userResult = await insertUser(conn, {
            email,
            hashedPassword,
            fullName: normalizedName,
            role: normalizedRole,
            googleId: provider === 'google' ? `google:${email}` : null
        });

        const userId = userResult.insertId;

        if (normalizedRole === 'student') {
            await createStudentProfile(conn, userId, req.body);
            await createStudentVerificationRequest(conn, userId, req.body);
        } else if (normalizedRole === 'company') {
            await createCompanyProfile(conn, userId, {
                ...req.body,
                company_name: companyName || req.body.company_name,
                location
            });
            await createCompanyVerificationRequest(conn, userId, {
                ...req.body,
                company_name: companyName || req.body.company_name,
                location
            });
        }

        await conn.commit();

        await recordUserLogin(userId);

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
        try {
            await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, decoded.userId]);
        } catch (error) {
            if (!isBadFieldError(error)) throw error;
            await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [hashedPassword, decoded.userId]);
        }

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

        await touchUserActivity(req.user.userId);

        const users = await db.query('SELECT * FROM users WHERE id = ? LIMIT 1', [req.user.userId]);

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = normalizeUserRecord(users[0]);

        if (user.role === 'student') {
            let students = [];
            try {
                students = await db.query(
                    `SELECT
                        id,
                        NULL AS phone,
                        date_of_birth AS dob,
                        NULL AS address,
                        current_education_level AS education,
                        university,
                        graduation_year,
                        NULL AS bio,
                        resume_url AS cv_url,
                        gender,
                        nationality,
                        major,
                        gpa,
                        linkedin_url,
                        portfolio_url,
                        is_available
                     FROM students
                     WHERE user_id = ?
                     LIMIT 1`,
                    [user.id]
                );
            } catch (error) {
                if (!isBadFieldError(error)) throw error;
                students = await db.query(
                    'SELECT id, phone, dob, address, education, university, graduation_year, bio, cv_url FROM students WHERE user_id = ? LIMIT 1',
                    [user.id]
                );
            }
            if (students.length > 0) {
                user.student_profile = students[0];
            }
        } else if (user.role === 'company') {
            let companies = [];
            try {
                companies = await db.query(
                    `SELECT
                        id,
                        name AS company_name,
                        logo,
                        description,
                        industry,
                        headquarters AS location,
                        website,
                        NULL AS contact_person,
                        NULL AS contact_phone,
                        NULL AS rating,
                        company_size,
                        founded_year,
                        is_verified
                     FROM companies
                     WHERE user_id = ?
                     LIMIT 1`,
                    [user.id]
                );
            } catch (error) {
                if (!isBadFieldError(error)) throw error;
                companies = await db.query(
                    'SELECT id, company_name, logo, description, industry, location, website, contact_person, contact_phone, rating FROM companies WHERE user_id = ? LIMIT 1',
                    [user.id]
                );
            }
            if (companies.length > 0) {
                user.company_profile = companies[0];
                if (!user.profile_image && user.company_profile.logo) {
                    user.profile_image = user.company_profile.logo;
                }
            }
        }

        return res.json({ user });
    } catch (error) {
        console.error('Get current user error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const getSkills = async (req, res) => {
    try {
        const search = String(req.query.search || '').trim();
        const limitRaw = Number.parseInt(req.query.limit, 10);
        const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 100) : 60;

        let sql = 'SELECT id, name, category FROM skills WHERE is_active = 1';
        const params = [];

        if (search) {
            sql += ' AND (name LIKE ? OR category LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        sql += ' ORDER BY name ASC LIMIT ?';
        params.push(limit);

        let rows;
        try {
            rows = await db.query(sql, params);
        } catch (error) {
            if (!isBadFieldError(error)) throw error;

            // FIXED: fallback for skills table without is_active.
            let fallbackSql = 'SELECT id, name, category FROM skills WHERE 1=1';
            const fallbackParams = [];
            if (search) {
                fallbackSql += ' AND (name LIKE ? OR category LIKE ?)';
                fallbackParams.push(`%${search}%`, `%${search}%`);
            }
            fallbackSql += ' ORDER BY name ASC LIMIT ?';
            fallbackParams.push(limit);
            rows = await db.query(fallbackSql, fallbackParams);
        }

        return res.json({ skills: rows });
    } catch (error) {
        console.error('Get skills error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const oauthCallback = async (req, res) => {
    try {
        const user = req.user;
        let role = user.role || DEFAULT_ROLE;
        let extraInfo = {};

        if (req.query.state) {
            try {
                extraInfo = JSON.parse(req.query.state);
                if (extraInfo.role) {
                    role = normalizeRole(extraInfo.role);
                }
            } catch (e) {
                console.error('Error parsing state in OAuth callback:', e);
            }
        }

        // Update user role if it was explicitly provided during registration and user doesn't have a specific role yet
        if (extraInfo.role && (!user.role || user.role === DEFAULT_ROLE)) {
            try {
                await db.query('UPDATE users SET role = ? WHERE id = ?', [role, user.id]);
                user.role = role;
            } catch (err) {
                console.error('Error updating user role in OAuth callback:', err);
            }
        }

        // Ensure the profile exists
        try {
            await ensureRoleProfile(role, user.id, {
                ...extraInfo,
                full_name: user.full_name || user.name || 'Social User'
            });
        } catch (err) {
            console.error('Error ensuring role profile in OAuth callback:', err);
        }

        await recordUserLogin(user.id);

        const token = createToken({ userId: user.id, email: user.email, role: user.role || role });
        
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const redirectParams = new URLSearchParams({ token });

        if (extraInfo?.role) {
            redirectParams.set('register', '1');
            redirectParams.set('role', role);
            if (extraInfo.provider) {
                redirectParams.set('provider', String(extraInfo.provider));
            }
            if (extraInfo.company_name) {
                redirectParams.set('company_name', String(extraInfo.company_name));
            }
            if (extraInfo.location) {
                redirectParams.set('location', String(extraInfo.location));
            }
        }

        res.redirect(`${frontendUrl}/login?${redirectParams.toString()}`);
    } catch (error) {
        console.error('OAuth callback error:', error);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/login?error=auth_failed`);
    }
};

module.exports = {
    register,
    registerStudentComplete,
    registerCompanyComplete,
    registerAdmin,
    login,
    socialLogin,
    oauthCallback,
    forgotPassword,
    resetPassword,
    getCurrentUser,
    getSkills
};

