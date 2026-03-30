const db = require('../config/db');
const isBadFieldError = (error) => error && error.code === 'ER_BAD_FIELD_ERROR';

const syncInternshipPostsIfMissing = async () => {
    try {
        // Ensure internship-based posts exist for active internships.
        // Uses internship_id when available (migration 031_add_internship_id_to_posts.sql).
        try {
            await db.query(`
                INSERT INTO posts
                    (title, content, short_description, image_url, post_type, internship_id, company_id, location, event_date, status)
                SELECT
                    i.title,
                    COALESCE(i.description, i.requirements, i.title),
                    LEFT(COALESCE(i.description, i.requirements, i.title), 500),
                    i.image,
                    'internship',
                    i.id,
                    i.company_id,
                    i.location,
                    i.application_deadline,
                    'published'
                FROM internships i
                WHERE i.status = 'active'
                  AND i.is_flagged = 0
                  AND NOT EXISTS (
                      SELECT 1 FROM posts p WHERE p.internship_id = i.id
                  )
            `);

            await db.query(`
                UPDATE posts p
                JOIN internships i ON i.id = p.internship_id
                SET
                    p.image_url = CASE
                        WHEN i.image IS NOT NULL AND i.image != '' THEN i.image
                        ELSE p.image_url
                    END,
                    p.location = CASE
                        WHEN p.location IS NULL OR p.location = '' THEN i.location
                        ELSE p.location
                    END,
                    p.event_date = CASE
                        WHEN p.event_date IS NULL THEN i.application_deadline
                        ELSE p.event_date
                    END
                WHERE p.internship_id IS NOT NULL
            `);
            return;
        } catch (error) {
            if (!(isBadFieldError(error) || error.code === 'ER_NO_SUCH_TABLE')) {
                throw error;
            }
        }

        // Fallback for schemas without internship_id: best-effort match on company + title.
        await db.query(`
            INSERT INTO posts
                (title, content, short_description, image_url, post_type, company_id, location, event_date, status)
            SELECT
                i.title,
                COALESCE(i.description, i.requirements, i.title),
                LEFT(COALESCE(i.description, i.requirements, i.title), 500),
                i.image,
                'internship',
                i.company_id,
                i.location,
                i.application_deadline,
                'published'
            FROM internships i
            WHERE i.status = 'active'
              AND i.is_flagged = 0
              AND NOT EXISTS (
                  SELECT 1 FROM posts p
                  WHERE p.company_id = i.company_id
                    AND p.post_type = 'internship'
                    AND p.title = i.title
              )
        `);

        await db.query(`
            UPDATE posts p
            JOIN internships i
              ON p.company_id = i.company_id
             AND p.post_type = 'internship'
             AND p.title = i.title
            SET
                p.image_url = CASE
                    WHEN i.image IS NOT NULL AND i.image != '' THEN i.image
                    ELSE p.image_url
                END,
                p.location = CASE
                    WHEN p.location IS NULL OR p.location = '' THEN i.location
                    ELSE p.location
                END,
                p.event_date = CASE
                    WHEN p.event_date IS NULL THEN i.application_deadline
                    ELSE p.event_date
                END
        `);
    } catch (error) {
        // Skip if posts schema doesn't include internship_id yet or table missing.
        if (isBadFieldError(error) || error.code === 'ER_NO_SUCH_TABLE') {
            console.warn('Skipping internship post sync:', error.message);
            return;
        }
        throw error;
    }
};

