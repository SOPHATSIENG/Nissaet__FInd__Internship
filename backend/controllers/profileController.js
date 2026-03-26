const bcrypt = require('bcryptjs');
const db = require('../config/db');

const VALID_SKILL_LEVELS = new Set(['beginner', 'intermediate', 'advanced', 'expert']);
const VALID_NOTIFICATION_FREQUENCIES = new Set(['Instant', 'Daily', 'Weekly']);

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

const toBoolean = (value, fallback = false) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
        if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
    }
    return fallback;
};

const updateCompanyProfile = async (userId, updates) => {
    if (updates?.name || updates?.company_name) {
        const proposedName = String(updates.name || updates.company_name || '').trim().replace(/\s+/g, ' ');
        if (proposedName) {
            const checkDuplicates = async (sql, params) => {
                const rows = await db.query(sql, params);
                if (rows?.length) {
                    throw new Error('Company name already exists');
                }
            };
            try {
                const columns = await db.query(
                    `SELECT COLUMN_NAME
                     FROM INFORMATION_SCHEMA.COLUMNS
                     WHERE TABLE_SCHEMA = DATABASE()
                       AND TABLE_NAME = 'companies'`
                );
                const columnSet = new Set((columns || []).map((row) => row.COLUMN_NAME));
                const clauses = [];
                const params = [];
                if (columnSet.has('name')) {
                    clauses.push('LOWER(TRIM(name)) = LOWER(?)');
                    params.push(proposedName);
                }
                if (columnSet.has('company_name')) {
                    clauses.push('LOWER(TRIM(company_name)) = LOWER(?)');
                    params.push(proposedName);
                }
                if (clauses.length > 0) {
                    await checkDuplicates(
                        `SELECT user_id FROM companies
                         WHERE (${clauses.join(' OR ')})
                           AND user_id <> ?
                         LIMIT 1`,
                        [...params, userId]
                    );
                }
            } catch (error) {
                if (error?.message === 'Company name already exists') throw error;
                try {
                    await checkDuplicates(
                        `SELECT user_id FROM companies
                         WHERE LOWER(TRIM(company_name)) = LOWER(?)
                           AND user_id <> ?
                         LIMIT 1`,
                        [proposedName, userId]
                    );
                } catch (fallbackError) {
                    if (fallbackError?.message === 'Company name already exists') throw fallbackError;
                    try {
                        await checkDuplicates(
                            `SELECT user_id FROM companies
                             WHERE LOWER(TRIM(name)) = LOWER(?)
                               AND user_id <> ?
                             LIMIT 1`,
                            [proposedName, userId]
                        );
                    } catch (fallbackError2) {
                        if (fallbackError2?.message === 'Company name already exists') throw fallbackError2;
                        throw error;
                    }
                }
            }
        }
    }
    if (updates?.logo && String(updates.logo).length > 255) {
        try {
            const columns = await db.query(
                `SELECT DATA_TYPE, CHARACTER_MAXIMUM_LENGTH AS max_len
                 FROM INFORMATION_SCHEMA.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE()
                   AND TABLE_NAME = 'companies'
                   AND COLUMN_NAME = 'logo'
                 LIMIT 1`
            );
            const column = columns?.[0];
            const dataType = String(column?.DATA_TYPE || '').toLowerCase();
            if (dataType && !['longtext', 'text', 'mediumtext'].includes(dataType)) {
                await db.query(`ALTER TABLE companies MODIFY COLUMN logo LONGTEXT`);
            }
        } catch (error) {
            console.warn('Could not ensure companies.logo is LONGTEXT:', error.message);
        }
    }
    const companyColumns = await getTableColumns('companies');
    const entries = Object.entries(updates).filter(([column, value]) => companyColumns.has(column) && value !== undefined);
    if (entries.length === 0) return;

    const existing = await db.query('SELECT id FROM companies WHERE user_id = ? LIMIT 1', [userId]);
    if (existing.length === 0) {
        const insertEntries = [['user_id', userId], ...entries];
        const insertSql = `INSERT INTO companies (${insertEntries.map(([column]) => column).join(', ')}) VALUES (${insertEntries.map(() => '?').join(', ')})`;
        await db.query(insertSql, insertEntries.map(([, value]) => value));
        return;
    }

    const sql = `UPDATE companies SET ${entries.map(([column]) => `${column} = ?`).join(', ')} WHERE user_id = ?`;
    await db.query(sql, [...entries.map(([, value]) => value), userId]);
};

