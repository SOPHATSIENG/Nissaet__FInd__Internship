const db = require('../config/db');
const { getProfileSettingsByUserId } = require('./profileController');

const isBadFieldError = (error) => error && error.code === 'ER_BAD_FIELD_ERROR';

const parseJsonField = (value, fallback) => {
    if (value === null || value === undefined || value === '') return fallback;
    if (typeof value === 'object') return value;
    try {
        return JSON.parse(value);
    } catch (error) {
        return fallback;
    }
};

const defaultAdminSettings = {
    platformName: 'Internship Cambodia',
    supportEmail: 'support@internship.kh',
    seoDescription: 'The leading platform for finding internships and early career opportunities in Cambodia.',
    maintenanceMode: false,
    defaultLanguage: 'English (US)',
    timezone: '(GMT+07:00) Phnom Penh',
    brandLogo: null,
    brandFavicon: null,
    authMethods: {
        'Email & Password': true,
        'Google OAuth': true,
        'Microsoft Azure AD': false
    },
    bruteForceProtection: true,
    ipWhitelist: ['192.168.1.1', '10.0.0.45'],
    passwordMinLength: 8,
    sessionTimeoutMinutes: 60,
    emailTriggers: {
        'New User Registration': true,
        'Company Verification Request': true,
        'System Error Alerts': true,
        'Weekly Analytics Summary': false
    },
    slackWebhookUrl: '',
    pushNotifications: true,
    storage: {
        totalGb: 100,
        usedGb: 42.8,
        databaseGb: 12.4,
        mediaGb: 28.2,
        logsGb: 2.2
    },
    lastBackupAt: null,
    backupSchedule: 'Daily at 04:00 AM',
    dataRetentionDays: 90
};

const getAllUsers = async (req, res) => {
    try {
        const users = await db.query(`
            SELECT id, full_name as name, email, role,
            COALESCE(status, 'active') as status,
            DATE_FORMAT(created_at, '%b %d, %Y') as date,
            LEFT(full_name, 1) as initial,
            'bg-blue-100' as color
            FROM users
            ORDER BY created_at DESC
        `);
        res.json(users);
    } catch (error) {
        if (isBadFieldError(error)) {
            const users = await db.query(`
                SELECT id, full_name as name, email, role,
                'active' as status,
                DATE_FORMAT(created_at, '%b %d, %Y') as date,
                LEFT(full_name, 1) as initial,
                'bg-blue-100' as color
                FROM users
                ORDER BY created_at DESC
            `);
            return res.json(users);
        }
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

const toMysqlDateTime = (date) => {
    if (!(date instanceof Date)) return null;
    return date.toISOString().slice(0, 19).replace('T', ' ');
};

const normalizeDateRange = (range, start, end) => {
    const now = new Date();
    let endDate = end ? new Date(end) : now;
    if (Number.isNaN(endDate.getTime())) endDate = now;
    endDate.setHours(23, 59, 59, 999);

    let startDate;
    if (range === 'custom' && start) {
        startDate = new Date(start);
    } else {
        const days = range === '7d' ? 7 : range === '90d' ? 90 : 30;
        startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - (days - 1));
        startDate.setHours(0, 0, 0, 0);
    }

    if (Number.isNaN(startDate.getTime())) {
        startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 29);
        startDate.setHours(0, 0, 0, 0);
    }

    const rangeDays = Math.max(1, Math.round((endDate - startDate) / 86400000) + 1);
    return { startDate, endDate, rangeDays };
};