const syncEventPostsIfMissing = async () => {
    try {
        // Ensure event-based posts exist for published events.
        try {
            await db.query(`
                INSERT INTO posts
                    (title, content, short_description, image_url, post_type, event_id, company_id, location, event_date, status)
                SELECT
                    e.title,
                    COALESCE(e.description, e.title),
                    LEFT(COALESCE(e.description, e.title), 500),
                    e.image_url,
                    CASE
                        WHEN e.type = 'career_fair' THEN 'career_fair'
                        ELSE 'workshop'
                    END,
                    e.id,
                    c.id,
                    e.location,
                    e.event_date,
                    'published'
                FROM events e
                LEFT JOIN companies c ON c.user_id = e.company_id
                WHERE e.status = 'published'
                  AND NOT EXISTS (
                      SELECT 1 FROM posts p WHERE p.event_id = e.id
                  )
            `);

            await db.query(`
                UPDATE posts p
                JOIN events e ON e.id = p.event_id
                LEFT JOIN companies c ON c.user_id = e.company_id
                SET
                    p.image_url = CASE
                        WHEN e.image_url IS NOT NULL AND e.image_url != '' THEN e.image_url
                        ELSE p.image_url
                    END,
                    p.company_id = CASE
                        WHEN c.id IS NOT NULL AND (p.company_id IS NULL OR p.company_id != c.id) THEN c.id
                        ELSE p.company_id
                    END
                WHERE p.event_id IS NOT NULL
            `);
            return;
        } catch (error) {
            if (!(isBadFieldError(error) || error.code === 'ER_NO_SUCH_TABLE')) {
                throw error;
            }
        }

        // Fallback for schemas without event_id: best-effort match on company + title + date.
        await db.query(`
            INSERT INTO posts
                (title, content, short_description, image_url, post_type, company_id, location, event_date, status)
            SELECT
                e.title,
                COALESCE(e.description, e.title),
                LEFT(COALESCE(e.description, e.title), 500),
                e.image_url,
                CASE
                    WHEN e.type = 'career_fair' THEN 'career_fair'
                    ELSE 'workshop'
                END,
                c.id,
                e.location,
                e.event_date,
                'published'
            FROM events e
            LEFT JOIN companies c ON c.user_id = e.company_id
            WHERE e.status = 'published'
              AND NOT EXISTS (
                  SELECT 1 FROM posts p
                  WHERE p.company_id = c.id
                    AND p.title = e.title
                    AND p.event_date = e.event_date
                    AND p.post_type IN ('workshop', 'career_fair')
              )
        `);
    } catch (error) {
        if (isBadFieldError(error) || error.code === 'ER_NO_SUCH_TABLE') {
            console.warn('Skipping event post sync:', error.message);
            return;
        }
        throw error;
    }
};

/**
 * Get all posts with filtering, search, and pagination
 */