const toNullableString = (value) => {
    if (value === null || value === undefined) return null;
    const normalized = String(value).trim();
    return normalized.length > 0 ? normalized : null;
};

const toDateInputValue = (value) => {
    if (!value) return '';
    if (typeof value === 'string') return value.slice(0, 10);

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 10);
};

const normalizeSkillLevel = (value) => {
    if (!value) return 'intermediate';
    const normalized = String(value).trim().toLowerCase();
    return VALID_SKILL_LEVELS.has(normalized) ? normalized : 'intermediate';
};

const getTableColumns = async (tableName, conn = null) => {
    const sql = `SHOW COLUMNS FROM ${tableName}`;
    const rows = conn ? (await conn.execute(sql))[0] : await db.query(sql);
    return new Set(rows.map((row) => row.Field));
};

const tableExists = async (tableName) => {
    try {
        const rows = await db.query('SHOW TABLES LIKE ?', [tableName]);
        return Array.isArray(rows) && rows.length > 0;
    } catch (error) {
        return false;
    }
};

const buildUpdateStatement = (tableName, updates, whereColumn, whereValue) => {
    const entries = Object.entries(updates).filter(([, value]) => value !== undefined);
    if (entries.length === 0) return null;

    const setClause = entries.map(([column]) => `${column} = ?`).join(', ');
    return {
        sql: `UPDATE ${tableName} SET ${setClause} WHERE ${whereColumn} = ?`,
        params: [...entries.map(([, value]) => value), whereValue]
    };
};

const upsertStudentProfile = async (userId, updates, conn = null) => {
    const executor = conn || db.pool;
    const query = conn ? (sql, params) => conn.execute(sql, params) : (sql, params) => db.query(sql, params);
    const studentColumns = await getTableColumns('students', conn);
    const updateEntries = Object.entries(updates).filter(([column, value]) => studentColumns.has(column) && value !== undefined);

    const [existingRows] = await executor.execute('SELECT id FROM students WHERE user_id = ? LIMIT 1', [userId]);

    if (existingRows.length > 0) {
        if (updateEntries.length === 0) {
            return existingRows[0].id;
        }

        const sql = `UPDATE students SET ${updateEntries.map(([column]) => `${column} = ?`).join(', ')} WHERE user_id = ?`;
        await query(
            sql,
            [...updateEntries.map(([, value]) => value), userId]
        );
        return existingRows[0].id;
    }

    const insertEntries = [['user_id', userId], ...updateEntries];
    const insertSql = `INSERT INTO students (${insertEntries.map(([column]) => column).join(', ')}) VALUES (${insertEntries.map(() => '?').join(', ')})`;
    const result = await query(insertSql, insertEntries.map(([, value]) => value));
    return result.insertId || (result[0] && result[0].insertId) || null;
};

const getUserSkills = async (userId) => {
    const userSkillColumns = await getTableColumns('user_skills');
    const levelColumn = userSkillColumns.has('proficiency') ? 'proficiency' : 'skill_level';
    const yearsExpr = userSkillColumns.has('years_experience') ? 'us.years_experience' : '0';
    const primaryExpr = userSkillColumns.has('is_primary') ? 'us.is_primary' : '0';

    const rows = await db.query(
        `SELECT
            us.skill_id AS id,
            s.name,
            s.category,
            us.${levelColumn} AS proficiency,
            ${yearsExpr} AS years_experience,
            ${primaryExpr} AS is_primary
         FROM user_skills us
         JOIN skills s ON us.skill_id = s.id
         WHERE us.user_id = ?
         ORDER BY s.name ASC`,
        [userId]
    );

    return rows.map((row) => ({
        id: row.id,
        name: row.name,
        category: row.category || '',
        proficiency: normalizeSkillLevel(row.proficiency),
        years_experience: Number(row.years_experience || 0),
        is_primary: toBoolean(row.is_primary, false)
    }));
};