const getYearWeekNumber = (date) => {
    const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = target.getUTCDay() || 7;
    target.setUTCDate(target.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
    const weekNum = Math.ceil((((target - yearStart) / 86400000) + 1) / 7);
    return (target.getUTCFullYear() * 100) + weekNum;
};

const formatLabel = (date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const buildBuckets = (startDate, endDate, unit) => {
    const buckets = [];
    const cursor = new Date(startDate);
    cursor.setHours(0, 0, 0, 0);

    if (unit === 'day') {
        while (cursor <= endDate) {
            const key = cursor.toISOString().slice(0, 10);
            buckets.push({
                key,
                label: formatLabel(cursor),
                start: new Date(cursor),
                end: new Date(cursor)
            });
            cursor.setDate(cursor.getDate() + 1);
        }
        return buckets;
    }

    while (cursor <= endDate) {
        const weekStart = new Date(cursor);
        const weekEnd = new Date(cursor);
        weekEnd.setDate(weekEnd.getDate() + 6);
        if (weekEnd > endDate) weekEnd.setTime(endDate.getTime());
        buckets.push({
            key: getYearWeekNumber(weekStart),
            label: `${formatLabel(weekStart)} - ${formatLabel(weekEnd)}`,
            start: new Date(weekStart),
            end: new Date(weekEnd)
        });
        cursor.setDate(cursor.getDate() + 7);
    }

    return buckets;
};

const buildTrend = (current, previous) => {
    if (!previous) {
        return { trend: current > 0 ? 100 : 0, isUp: current >= previous };
    }
    const diff = ((current - previous) / previous) * 100;
    return { trend: Math.abs(diff), isUp: diff >= 0 };
};

const getReports = async (req, res) => {
    try {
        const { range = '30d', start, end } = req.query || {};
        const { startDate, endDate, rangeDays } = normalizeDateRange(range, start, end);
        const unit = rangeDays <= 31 ? 'day' : 'week';
        const startStr = toMysqlDateTime(startDate);
        const endStr = toMysqlDateTime(endDate);

        const prevEnd = new Date(startDate.getTime() - 1000);
        const prevStart = new Date(startDate);
        prevStart.setDate(prevStart.getDate() - rangeDays);
        const prevStartStr = toMysqlDateTime(prevStart);
        const prevEndStr = toMysqlDateTime(prevEnd);

        const studentTotalQuery = db.query(
            "SELECT COUNT(*) as count FROM users WHERE role = 'student' AND created_at BETWEEN ? AND ?",
            [startStr, endStr]
        );
        const companyTotalQuery = db.query(
            "SELECT COUNT(*) as count FROM companies WHERE created_at BETWEEN ? AND ?",
            [startStr, endStr]
        );
        const placementTotalQuery = db.query(
            "SELECT COUNT(*) as count FROM applications WHERE status = 'accepted' AND updated_at BETWEEN ? AND ?",
            [startStr, endStr]
        );

        const studentPrevQuery = db.query(
            "SELECT COUNT(*) as count FROM users WHERE role = 'student' AND created_at BETWEEN ? AND ?",
            [prevStartStr, prevEndStr]
        );
        const companyPrevQuery = db.query(
            "SELECT COUNT(*) as count FROM companies WHERE created_at BETWEEN ? AND ?",
            [prevStartStr, prevEndStr]
        );
        const placementPrevQuery = db.query(
            "SELECT COUNT(*) as count FROM applications WHERE status = 'accepted' AND updated_at BETWEEN ? AND ?",
            [prevStartStr, prevEndStr]
        );

        const unitField = unit === 'day' ? 'DATE' : 'YEARWEEK';
        const unitMode = unit === 'day' ? '' : ', 1';

        const studentTrendQuery = db.query(
            `SELECT ${unitField}(created_at${unitMode}) as period, COUNT(*) as count
             FROM users
             WHERE role = 'student' AND created_at BETWEEN ? AND ?
             GROUP BY period
             ORDER BY period ASC`,
            [startStr, endStr]
        );
        const companyTrendQuery = db.query(
            `SELECT ${unitField}(created_at${unitMode}) as period, COUNT(*) as count
             FROM companies
             WHERE created_at BETWEEN ? AND ?
             GROUP BY period
             ORDER BY period ASC`,
            [startStr, endStr]
        );
        const placementTrendQuery = db.query(
            `SELECT ${unitField}(updated_at${unitMode}) as period, COUNT(*) as count
             FROM applications
             WHERE status = 'accepted' AND updated_at BETWEEN ? AND ?
             GROUP BY period
             ORDER BY period ASC`,
            [startStr, endStr]
        );

        const [
            [studentTotal],
            [companyTotal],
            [placementTotal],
            [studentPrev],
            [companyPrev],
            [placementPrev],
            studentTrendRows,
            companyTrendRows,
            placementTrendRows
        ] = await Promise.all([
            studentTotalQuery,
            companyTotalQuery,
            placementTotalQuery,
            studentPrevQuery,
            companyPrevQuery,
            placementPrevQuery,
            studentTrendQuery,
            companyTrendQuery,
            placementTrendQuery
        ]);

        const buckets = buildBuckets(startDate, endDate, unit);
        const normalizePeriod = (value) => {
            if (unit === 'day') return value instanceof Date ? value.toISOString().slice(0, 10) : value;
            return Number(value);
        };

        const studentMap = new Map(studentTrendRows.map(row => [normalizePeriod(row.period), Number(row.count)]));
        const companyMap = new Map(companyTrendRows.map(row => [normalizePeriod(row.period), Number(row.count)]));
        const placementMap = new Map(placementTrendRows.map(row => [normalizePeriod(row.period), Number(row.count)]));

        const growth = buckets.map((bucket) => ({
            name: bucket.label,
            students: studentMap.get(bucket.key) || 0,
            companies: companyMap.get(bucket.key) || 0,
            placements: placementMap.get(bucket.key) || 0
        }));

        let industry = [];
        try {
            industry = await db.query(
                `SELECT COALESCE(c.industry, 'Other') AS name, COUNT(*) AS value
                 FROM applications a
                 JOIN internships i ON a.internship_id = i.id
                 JOIN companies c ON i.company_id = c.id
                 WHERE a.status = 'accepted' AND a.updated_at BETWEEN ? AND ?
                 GROUP BY name
                 ORDER BY value DESC
                 LIMIT 6`,
                [startStr, endStr]
            );
        } catch (error) {
            if (!isBadFieldError(error) && error?.code !== 'ER_NO_SUCH_TABLE') {
                console.error('Industry distribution query failed:', error);
            }
        }

        if (!industry || industry.length === 0) {
            try {
                industry = await db.query(
                    `SELECT COALESCE(c.industry, 'Other') AS name, COUNT(*) AS value
                     FROM internships i
                     JOIN companies c ON i.company_id = c.id
                     WHERE i.created_at BETWEEN ? AND ?
                     GROUP BY name
                     ORDER BY value DESC
                     LIMIT 6`,
                    [startStr, endStr]
                );
            } catch (error) {
                industry = [];
            }
        }

        let viewsCount = 0;
        try {
            const [views] = await db.query(
                `SELECT COUNT(*) AS count
                 FROM page_views
                 WHERE viewed_at BETWEEN ? AND ?
                 AND entity_type IN ('internship', 'company', 'profile')`,
                [startStr, endStr]
            );
            viewsCount = Number(views?.count || 0);
        } catch (error) {
            if (!isBadFieldError(error) && error?.code !== 'ER_NO_SUCH_TABLE') {
                console.error('Page views query failed:', error);
            }
        }

        if (viewsCount === 0) {
            try {
                const [viewsFallback] = await db.query(
                    `SELECT SUM(views_count) AS count
                     FROM internships
                     WHERE created_at BETWEEN ? AND ?`,
                    [startStr, endStr]
                );
                viewsCount = Number(viewsFallback?.count || 0);
            } catch (error) {
                viewsCount = 0;
            }
        }

        const [applicationTotal] = await db.query(
            "SELECT COUNT(*) as count FROM applications WHERE applied_at BETWEEN ? AND ?",
            [startStr, endStr]
        );
        const [interviewTotal] = await db.query(
            "SELECT COUNT(*) as count FROM applications WHERE status = 'reviewing' AND updated_at BETWEEN ? AND ?",
            [startStr, endStr]
        );

        const stats = {
            students: Number(studentTotal?.count || 0),
            companies: Number(companyTotal?.count || 0),
            placements: Number(placementTotal?.count || 0)
        };

        const studentTrend = buildTrend(stats.students, Number(studentPrev?.count || 0));
        const companyTrend = buildTrend(stats.companies, Number(companyPrev?.count || 0));
        const placementTrend = buildTrend(stats.placements, Number(placementPrev?.count || 0));

        return res.json({
            range: { start: startDate.toISOString(), end: endDate.toISOString(), unit },
            stats: {
                students: { value: stats.students, trend: studentTrend.trend, isUp: studentTrend.isUp },
                companies: { value: stats.companies, trend: companyTrend.trend, isUp: companyTrend.isUp },
                placements: { value: stats.placements, trend: placementTrend.trend, isUp: placementTrend.isUp }
            },
            growth,
            industry: industry.map(item => ({ name: item.name || 'Other', value: Number(item.value || 0) })),
            funnel: {
                views: viewsCount,
                applications: Number(applicationTotal?.count || 0),
                interviews: Number(interviewTotal?.count || 0),
                placements: stats.placements
            }
        });
    } catch (error) {
        console.error('Error fetching report data:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const normalizeDocuments = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        return [];
    }
};

const getCompanyVerifications = async (req, res) => {
    try {
        const rows = await db.query(
            `SELECT
                cv.id,
                cv.company_id,
                cv.user_id,
                cv.status,
                cv.documents,
                cv.notes,
                cv.rejection_reason,
                cv.submitted_at,
                cv.reviewed_at,
                cv.company_name,
                cv.industry,
                cv.website,
                cv.location,
                cv.contact_email,
                cv.contact_person,
                u.email AS user_email,
                u.full_name AS user_name,
                admin.full_name AS reviewed_by_name
             FROM company_verifications cv
             JOIN users u ON u.id = cv.user_id
             LEFT JOIN users admin ON admin.id = cv.reviewed_by
             ORDER BY cv.submitted_at DESC`
        );

        const normalized = rows.map(row => ({
            ...row,
            documents: normalizeDocuments(row.documents)
        }));

        return res.json(normalized);
    } catch (error) {
        if (error && error.code === 'ER_NO_SUCH_TABLE') {
            return res.json([]);
        }
        console.error('Error fetching company verifications:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateCompanyVerificationStatus = async (req, res) => {
    try {
        const verificationId = req.params.id;
        const { status, rejection_reason } = req.body || {};

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const [rows] = await db.queryRaw(
            `UPDATE company_verifications
             SET status = ?, rejection_reason = ?, reviewed_by = ?, reviewed_at = NOW()
             WHERE id = ?`,
            [status, rejection_reason || null, req.user.userId, verificationId]
        );

        if (rows.affectedRows === 0) {
            return res.status(404).json({ message: 'Verification request not found' });
        }

        const [verificationRows] = await db.queryRaw(
            'SELECT company_id FROM company_verifications WHERE id = ? LIMIT 1',
            [verificationId]
        );

        const companyId = verificationRows?.[0]?.company_id;
        if (companyId) {
            await db.queryRaw(
                'UPDATE companies SET is_verified = ? WHERE id = ?',
                [status === 'approved' ? 1 : 0, companyId]
            );

            try {
                const companyRows = await db.query(
                    'SELECT user_id, name AS company_name FROM companies WHERE id = ? LIMIT 1',
                    [companyId]
                );
                if (companyRows.length > 0) {
                    const companyUserId = companyRows[0].user_id;
                    const companyName = companyRows[0].company_name || 'your company';
                    const title = status === 'approved' ? 'Company verification approved' : 'Company verification rejected';
                    const message =
                        status === 'approved'
                            ? `Your company "${companyName}" has been approved by the admin.`
                            : `Your company "${companyName}" was rejected by the admin.${rejection_reason ? ` Reason: ${rejection_reason}` : ''}`;
                    await db.query(
                        `INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id, action_url)
                         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [
                            companyUserId,
                            title,
                            message,
                            'system',
                            'verification',
                            verificationId,
                            '/company/verification'
                        ]
                    );
                }
            } catch (notifyError) {
                console.error('Notification insert failed:', notifyError.message);
            }
        }

        return res.json({ message: 'Verification updated', status });
    } catch (error) {
        console.error('Error updating company verification:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getStudentVerifications = async (req, res) => {
    try {
        const rows = await db.query(
            `SELECT
                sv.id,
                sv.student_id,
                sv.user_id,
                sv.status,
                sv.documents,
                sv.notes,
                sv.rejection_reason,
                sv.submitted_at,
                sv.reviewed_at,
                sv.student_name,
                sv.university,
                sv.major,
                sv.graduation_year,
                sv.contact_email,
                u.email AS user_email,
                u.full_name AS user_name,
                admin.full_name AS reviewed_by_name
             FROM student_verifications sv
             JOIN users u ON u.id = sv.user_id
             LEFT JOIN users admin ON admin.id = sv.reviewed_by
             ORDER BY sv.submitted_at DESC`
        );

        const normalized = rows.map(row => ({
            ...row,
            documents: normalizeDocuments(row.documents)
        }));

        return res.json(normalized);
    } catch (error) {
        if (error && error.code === 'ER_NO_SUCH_TABLE') {
            return res.json([]);
        }
        console.error('Error fetching student verifications:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateStudentVerificationStatus = async (req, res) => {
    try {
        const verificationId = req.params.id;
        const { status, rejection_reason } = req.body || {};

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const [rows] = await db.queryRaw(
            `UPDATE student_verifications
             SET status = ?, rejection_reason = ?, reviewed_by = ?, reviewed_at = NOW()
             WHERE id = ?`,
            [status, rejection_reason || null, req.user.userId, verificationId]
        );

        if (rows.affectedRows === 0) {
            return res.status(404).json({ message: 'Verification request not found' });
        }

        return res.json({ message: 'Verification updated', status });
    } catch (error) {
        console.error('Error updating student verification:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        const [rows] = await db.queryRaw('DELETE FROM users WHERE id = ?', [userId]);
        if (rows.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.json({ message: 'User deleted' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getCategories = async (req, res) => {
    try {
        const rows = await db.query(`
            SELECT
                c.id,
                c.name,
                c.description,
                c.icon,
                c.color,
                c.is_active,
                c.created_at,
                c.updated_at,
                COUNT(i.id) AS listings_count
            FROM categories c
            LEFT JOIN companies co ON co.industry = c.name
            LEFT JOIN internships i ON i.company_id = co.id AND i.status = 'active'
            GROUP BY c.id, c.name, c.description, c.icon, c.color, c.is_active, c.created_at, c.updated_at
            ORDER BY c.name ASC
        `);

        return res.json({ success: true, categories: rows });
    } catch (error) {
        if (error && error.code === 'ER_NO_SUCH_TABLE') {
            return res.json({ success: true, categories: [] });
        }
        console.error('Error fetching categories:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const createCategory = async (req, res) => {
    try {
        const { name, description, icon, color, is_active } = req.body || {};
        if (!name) {
            return res.status(400).json({ message: 'Category name is required' });
        }

        const result = await db.query(
            `INSERT INTO categories (name, description, icon, color, is_active)
             VALUES (?, ?, ?, ?, ?)`,
            [
                name,
                description || null,
                icon || null,
                color || null,
                is_active === undefined ? 1 : (is_active ? 1 : 0)
            ]
        );

        const [created] = await db.query('SELECT * FROM categories WHERE id = ?', [result.insertId]);
        return res.status(201).json({ success: true, category: created });
    } catch (error) {
        if (error && error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Category name already exists' });
        }
        console.error('Error creating category:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, icon, color, is_active } = req.body || {};

        const updates = [];
        const params = [];

        if (name !== undefined) {
            updates.push('name = ?');
            params.push(name);
        }
        if (description !== undefined) {
            updates.push('description = ?');
            params.push(description || null);
        }
        if (icon !== undefined) {
            updates.push('icon = ?');
            params.push(icon || null);
        }
        if (color !== undefined) {
            updates.push('color = ?');
            params.push(color || null);
        }
        if (is_active !== undefined) {
            updates.push('is_active = ?');
            params.push(is_active ? 1 : 0);
        }

        if (updates.length === 0) {
            return res.status(400).json({ message: 'No fields to update' });
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        params.push(id);

        const [result] = await db.queryRaw(
            `UPDATE categories SET ${updates.join(', ')} WHERE id = ?`,
            params
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Category not found' });
        }

        const [updated] = await db.query('SELECT * FROM categories WHERE id = ?', [id]);
        return res.json({ success: true, category: updated });
    } catch (error) {
        if (error && error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Category name already exists' });
        }
        console.error('Error updating category:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.queryRaw('DELETE FROM categories WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Category not found' });
        }
        return res.json({ success: true, message: 'Category deleted' });
    } catch (error) {
        console.error('Error deleting category:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const getCategoryInternships = async (req, res) => {
    try {
        const { id } = req.params;
        const [category] = await db.query('SELECT id, name FROM categories WHERE id = ? LIMIT 1', [id]);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        const internships = await db.query(`
            SELECT
                i.*,
                c.name AS company_name,
                c.logo AS company_logo,
                c.industry AS company_industry,
                c.headquarters AS company_location,
                c.website AS company_website
            FROM internships i
            JOIN companies c ON i.company_id = c.id
            WHERE c.industry = ? AND i.status = 'active'
            ORDER BY i.created_at DESC
        `, [category.name]);

        return res.json({ success: true, category: category.name, internships });
    } catch (error) {
        if (error && error.code === 'ER_NO_SUCH_TABLE') {
            return res.json({ success: true, internships: [] });
        }
        console.error('Error fetching category internships:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const getSkills = async (req, res) => {
    try {
        const rows = await db.query(`
            SELECT
                s.id,
                s.name,
                s.description,
                s.category,
                s.is_active,
                s.created_at,
                s.updated_at,
                COUNT(isk.internship_id) AS usage_count
            FROM skills s
            LEFT JOIN internship_skills isk ON isk.skill_id = s.id
            GROUP BY s.id, s.name, s.description, s.category, s.is_active, s.created_at, s.updated_at
            ORDER BY s.name ASC
        `);

        const skills = rows.map((row) => {
            let popularity = 'Low';
            if (row.usage_count >= 10) popularity = 'High';
            else if (row.usage_count >= 5) popularity = 'Medium';
            return { ...row, popularity };
        });

        return res.json({ success: true, skills });
    } catch (error) {
        if (error && error.code === 'ER_NO_SUCH_TABLE') {
            return res.json({ success: true, skills: [] });
        }
        console.error('Error fetching skills:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const createSkill = async (req, res) => {
    try {
        const { name, description, category, is_active } = req.body || {};
        if (!name) {
            return res.status(400).json({ message: 'Skill name is required' });
        }

        const result = await db.query(
            `INSERT INTO skills (name, description, category, is_active)
             VALUES (?, ?, ?, ?)`,
            [
                name,
                description || null,
                category || null,
                is_active === undefined ? 1 : (is_active ? 1 : 0)
            ]
        );

        const [created] = await db.query('SELECT * FROM skills WHERE id = ?', [result.insertId]);
        return res.status(201).json({ success: true, skill: created });
    } catch (error) {
        if (error && error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Skill name already exists' });
        }
        console.error('Error creating skill:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const updateSkill = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, category, is_active } = req.body || {};

        const updates = [];
        const params = [];

        if (name !== undefined) {
            updates.push('name = ?');
            params.push(name);
        }
        if (description !== undefined) {
            updates.push('description = ?');
            params.push(description || null);
        }
        if (category !== undefined) {
            updates.push('category = ?');
            params.push(category || null);
        }
        if (is_active !== undefined) {
            updates.push('is_active = ?');
            params.push(is_active ? 1 : 0);
        }

        if (updates.length === 0) {
            return res.status(400).json({ message: 'No fields to update' });
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        params.push(id);

        const [result] = await db.queryRaw(
            `UPDATE skills SET ${updates.join(', ')} WHERE id = ?`,
            params
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Skill not found' });
        }

        const [updated] = await db.query('SELECT * FROM skills WHERE id = ?', [id]);
        return res.json({ success: true, skill: updated });
    } catch (error) {
        if (error && error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Skill name already exists' });
        }
        console.error('Error updating skill:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const deleteSkill = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.queryRaw('DELETE FROM skills WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Skill not found' });
        }
        return res.json({ success: true, message: 'Skill deleted' });
    } catch (error) {
        console.error('Error deleting skill:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const getSkillInternships = async (req, res) => {
    try {
        const { id } = req.params;
        const [skill] = await db.query('SELECT id, name FROM skills WHERE id = ? LIMIT 1', [id]);
        if (!skill) {
            return res.status(404).json({ message: 'Skill not found' });
        }

        const internships = await db.query(`
            SELECT
                i.id,
                i.title,
                i.location,
                i.type,
                i.status,
                i.created_at,
                c.name AS company_name
            FROM internship_skills isk
            JOIN internships i ON isk.internship_id = i.id
            JOIN companies c ON i.company_id = c.id
            WHERE isk.skill_id = ? AND i.status = 'active'
            ORDER BY i.created_at DESC
        `, [skill.id]);

        return res.json({ success: true, skill: skill.name, internships });
    } catch (error) {
        if (error && error.code === 'ER_NO_SUCH_TABLE') {
            return res.json({ success: true, internships: [] });
        }
        console.error('Error fetching skill internships:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const getInternshipByIdForAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const rows = await db.query(`
            SELECT
                i.*,
                c.name AS company_name
            FROM internships i
            JOIN companies c ON i.company_id = c.id
            WHERE i.id = ?
            LIMIT 1
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Internship not found' });
        }

        const internship = rows[0];

        try {
            const skills = await db.query(`
                SELECT s.id, s.name, s.category, isk.skill_level, isk.is_required
                FROM internship_skills isk
                JOIN skills s ON isk.skill_id = s.id
                WHERE isk.internship_id = ?
            `, [id]);
            internship.skills = skills;
        } catch (error) {
            internship.skills = [];
        }

        return res.json({ success: true, internship });
    } catch (error) {
        if (error && error.code === 'ER_NO_SUCH_TABLE') {
            return res.status(404).json({ message: 'Internship not found' });
        }
        console.error('Error fetching internship:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const updateInternshipForAdmin = async (req, res) => {
    try {
        const { id } = req.params;

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
            end_date,
            skills = []
        } = req.body;

        const connection = await db.connection();

        try {
            await connection.beginTransaction();

            await connection.execute(
                `UPDATE internships SET
                    title = ?, description = ?, requirements = ?, location = ?,
                    type = ?, duration_months = ?, stipend = ?, stipend_currency = ?,
                    positions = ?, application_deadline = ?, start_date = ?, end_date = ?,
                    updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?`,
                [
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
                    end_date || null,
                    id
                ]
            );

            await connection.execute(
                'DELETE FROM internship_skills WHERE internship_id = ?',
                [id]
            );

            if (skills && skills.length > 0) {
                for (const skillName of skills) {
                    const [existingSkills] = await connection.execute(
                        'SELECT id FROM skills WHERE name = ?',
                        [skillName]
                    );

                    let skillId;
                    if (existingSkills.length === 0) {
                        const [newSkill] = await connection.execute(
                            'INSERT INTO skills (name) VALUES (?)',
                            [skillName]
                        );
                        skillId = newSkill.insertId;
                    } else {
                        skillId = existingSkills[0].id;
                    }

                    await connection.execute(
                        'INSERT INTO internship_skills (internship_id, skill_id) VALUES (?, ?)',
                        [id, skillId]
                    );
                }
            }

            await connection.commit();
            return res.json({ message: 'Internship updated successfully' });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error updating internship (admin):', error);
        return res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

const flagInternshipForAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body || {};

        const [internship] = await db.query(
            `SELECT i.title, c.user_id
             FROM internships i
             JOIN companies c ON i.company_id = c.id
             WHERE i.id = ?
             LIMIT 1`,
            [id]
        );

        if (!internship) {
            return res.status(404).json({ message: 'Internship not found' });
        }

        const [result] = await db.queryRaw(
            `UPDATE internships
             SET is_flagged = 1, flag_reason = ?, flagged_at = NOW(), updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [reason || null, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Internship not found' });
        }

        const message = reason
            ? `Your internship "${internship.title}" was flagged by admin. Reason: ${reason}`
            : `Your internship "${internship.title}" was flagged by admin for review.`;

        try {
            await db.query(
                `INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id, action_url)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    internship.user_id,
                    'Internship flagged',
                    message,
                    'system',
                    'internship',
                    id,
                    `/company/post/${id}`
                ]
            );
        } catch (notifyError) {
            console.error('Notification insert failed:', notifyError.message);
        }

        return res.json({ success: true, message: 'Internship flagged' });
    } catch (error) {
        if (isBadFieldError(error)) {
            return res.status(400).json({ message: 'Flag columns missing. Please run the migration.' });
        }
        console.error('Error flagging internship (admin):', error);
        return res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

const unflagInternshipForAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.queryRaw(
            `UPDATE internships
             SET is_flagged = 0, flag_reason = NULL, flagged_at = NULL, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Internship not found' });
        }

        return res.json({ success: true, message: 'Internship unflagged' });
    } catch (error) {
        if (isBadFieldError(error)) {
            return res.status(400).json({ message: 'Flag columns missing. Please run the migration.' });
        }
        console.error('Error unflagging internship (admin):', error);
        return res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

const getJobTypes = async (req, res) => {
    try {
        const rows = await db.query(`
            SELECT type AS name, COUNT(*) AS count
            FROM internships
            GROUP BY type
        `);

        let remoteCount = 0;
        let hybridCount = 0;
        try {
            const [flags] = await db.query(`
                SELECT
                    SUM(CASE WHEN is_remote = 1 THEN 1 ELSE 0 END) AS remote_count,
                    SUM(CASE WHEN is_hybrid = 1 THEN 1 ELSE 0 END) AS hybrid_count
                FROM internships
            `);
            remoteCount = Number(flags?.remote_count || 0);
            hybridCount = Number(flags?.hybrid_count || 0);
        } catch (error) {
            // Ignore if columns don't exist
        }

        const descriptionMap = {
            'full-time': 'Standard 40-hour work week.',
            'part-time': 'Less than 30 hours per week.',
            'contract': 'Project-based employment.',
            'internship': 'Temporary position for students.'
        };

        const jobTypes = rows.map((row) => ({
            id: row.name,
            name: row.name,
            description: descriptionMap[row.name] || 'Employment type.',
            count: Number(row.count || 0)
        }));

        if (remoteCount > 0) {
            jobTypes.push({
                id: 'remote',
                name: 'remote',
                description: 'Work from anywhere.',
                count: remoteCount
            });
        }

        if (hybridCount > 0) {
            jobTypes.push({
                id: 'hybrid',
                name: 'hybrid',
                description: 'Mix of on-site and remote work.',
                count: hybridCount
            });
        }

        return res.json({ success: true, jobTypes });
    } catch (error) {
        if (error && error.code === 'ER_NO_SUCH_TABLE') {
            return res.json({ success: true, jobTypes: [] });
        }
        console.error('Error fetching job types:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const getAdminStudentProfile = async (req, res) => {
    const userId = Number(req.params.id);
    if (!userId) {
        return res.status(400).json({ message: 'Student user id is required' });
    }

    try {
        const users = await db.query('SELECT id, role, created_at FROM users WHERE id = ? LIMIT 1', [userId]);
        if (!users || users.length === 0) {
            return res.status(404).json({ message: 'Student not found' });
        }
        if (users[0].role !== 'student') {
            return res.status(404).json({ message: 'Student not found' });
        }

        const profile = await getProfileSettingsByUserId(userId);
        if (!profile) {
            return res.status(404).json({ message: 'Student profile not found' });
        }

        return res.json({
            profile,
            meta: {
                userId,
                createdAt: users[0].created_at
            }
        });
    } catch (error) {
        console.error('Error fetching admin student profile:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const buildMonthBuckets = (monthsBack) => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - (monthsBack - 1), 1);
    const buckets = [];
    for (let i = 0; i < monthsBack; i += 1) {
        const date = new Date(start.getFullYear(), start.getMonth() + i, 1);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        buckets.push({
            key,
            label: date.toLocaleDateString('en-US', { month: 'short' }),
            start: new Date(date),
            end: new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
        });
    }
    return buckets;
};

const getDashboardOverview = async (req, res) => {
    try {
        const monthBuckets = buildMonthBuckets(6);
        const rangeStart = toMysqlDateTime(monthBuckets[0].start);
        const rangeEnd = toMysqlDateTime(monthBuckets[monthBuckets.length - 1].end);

        let growthRows = [];
        try {
            growthRows = await db.query(
                `SELECT DATE_FORMAT(created_at, '%Y-%m') AS ym, COUNT(*) AS count
                 FROM internships
                 WHERE created_at BETWEEN ? AND ?
                 GROUP BY ym
                 ORDER BY ym ASC`,
                [rangeStart, rangeEnd]
            );
        } catch (error) {
            if (!isBadFieldError(error) && error?.code !== 'ER_NO_SUCH_TABLE') {
                console.error('Dashboard growth query failed:', error);
            }
        }

        const growthMap = new Map(growthRows.map(row => [row.ym, Number(row.count || 0)]));
        const growth = monthBuckets.map(bucket => ({
            name: bucket.label,
            value: growthMap.get(bucket.key) || 0
        }));

        let skillsRows = [];
        try {
            skillsRows = await db.query(
                `SELECT s.name, COUNT(isk.internship_id) AS value
                 FROM skills s
                 LEFT JOIN internship_skills isk ON isk.skill_id = s.id
                 GROUP BY s.id, s.name
                 ORDER BY value DESC, s.name ASC
                 LIMIT 6`
            );
        } catch (error) {
            if (!isBadFieldError(error) && error?.code !== 'ER_NO_SUCH_TABLE') {
                console.error('Dashboard skills query failed:', error);
            }
        }

        const skills = skillsRows.map(row => ({
            name: row.name,
            value: Number(row.value || 0)
        }));

        const events = [];
        try {
            const users = await db.query(
                `SELECT full_name, role, created_at
                 FROM users
                 ORDER BY created_at DESC
                 LIMIT 5`
            );
            users.forEach((user) => {
                events.push({
                    title: `New ${String(user.role || 'User').replace(/^\w/, c => c.toUpperCase())} Registration`,
                    desc: `${user.full_name || 'New user'} joined the platform`,
                    time: user.created_at,
                    type: 'info'
                });
            });
        } catch (error) {
            if (!isBadFieldError(error) && error?.code !== 'ER_NO_SUCH_TABLE') {
                console.error('Dashboard users activity query failed:', error);
            }
        }

        try {
            const internships = await db.query(
                `SELECT i.title, i.created_at, c.company_name
                 FROM internships i
                 LEFT JOIN companies c ON i.company_id = c.id
                 ORDER BY i.created_at DESC
                 LIMIT 5`
            );
            internships.forEach((internship) => {
                events.push({
                    title: 'Internship Posted',
                    desc: `${internship.company_name || 'A company'} posted "${internship.title || 'an internship'}"`,
                    time: internship.created_at,
                    type: 'success'
                });
            });
        } catch (error) {
            if (!isBadFieldError(error) && error?.code !== 'ER_NO_SUCH_TABLE') {
                console.error('Dashboard internships activity query failed:', error);
            }
        }

        try {
            const verifications = await db.query(
                `SELECT status, reviewed_at, company_name
                 FROM company_verifications
                 WHERE reviewed_at IS NOT NULL
                 ORDER BY reviewed_at DESC
                 LIMIT 5`
            );
            verifications.forEach((verification) => {
                const status = String(verification.status || '').toLowerCase();
                const isApproved = status === 'approved';
                events.push({
                    title: `Verification ${isApproved ? 'Approved' : 'Rejected'}`,
                    desc: `${verification.company_name || 'Company'} verification ${isApproved ? 'approved' : 'rejected'}`,
                    time: verification.reviewed_at,
                    type: isApproved ? 'success' : 'warning'
                });
            });
        } catch (error) {
            if (!isBadFieldError(error) && error?.code !== 'ER_NO_SUCH_TABLE') {
                console.error('Dashboard verifications activity query failed:', error);
            }
        }

        const activity = events
            .filter(event => event.time)
            .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
            .slice(0, 6);

        return res.json({ growth, skills, activity });
    } catch (error) {
        console.error('Error fetching admin dashboard overview:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const normalizeUserStatus = (value) => {
    if (!value) return 'active';
    const normalized = String(value).trim().toLowerCase();
    if (['active', 'pending', 'suspended'].includes(normalized)) return normalized;
    return 'active';
};

const updateAdminUser = async (req, res) => {
    const userId = Number(req.params.id);
    if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
    }

    const { name, email, role, status } = req.body || {};
    const updates = [];
    const params = [];

    if (name !== undefined) {
        updates.push('full_name = ?');
        params.push(String(name).trim());
    }
    if (email !== undefined) {
        updates.push('email = ?');
        params.push(String(email).trim());
    }
    if (role !== undefined) {
        const normalizedRole = String(role).trim().toLowerCase();
        if (!['student', 'company', 'admin'].includes(normalizedRole)) {
            return res.status(400).json({ message: 'Invalid role' });
        }
        updates.push('role = ?');
        params.push(normalizedRole);
    }
    if (status !== undefined) {
        const normalizedStatus = normalizeUserStatus(status);
        updates.push('status = ?');
        params.push(normalizedStatus);
    }

    if (updates.length === 0) {
        return res.status(400).json({ message: 'No fields to update' });
    }

    try {
        params.push(userId);
        await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);

        const rows = await db.query(
            `SELECT id, full_name as name, email, role, COALESCE(status, 'active') as status,
             DATE_FORMAT(created_at, '%b %d, %Y') as date,
             LEFT(full_name, 1) as initial,
             'bg-blue-100' as color
             FROM users WHERE id = ? LIMIT 1`,
            [userId]
        );

        if (!rows || rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.json({ user: rows[0] });
    } catch (error) {
        if (isBadFieldError(error)) {
            return res.status(400).json({ message: 'User status column missing. Run migrations.' });
        }
        console.error('Error updating user:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const normalizeAdminSettingsRow = (row) => {
    const authMethods = parseJsonField(row.auth_methods, defaultAdminSettings.authMethods);
    const emailTriggers = parseJsonField(row.email_triggers, defaultAdminSettings.emailTriggers);
    const ipWhitelist = parseJsonField(row.ip_whitelist, defaultAdminSettings.ipWhitelist);

    return {
        platformName: row.platform_name || defaultAdminSettings.platformName,
        supportEmail: row.support_email || defaultAdminSettings.supportEmail,
        seoDescription: row.seo_description || defaultAdminSettings.seoDescription,
        maintenanceMode: Boolean(row.maintenance_mode),
        defaultLanguage: row.default_language || defaultAdminSettings.defaultLanguage,
        timezone: row.timezone || defaultAdminSettings.timezone,
        brandLogo: row.brand_logo || null,
        brandFavicon: row.brand_favicon || null,
        authMethods,
        bruteForceProtection: row.brute_force_protection === null ? defaultAdminSettings.bruteForceProtection : Boolean(row.brute_force_protection),
        ipWhitelist: Array.isArray(ipWhitelist) ? ipWhitelist : defaultAdminSettings.ipWhitelist,
        passwordMinLength: Number(row.password_min_length || defaultAdminSettings.passwordMinLength),
        sessionTimeoutMinutes: Number(row.session_timeout_minutes || defaultAdminSettings.sessionTimeoutMinutes),
        emailTriggers,
        slackWebhookUrl: row.slack_webhook_url || '',
        pushNotifications: row.push_notifications === null ? defaultAdminSettings.pushNotifications : Boolean(row.push_notifications),
        storage: {
            totalGb: Number(row.storage_total_gb ?? defaultAdminSettings.storage.totalGb),
            usedGb: Number(row.storage_used_gb ?? defaultAdminSettings.storage.usedGb),
            databaseGb: Number(row.storage_database_gb ?? defaultAdminSettings.storage.databaseGb),
            mediaGb: Number(row.storage_media_gb ?? defaultAdminSettings.storage.mediaGb),
            logsGb: Number(row.storage_logs_gb ?? defaultAdminSettings.storage.logsGb)
        },
        lastBackupAt: row.last_backup_at ? new Date(row.last_backup_at).toISOString() : null,
        backupSchedule: row.backup_schedule || defaultAdminSettings.backupSchedule,
        dataRetentionDays: row.data_retention_days === null || row.data_retention_days === undefined
            ? defaultAdminSettings.dataRetentionDays
            : Number(row.data_retention_days)
    };
};

const getAdminSettings = async (req, res) => {
    try {
        const rows = await db.query('SELECT * FROM admin_settings ORDER BY id ASC LIMIT 1');
        if (!rows || rows.length === 0) {
            return res.json({ settings: defaultAdminSettings });
        }
        return res.json({ settings: normalizeAdminSettingsRow(rows[0]) });
    } catch (error) {
        if (error && error.code === 'ER_NO_SUCH_TABLE') {
            return res.status(500).json({ message: 'Admin settings table not found. Run migrations first.' });
        }
        console.error('Error fetching admin settings:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const updateAdminSettings = async (req, res) => {
    try {
        const rows = await db.query('SELECT * FROM admin_settings ORDER BY id ASC LIMIT 1');
        const current = rows && rows.length > 0 ? normalizeAdminSettingsRow(rows[0]) : defaultAdminSettings;
        const payload = req.body || {};

        const merged = {
            ...current,
            ...payload,
            authMethods: { ...current.authMethods, ...(payload.authMethods || {}) },
            emailTriggers: { ...current.emailTriggers, ...(payload.emailTriggers || {}) },
            storage: { ...current.storage, ...(payload.storage || {}) },
            ipWhitelist: Array.isArray(payload.ipWhitelist) ? payload.ipWhitelist : current.ipWhitelist
        };

        await db.query(
            `UPDATE admin_settings SET
                platform_name = ?,
                support_email = ?,
                seo_description = ?,
                maintenance_mode = ?,
                default_language = ?,
                timezone = ?,
                brand_logo = ?,
                brand_favicon = ?,
                auth_methods = ?,
                brute_force_protection = ?,
                ip_whitelist = ?,
                password_min_length = ?,
                session_timeout_minutes = ?,
                email_triggers = ?,
                slack_webhook_url = ?,
                push_notifications = ?,
                storage_total_gb = ?,
                storage_used_gb = ?,
                storage_database_gb = ?,
                storage_media_gb = ?,
                storage_logs_gb = ?,
                last_backup_at = ?,
                backup_schedule = ?,
                data_retention_days = ?
            WHERE id = ?`,
            [
                merged.platformName,
                merged.supportEmail,
                merged.seoDescription,
                merged.maintenanceMode ? 1 : 0,
                merged.defaultLanguage,
                merged.timezone,
                merged.brandLogo,
                merged.brandFavicon,
                JSON.stringify(merged.authMethods || {}),
                merged.bruteForceProtection ? 1 : 0,
                JSON.stringify(merged.ipWhitelist || []),
                Number(merged.passwordMinLength || 0),
                Number(merged.sessionTimeoutMinutes || 0),
                JSON.stringify(merged.emailTriggers || {}),
                merged.slackWebhookUrl || '',
                merged.pushNotifications ? 1 : 0,
                Number(merged.storage.totalGb || 0),
                Number(merged.storage.usedGb || 0),
                Number(merged.storage.databaseGb || 0),
                Number(merged.storage.mediaGb || 0),
                Number(merged.storage.logsGb || 0),
                merged.lastBackupAt ? toMysqlDateTime(new Date(merged.lastBackupAt)) : null,
                merged.backupSchedule || '',
                merged.dataRetentionDays === null || merged.dataRetentionDays === undefined ? null : Number(merged.dataRetentionDays),
                rows && rows.length > 0 ? rows[0].id : 1
            ]
        );

        return res.json({ success: true, settings: merged });
    } catch (error) {
        console.error('Error updating admin settings:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const exportAdminData = async (req, res) => {
    try {
        const now = new Date();
        await db.query(
            'UPDATE admin_settings SET last_backup_at = ? WHERE id = 1',
            [toMysqlDateTime(now)]
        );
        return res.json({ success: true, lastBackupAt: now.toISOString() });
    } catch (error) {
        console.error('Error exporting admin data:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const purgeAdminLogs = async (req, res) => {
    try {
        const rows = await db.query('SELECT storage_used_gb, storage_logs_gb FROM admin_settings WHERE id = 1');
        const currentUsed = Number(rows?.[0]?.storage_used_gb || 0);
        const currentLogs = Number(rows?.[0]?.storage_logs_gb || 0);
        const nextUsed = Math.max(0, currentUsed - currentLogs);
        const now = new Date();

        await db.query(
            'UPDATE admin_settings SET storage_logs_gb = 0, storage_used_gb = ?, last_purge_at = ? WHERE id = 1',
            [nextUsed, toMysqlDateTime(now)]
        );

        return res.json({ success: true, storageLogsGb: 0, storageUsedGb: nextUsed });
    } catch (error) {
        console.error('Error purging admin logs:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getAllUsers,
    getStats,
    getDashboardOverview,
    getCompanyVerifications,
    updateCompanyVerificationStatus,
    getStudentVerifications,
    updateStudentVerificationStatus,
    deleteUser,
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getSkills,
    createSkill,
    updateSkill,
    deleteSkill,
    getCategoryInternships,
    getSkillInternships,
    getInternshipByIdForAdmin,
    updateInternshipForAdmin,
    flagInternshipForAdmin,
    unflagInternshipForAdmin,
    getJobTypes,
    getReports,
    getAdminSettings,
    updateAdminSettings,
    exportAdminData,
    purgeAdminLogs,
    getAdminStudentProfile,
    updateAdminUser
};