const getPosts = async (req, res) => {
    try {
        const { search, type, company_id, page = 1, limit = 10 } = req.query;
        const normalizedType = String(type || 'all');
        const parsedPage = Number.parseInt(page, 10);
        const parsedLimit = Number.parseInt(limit, 10);
        const safePage = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
        const safeLimit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 100) : 10;
        const offset = (safePage - 1) * safeLimit;

        if (normalizedType === 'all' || normalizedType === 'internship') {
            await syncInternshipPostsIfMissing();
        }
        if (['events', 'workshop', 'career_fair'].includes(normalizedType)) {
            await syncEventPostsIfMissing();
        }

        const baseQuery = `
            SELECT 
                p.*,
                COALESCE(p.image_url, e.image_url, i.image) AS image_url,
                c.name as company_name,
                c.logo as company_logo,
                u.full_name as admin_name
            FROM posts p
            LEFT JOIN companies c ON p.company_id = c.id
            LEFT JOIN users u ON p.admin_id = u.id
            LEFT JOIN events e ON e.id = p.event_id
            LEFT JOIN internships i ON i.id = p.internship_id
            WHERE p.status = 'published'
        `;

        const fallbackQueryBase = `
            SELECT 
                p.*,
                c.name as company_name,
                c.logo as company_logo,
                u.full_name as admin_name
            FROM posts p
            LEFT JOIN companies c ON p.company_id = c.id
            LEFT JOIN users u ON p.admin_id = u.id
            WHERE p.status = 'published'
        `;

        const filters = [];
        const queryParams = [];

        if (search) {
            filters.push(' AND (p.title LIKE ? OR p.content LIKE ? OR c.name LIKE ?)');
            const searchPattern = `%${search}%`;
            queryParams.push(searchPattern, searchPattern, searchPattern);
        }

        if (normalizedType && normalizedType !== 'all') {
            if (normalizedType === 'events') {
                filters.push(' AND p.post_type IN (?, ?)');
                queryParams.push('workshop', 'career_fair');
            } else {
                filters.push(' AND p.post_type = ?');
                queryParams.push(normalizedType);
            }
        }

        if (company_id) {
            filters.push(' AND p.company_id = ?');
            queryParams.push(company_id);
        }

        const orderAndPage = ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
        queryParams.push(Number(safeLimit), Number(offset));

        let query = baseQuery + filters.join('') + orderAndPage;

        let posts;
        try {
            posts = await db.query(query, queryParams);
        } catch (error) {
            if (isBadFieldError(error) || error.code === 'ER_NO_SUCH_TABLE') {
                query = fallbackQueryBase + filters.join('') + orderAndPage;
                posts = await db.query(query, queryParams);
            } else {
                throw error;
            }
        }

        // Get total count for pagination
        let countQuery = `
            SELECT COUNT(*) as total
            FROM posts p
            LEFT JOIN companies c ON p.company_id = c.id
            WHERE p.status = 'published'
        `;
        const countParams = [];
        
        if (search) {
            countQuery += ' AND (p.title LIKE ? OR p.content LIKE ? OR c.name LIKE ?)';
            const searchPattern = `%${search}%`;
            countParams.push(searchPattern, searchPattern, searchPattern);
        }
        if (normalizedType && normalizedType !== 'all') {
            if (normalizedType === 'events') {
                countQuery += ' AND p.post_type IN (?, ?)';
                countParams.push('workshop', 'career_fair');
            } else {
                countQuery += ' AND p.post_type = ?';
                countParams.push(normalizedType);
            }
        }
        if (company_id) {
            countQuery += ' AND p.company_id = ?';
            countParams.push(company_id);
        }

        const countResult = await db.query(countQuery, countParams);
        const total = countResult[0]?.total || 0;

        res.status(200).json({
            success: true,
            data: posts,
            pagination: {
                total,
                page: safePage,
                limit: safeLimit,
                pages: Math.ceil(total / safeLimit)
            }
        });
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Get a single post by ID
 */
const getPostById = async (req, res) => {
    try {
        const { id } = req.params;

        // Increment view count
        await db.query('UPDATE posts SET views_count = views_count + 1 WHERE id = ?', [id]);

        const query = `
            SELECT 
                p.*,
                COALESCE(p.image_url, e.image_url, i.image) AS image_url,
                c.name as company_name,
                c.logo as company_logo,
                c.description as company_description,
                u.full_name as admin_name
            FROM posts p
            LEFT JOIN companies c ON p.company_id = c.id
            LEFT JOIN users u ON p.admin_id = u.id
            LEFT JOIN events e ON e.id = p.event_id
            LEFT JOIN internships i ON i.id = p.internship_id
            WHERE p.id = ? AND p.status = 'published'
        `;

        const fallbackQuery = `
            SELECT 
                p.*,
                c.name as company_name,
                c.logo as company_logo,
                c.description as company_description,
                u.full_name as admin_name
            FROM posts p
            LEFT JOIN companies c ON p.company_id = c.id
            LEFT JOIN users u ON p.admin_id = u.id
            WHERE p.id = ? AND p.status = 'published'
        `;

        let posts;
        try {
            posts = await db.query(query, [id]);
        } catch (error) {
            if (isBadFieldError(error) || error.code === 'ER_NO_SUCH_TABLE') {
                posts = await db.query(fallbackQuery, [id]);
            } else {
                throw error;
            }
        }

        if (posts.length === 0) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        // Get related posts (same type)
        const relatedQuery = `
            SELECT 
                p.id,
                p.title,
                p.post_type,
                COALESCE(p.image_url, e.image_url, i.image) AS image_url,
                p.created_at
            FROM posts p
            LEFT JOIN events e ON e.id = p.event_id
            LEFT JOIN internships i ON i.id = p.internship_id
            WHERE p.post_type = ? AND p.id != ? AND p.status = 'published'
            ORDER BY p.created_at DESC
            LIMIT 3
        `;
        const relatedFallbackQuery = `
            SELECT 
                p.id,
                p.title,
                p.post_type,
                p.image_url,
                p.created_at
            FROM posts p
            WHERE p.post_type = ? AND p.id != ? AND p.status = 'published'
            ORDER BY p.created_at DESC
            LIMIT 3
        `;
        let relatedPosts;
        try {
            relatedPosts = await db.query(relatedQuery, [posts[0].post_type, id]);
        } catch (error) {
            if (isBadFieldError(error) || error.code === 'ER_NO_SUCH_TABLE') {
                relatedPosts = await db.query(relatedFallbackQuery, [posts[0].post_type, id]);
            } else {
                throw error;
            }
        }

        res.status(200).json({
            success: true,
            data: {
                ...posts[0],
                related_posts: relatedPosts
            }
        });
    } catch (error) {
        console.error('Error fetching post detail:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    getPosts,
    getPostById
};