const getProfileSettingsByUserId = async (userId) => {
    const users = await db.query('SELECT * FROM users WHERE id = ? LIMIT 1', [userId]);
    if (users.length === 0) return null;

    const user = users[0];
    const userColumns = await getTableColumns('users');
    const students = await db.query('SELECT * FROM students WHERE user_id = ? LIMIT 1', [userId]);
    const student = students[0] || null;
    const skills = await getUserSkills(userId);

    const fullName = user.full_name || user.name || '';
    const [firstName = '', ...lastNameParts] = fullName.trim().split(/\s+/).filter(Boolean);

    const personal = {
        full_name: fullName,
        first_name: firstName,
        last_name: lastNameParts.join(' '),
        email: user.email || '',
        phone: user.phone || '',
        dob: toDateInputValue(user.dob || (student && student.date_of_birth)),
        address: user.address || '',
        bio: user.bio || '',
        // FIX MARK: support both profile_image and profile columns for stored avatar image.
        profile_image:
            (userColumns.has('profile_image') ? user.profile_image : null) ||
            (userColumns.has('profile') ? user.profile : null) ||
            '',
        role: user.role || 'student'
    };

    const education = {
        student_id: (student && student.id) || null,
        education: (student && student.current_education_level) || user.education || '',
        university: (student && student.university) || user.university || '',
        major: (student && student.major) || '',
        graduation_year: (student && student.graduation_year) || user.graduation_year || '',
        gpa: (student && student.gpa) || '',
        resume_url: (student && student.resume_url) || user.cv_url || '',
        linkedin_url: (student && student.linkedin_url) || '',
        portfolio_url: (student && student.portfolio_url) || '',
        is_available: student ? toBoolean(student.is_available, true) : true
    };

    const notifications = {
        internship_matches_email: userColumns.has('notify_internship_matches_email')
            ? toBoolean(user.notify_internship_matches_email, true)
            : true,
        internship_matches_in_app: userColumns.has('notify_internship_matches_in_app')
            ? toBoolean(user.notify_internship_matches_in_app, true)
            : true,
        application_status_email: userColumns.has('notify_application_status_email')
            ? toBoolean(user.notify_application_status_email, true)
            : true,
        application_status_in_app: userColumns.has('notify_application_status_in_app')
            ? toBoolean(user.notify_application_status_in_app, true)
            : true,
        career_tips_email: userColumns.has('notify_career_tips_email')
            ? toBoolean(user.notify_career_tips_email, false)
            : false,
        career_tips_in_app: userColumns.has('notify_career_tips_in_app')
            ? toBoolean(user.notify_career_tips_in_app, false)
            : false,
        frequency: userColumns.has('notify_frequency') && VALID_NOTIFICATION_FREQUENCIES.has(user.notify_frequency)
            ? user.notify_frequency
            : 'Daily'
    };

    const security = {
        two_factor_enabled: userColumns.has('two_factor_enabled')
            ? toBoolean(user.two_factor_enabled, false)
            : false
    };

    return {
        personal,
        education,
        skills,
        notifications,
        security
    };
};

const getAuthenticatedUserId = (req) => {
    return req.user && req.user.userId ? Number(req.user.userId) : null;
};

