const db = require('../config/db');

/**
 * Get all posts with filtering, search, and pagination
 */
const getPosts = async (req, res) => {
    try {
        const { search, type, company_id, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        let query = `
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

        const queryParams = [];

        if (search) {
            query += ' AND (p.title LIKE ? OR p.content LIKE ? OR c.name LIKE ?)';
            const searchPattern = `%${search}%`;
            queryParams.push(searchPattern, searchPattern, searchPattern);
        }

        if (type && type !== 'all') {
            query += ' AND p.post_type = ?';
            queryParams.push(type);
        }

        if (company_id) {
            query += ' AND p.company_id = ?';
            queryParams.push(company_id);
        }

        // Add sorting
        query += ' ORDER BY p.created_at DESC';

        // Add pagination
        query += ' LIMIT ? OFFSET ?';
        queryParams.push(Number(limit), Number(offset));

        const posts = await db.query(query, queryParams);

        // Get total count for pagination
        let countQuery = "SELECT COUNT(*) as total FROM posts WHERE status = 'published'";
        const countParams = [];
        
        if (search) {
            countQuery += ' AND (title LIKE ? OR content LIKE ?)';
            const searchPattern = `%${search}%`;
            countParams.push(searchPattern, searchPattern);
        }
        if (type && type !== 'all') {
            countQuery += ' AND post_type = ?';
            countParams.push(type);
        }

        const countResult = await db.query(countQuery, countParams);
        const total = countResult[0]?.total || 0;

        res.status(200).json({
            success: true,
            data: posts,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
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
                c.name as company_name,
                c.logo as company_logo,
                c.description as company_description,
                u.full_name as admin_name
            FROM posts p
            LEFT JOIN companies c ON p.company_id = c.id
            LEFT JOIN users u ON p.admin_id = u.id
            WHERE p.id = ? AND p.status = 'published'
        `;

        const posts = await db.query(query, [id]);

        if (posts.length === 0) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        // Get related posts (same type)
        const relatedQuery = `
            SELECT id, title, post_type, image_url, created_at
            FROM posts
            WHERE post_type = ? AND id != ? AND status = 'published'
            ORDER BY created_at DESC
            LIMIT 3
        `;
        const relatedPosts = await db.query(relatedQuery, [posts[0].post_type, id]);

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