const getSettings = async (req, res) => {
    try {
        const userId = getAuthenticatedUserId(req);
        if (!userId) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const settings = await getProfileSettingsByUserId(userId);
        if (!settings) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.json({ settings });
    } catch (error) {
        console.error('Get profile settings error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const updatePersonalSettings = async (req, res) => {
    try {
        const userId = getAuthenticatedUserId(req);
        if (!userId) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const userColumns = await getTableColumns('users');
        const fullName = toNullableString(req.body.full_name);
        const dob = toNullableString(req.body.dob);

        const userUpdates = {};
        if (fullName) {
            // FIX MARK: support both full_name and legacy name columns so profile save works across schemas.
            if (userColumns.has('full_name')) {
                userUpdates.full_name = fullName;
            } else if (userColumns.has('name')) {
                userUpdates.name = fullName;
            }
        }
        if (hasOwn(req.body, 'phone') && userColumns.has('phone')) userUpdates.phone = toNullableString(req.body.phone);
        if (hasOwn(req.body, 'dob') && userColumns.has('dob')) userUpdates.dob = dob;
        if (hasOwn(req.body, 'address') && userColumns.has('address')) userUpdates.address = toNullableString(req.body.address);
        if (hasOwn(req.body, 'bio') && userColumns.has('bio')) userUpdates.bio = toNullableString(req.body.bio);
        if (hasOwn(req.body, 'profile_image')) {
            const normalizedProfileImage = toNullableString(req.body.profile_image);
            // FIX MARK: write uploaded avatar into both profile_image and profile (if columns exist).
            if (userColumns.has('profile_image')) {
                userUpdates.profile_image = normalizedProfileImage;
            }
            if (userColumns.has('profile')) {
                userUpdates.profile = normalizedProfileImage;
            }
        }

        const userUpdateStatement = buildUpdateStatement('users', userUpdates, 'id', userId);
        if (userUpdateStatement) {
            await db.query(userUpdateStatement.sql, userUpdateStatement.params);
        }

        await upsertStudentProfile(userId, {
            date_of_birth: dob
        });

        const settings = await getProfileSettingsByUserId(userId);
        return res.json({
            message: 'Personal settings updated successfully',
            settings
        });
    } catch (error) {
        console.error('Update personal settings error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const updateEducationSettings = async (req, res) => {
    try {
        const userId = getAuthenticatedUserId(req);
        if (!userId) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const userColumns = await getTableColumns('users');
        const education = toNullableString(req.body.education);
        const university = toNullableString(req.body.university);
        const major = toNullableString(req.body.major);
        const resumeUrl = toNullableString(req.body.resume_url);
        const linkedinUrl = toNullableString(req.body.linkedin_url);
        const portfolioUrl = toNullableString(req.body.portfolio_url);

        const graduationYear =
            hasOwn(req.body, 'graduation_year') && String(req.body.graduation_year).trim() !== ''
                ? Number.parseInt(req.body.graduation_year, 10)
                : null;
        const gpa =
            hasOwn(req.body, 'gpa') && String(req.body.gpa).trim() !== ''
                ? Number.parseFloat(req.body.gpa)
                : null;

        const userUpdates = {};
        if (hasOwn(req.body, 'education') && userColumns.has('education')) userUpdates.education = education;
        if (hasOwn(req.body, 'university') && userColumns.has('university')) userUpdates.university = university;
        if (hasOwn(req.body, 'graduation_year') && userColumns.has('graduation_year')) {
            userUpdates.graduation_year = Number.isNaN(graduationYear) ? null : graduationYear;
        }
        if (hasOwn(req.body, 'resume_url') && userColumns.has('cv_url')) userUpdates.cv_url = resumeUrl;

        const userUpdateStatement = buildUpdateStatement('users', userUpdates, 'id', userId);
        if (userUpdateStatement) {
            await db.query(userUpdateStatement.sql, userUpdateStatement.params);
        }

        await upsertStudentProfile(userId, {
            current_education_level: education,
            university,
            major,
            graduation_year: Number.isNaN(graduationYear) ? null : graduationYear,
            gpa: Number.isNaN(gpa) ? null : gpa,
            resume_url: resumeUrl,
            linkedin_url: linkedinUrl,
            portfolio_url: portfolioUrl,
            is_available: hasOwn(req.body, 'is_available') ? (toBoolean(req.body.is_available, true) ? 1 : 0) : undefined
        });

        const settings = await getProfileSettingsByUserId(userId);
        return res.json({
            message: 'Education settings updated successfully',
            settings
        });
    } catch (error) {
        console.error('Update education settings error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const updateSkillsSettings = async (req, res) => {
    let conn;
    try {
        const userId = getAuthenticatedUserId(req);
        if (!userId) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const skills = Array.isArray(req.body.skills) ? req.body.skills : null;
        if (!skills) {
            return res.status(400).json({ message: 'skills must be an array' });
        }

        conn = await db.pool.getConnection();
        await conn.beginTransaction();

        const skillColumns = await getTableColumns('skills', conn);
        const userSkillColumns = await getTableColumns('user_skills', conn);
        const levelColumn = userSkillColumns.has('proficiency') ? 'proficiency' : 'skill_level';
        const hasYearsExperience = userSkillColumns.has('years_experience');
        const hasPrimaryFlag = userSkillColumns.has('is_primary');

        await conn.execute('DELETE FROM user_skills WHERE user_id = ?', [userId]);

        const insertedSkillKeys = new Set();
        for (const skill of skills) {
            if (!skill || typeof skill !== 'object') continue;

            const providedName = toNullableString(skill.name);
            const providedId = Number.parseInt(skill.id, 10);
            const skillCategory = toNullableString(skill.category) || 'general';
            const skillProficiency = normalizeSkillLevel(skill.proficiency);
            const yearsExperience = Number.isFinite(Number(skill.years_experience))
                ? Math.max(0, Number.parseInt(skill.years_experience, 10))
                : 0;
            const isPrimary = toBoolean(skill.is_primary, false);

            let skillId = Number.isNaN(providedId) ? null : providedId;

            if (!skillId && providedName) {
                const [existingSkillRows] = await conn.execute(
                    'SELECT id FROM skills WHERE LOWER(name) = LOWER(?) LIMIT 1',
                    [providedName]
                );
                if (existingSkillRows.length > 0) {
                    skillId = existingSkillRows[0].id;
                } else if (skillColumns.has('category')) {
                    const [insertSkillResult] = await conn.execute(
                        'INSERT INTO skills (name, category) VALUES (?, ?)',
                        [providedName, skillCategory]
                    );
                    skillId = insertSkillResult.insertId;
                } else {
                    const [insertSkillResult] = await conn.execute(
                        'INSERT INTO skills (name) VALUES (?)',
                        [providedName]
                    );
                    skillId = insertSkillResult.insertId;
                }
            }

            if (!skillId) continue;

            const dedupeKey = String(skillId);
            if (insertedSkillKeys.has(dedupeKey)) continue;
            insertedSkillKeys.add(dedupeKey);

            const columns = ['user_id', 'skill_id', levelColumn];
            const params = [userId, skillId, skillProficiency];

            if (hasYearsExperience) {
                columns.push('years_experience');
                params.push(yearsExperience);
            }
            if (hasPrimaryFlag) {
                columns.push('is_primary');
                params.push(isPrimary ? 1 : 0);
            }

            await conn.execute(
                `INSERT INTO user_skills (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`,
                params
            );
        }

        await conn.commit();

        const settings = await getProfileSettingsByUserId(userId);
        return res.json({
            message: 'Skills updated successfully',
            settings
        });
    } catch (error) {
        if (conn) {
            await conn.rollback();
        }
        console.error('Update skills settings error:', error);
        return res.status(500).json({ message: 'Server error' });
    } finally {
        if (conn) conn.release();
    }
};

const updateNotificationSettings = async (req, res) => {
    try {
        const userId = getAuthenticatedUserId(req);
        if (!userId) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const userColumns = await getTableColumns('users');
        const updates = {};

        if (hasOwn(req.body, 'internship_matches_email') && userColumns.has('notify_internship_matches_email')) {
            updates.notify_internship_matches_email = toBoolean(req.body.internship_matches_email, true) ? 1 : 0;
        }
        if (hasOwn(req.body, 'internship_matches_in_app') && userColumns.has('notify_internship_matches_in_app')) {
            updates.notify_internship_matches_in_app = toBoolean(req.body.internship_matches_in_app, true) ? 1 : 0;
        }
        if (hasOwn(req.body, 'application_status_email') && userColumns.has('notify_application_status_email')) {
            updates.notify_application_status_email = toBoolean(req.body.application_status_email, true) ? 1 : 0;
        }
        if (hasOwn(req.body, 'application_status_in_app') && userColumns.has('notify_application_status_in_app')) {
            updates.notify_application_status_in_app = toBoolean(req.body.application_status_in_app, true) ? 1 : 0;
        }
        if (hasOwn(req.body, 'career_tips_email') && userColumns.has('notify_career_tips_email')) {
            updates.notify_career_tips_email = toBoolean(req.body.career_tips_email, false) ? 1 : 0;
        }
        if (hasOwn(req.body, 'career_tips_in_app') && userColumns.has('notify_career_tips_in_app')) {
            updates.notify_career_tips_in_app = toBoolean(req.body.career_tips_in_app, false) ? 1 : 0;
        }
        if (hasOwn(req.body, 'frequency') && userColumns.has('notify_frequency')) {
            updates.notify_frequency = VALID_NOTIFICATION_FREQUENCIES.has(req.body.frequency)
                ? req.body.frequency
                : 'Daily';
        }

        const statement = buildUpdateStatement('users', updates, 'id', userId);
        if (statement) {
            await db.query(statement.sql, statement.params);
        }

        const settings = await getProfileSettingsByUserId(userId);
        return res.json({
            message: 'Notification settings updated successfully',
            settings
        });
    } catch (error) {
        console.error('Update notification settings error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const getCompanyBilling = async (req, res) => {
    try {
        const userId = getAuthenticatedUserId(req);
        if (!userId) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        const users = await db.query('SELECT id, role FROM users WHERE id = ? LIMIT 1', [userId]);
        if (!users.length) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (users[0].role !== 'company') {
            return res.status(403).json({ message: 'Company access required' });
        }

        const companies = await db.query('SELECT * FROM companies WHERE user_id = ? LIMIT 1', [userId]);
        const company = companies[0] || null;
        const companyColumns = await getTableColumns('companies');

        const pickValue = (obj, keys) => {
            for (const key of keys) {
                if (obj && Object.prototype.hasOwnProperty.call(obj, key)) {
                    const value = obj[key];
                    if (value !== undefined && value !== null && String(value).trim() !== '') {
                        return value;
                    }
                }
            }
            return null;
        };

        const plan = {
            name: pickValue(company, ['plan_name', 'subscription_plan', 'plan']),
            status: pickValue(company, ['plan_status', 'subscription_status']),
            billing_cycle: pickValue(company, ['billing_cycle', 'plan_cycle']),
            next_payment_date: pickValue(company, ['next_payment_date', 'next_billing_date']),
            amount: pickValue(company, ['billing_amount', 'plan_amount']),
            currency: pickValue(company, ['billing_currency', 'currency'])
        };

        const paymentMethod = {
            brand: pickValue(company, ['payment_brand', 'card_brand']),
            last4: pickValue(company, ['payment_last4', 'card_last4']),
            exp_month: pickValue(company, ['payment_exp_month', 'card_exp_month']),
            exp_year: pickValue(company, ['payment_exp_year', 'card_exp_year'])
        };

        const history = [];
        if (await tableExists('billing_history')) {
            const historyColumns = await getTableColumns('billing_history');
            const companyKey = historyColumns.has('company_id') ? 'company_id' : historyColumns.has('user_id') ? 'user_id' : null;
            if (companyKey) {
                const rows = await db.query(
                    `SELECT * FROM billing_history WHERE ${companyKey} = ? ORDER BY created_at DESC LIMIT 20`,
                    [company && company.id ? company.id : userId]
                );
                for (const row of rows) {
                    history.push({
                        date: row.paid_at || row.created_at || row.date || null,
                        description: row.description || row.title || row.plan_name || 'Billing',
                        amount: row.amount || row.total || null,
                        status: row.status || 'Paid',
                        invoice_url: row.invoice_url || row.invoice || null
                    });
                }
            }
        }

        return res.json({
            company: {
                name: pickValue(company, ['company_name', 'name']) || null,
                is_verified: companyColumns.has('is_verified') ? toBoolean(company?.is_verified, false) : false
            },
            plan,
            payment_method: paymentMethod,
            history
        });
    } catch (error) {
        console.error('Get company billing error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const getNotificationCard = async (req, res) => {
    try {
        const userId = getAuthenticatedUserId(req);
        if (!userId) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        // Do not auto-mark notifications as read on fetch.

        let rows = [];
        try {
            rows = await db.query(
                `SELECT
                    id,
                    title,
                    message,
                    type,
                    COALESCE(is_read, 0) AS is_read,
                    action_url,
                    created_at
                 FROM notifications
                 WHERE user_id = ?
                 ORDER BY created_at DESC
                 LIMIT 10`,
                [userId]
            );
        } catch (error) {
            if (!error || error.code !== 'ER_BAD_FIELD_ERROR') throw error;
            rows = await db.query(
                `SELECT
                    id,
                    title,
                    message,
                    COALESCE(is_read, 0) AS is_read,
                    created_at
                 FROM notifications
                 WHERE user_id = ?
                 ORDER BY created_at DESC
                 LIMIT 10`,
                [userId]
            );
        }

        let unreadCount = 0;
        try {
            const countRows = await db.query(
                `SELECT COUNT(*) AS total
                 FROM notifications
                 WHERE user_id = ? AND (is_read = 0 OR is_read IS NULL)`,
                [userId]
            );
            unreadCount = Number(countRows?.[0]?.total || 0);
        } catch (error) {
            if (error && error.code === 'ER_BAD_FIELD_ERROR') {
                unreadCount = rows.filter((row) => !toBoolean(row.is_read, false)).length;
            } else {
                throw error;
            }
        }

        return res.json({
            notifications: rows.map((row) => ({
                id: row.id,
                title: row.title || 'Notification',
                message: row.message || '',
                type: row.type || 'system',
                is_read: toBoolean(row.is_read, false),
                action_url: row.action_url || null,
                created_at: row.created_at
            })),
            unread_count: unreadCount
        });
    } catch (error) {
        console.error('Get notification card error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const markNotificationsRead = async (req, res) => {
    try {
        const userId = getAuthenticatedUserId(req);
        if (!userId) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const { ids, all } = req.body || {};
        if (all === true) {
            await db.query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [userId]);
            return res.json({ success: true });
        }

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'Notification ids are required' });
        }

        await db.query(
            `UPDATE notifications SET is_read = 1 WHERE user_id = ? AND id IN (${ids.map(() => '?').join(',')})`,
            [userId, ...ids]
        );

        return res.json({ success: true });
    } catch (error) {
        console.error('Mark notifications read error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const deleteNotification = async (req, res) => {
    try {
        const userId = getAuthenticatedUserId(req);
        if (!userId) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const { id } = req.params;
        const [result] = await db.queryRaw('DELETE FROM notifications WHERE id = ? AND user_id = ?', [id, userId]);
        if (!result.affectedRows) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        return res.json({ success: true });
    } catch (error) {
        console.error('Delete notification error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const clearNotifications = async (req, res) => {
    try {
        const userId = getAuthenticatedUserId(req);
        if (!userId) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        await db.query('DELETE FROM notifications WHERE user_id = ?', [userId]);
        return res.json({ success: true });
    } catch (error) {
        console.error('Clear notifications error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const updateTwoFactorSettings = async (req, res) => {
    try {
        const userId = getAuthenticatedUserId(req);
        if (!userId) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const userColumns = await getTableColumns('users');
        if (!userColumns.has('two_factor_enabled')) {
            return res.status(400).json({ message: 'Two-factor settings are not available in current schema' });
        }

        const enabled = toBoolean(req.body.enabled, false);
        await db.query('UPDATE users SET two_factor_enabled = ? WHERE id = ?', [enabled ? 1 : 0, userId]);

        const settings = await getProfileSettingsByUserId(userId);
        return res.json({
            message: 'Two-factor settings updated successfully',
            settings
        });
    } catch (error) {
        console.error('Update two-factor settings error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const updatePassword = async (req, res) => {
    try {
        const userId = getAuthenticatedUserId(req);
        if (!userId) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const currentPassword = toNullableString(req.body.currentPassword);
        const newPassword = toNullableString(req.body.newPassword);

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current password and new password are required' });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ message: 'New password must be at least 8 characters' });
        }

        const users = await db.query('SELECT * FROM users WHERE id = ? LIMIT 1', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = users[0];
        const storedPasswordHash = user.password || user.password_hash;
        if (!storedPasswordHash) {
            return res.status(400).json({ message: 'Password login is not available for this account' });
        }

        const isValidCurrentPassword = await bcrypt.compare(currentPassword, storedPasswordHash);
        if (!isValidCurrentPassword) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        const newHash = await bcrypt.hash(newPassword, 10);
        if (Object.prototype.hasOwnProperty.call(user, 'password')) {
            await db.query('UPDATE users SET password = ? WHERE id = ?', [newHash, userId]);
        } else if (Object.prototype.hasOwnProperty.call(user, 'password_hash')) {
            await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, userId]);
        } else {
            return res.status(400).json({ message: 'Password column is not available in current schema' });
        }

        return res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Update password error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const updateCompanySettings = async (req, res) => {
    try {
        const userId = getAuthenticatedUserId(req);
        if (!userId) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const users = await db.query('SELECT id, role FROM users WHERE id = ? LIMIT 1', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (users[0].role !== 'company') {
            return res.status(403).json({ message: 'Company access required' });
        }

        const name = toNullableString(req.body.company_name || req.body.name);
        const description = toNullableString(req.body.description);
        const industry = toNullableString(req.body.industry);
        const website = toNullableString(req.body.website);
        const location = toNullableString(req.body.location);
        const logo = toNullableString(req.body.logo);

        await updateCompanyProfile(userId, {
            name,
            description,
            industry,
            website,
            headquarters: location,
            logo,
        });

        if (logo) {
            const userColumns = await getTableColumns('users');
            if (userColumns.has('profile_image')) {
                await db.query('UPDATE users SET profile_image = ? WHERE id = ?', [logo, userId]);
            } else if (userColumns.has('profile')) {
                await db.query('UPDATE users SET profile = ? WHERE id = ?', [logo, userId]);
            }
        }

        const refreshed = await db.query(
            `SELECT
                id,
                name AS company_name,
                logo,
                description,
                industry,
                headquarters AS location,
                website,
                company_size,
                founded_year,
                is_verified
             FROM companies
             WHERE user_id = ?
             LIMIT 1`,
            [userId]
        );

        return res.json({
            message: 'Company settings updated successfully',
            company_profile: refreshed[0] || null,
        });
    } catch (error) {
        if (error?.message === 'Company name already exists') {
            return res.status(400).json({ message: 'Company name already exists' });
        }
        console.error('Update company settings error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const getPublicStudentProfile = async (req, res) => {
    try {
        const studentId = Number.parseInt(req.params.id, 10);
        if (Number.isNaN(studentId)) {
            return res.status(400).json({ message: 'Invalid student ID' });
        }

        const studentRows = await db.query(
            `SELECT
                s.id AS student_id,
                s.user_id,
                u.full_name,
                u.email,
                s.university,
                s.current_education_level AS education,
                s.major,
                s.graduation_year,
                s.gpa,
                s.resume_url,
                s.linkedin_url,
                s.portfolio_url,
                s.is_available,
                u.profile_image
             FROM students s
             JOIN users u ON s.user_id = u.id
             WHERE s.id = ? LIMIT 1`,
            [studentId]
        );

        if (studentRows.length === 0) {
            return res.status(404).json({ message: 'Student profile not found' });
        }

        const student = studentRows[0];
        student.is_available = toBoolean(student.is_available, true);

        // Get student skills
        const skills = await getUserSkills(student.user_id);

        return res.json({
            profile: {
                ...student,
                skills
            }
        });
    } catch (error) {
        console.error('Get public student profile error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getSettings,
    updatePersonalSettings,
    updateCompanySettings,
    updateEducationSettings,
    updateSkillsSettings,
    getNotificationCard,
    markNotificationsRead,
    deleteNotification,
    clearNotifications,
    updateNotificationSettings,
    getCompanyBilling,
    updateTwoFactorSettings,
    updatePassword,
    getPublicStudentProfile,
    getProfileSettingsByUserId
};
