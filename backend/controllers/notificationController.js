const db = require('../config/db');

/**
 * Get all notifications for the authenticated user
 */
const getNotifications = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { limit = 20, offset = 0 } = req.query;

        const notifications = await db.query(
            `SELECT * FROM notifications 
             WHERE user_id = ? 
             ORDER BY created_at DESC 
             LIMIT ? OFFSET ?`,
            [userId, parseInt(limit), parseInt(offset)]
        );

        const unreadCountResult = await db.query(
            'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
            [userId]
        );

        return res.json({
            success: true,
            notifications,
            unreadCount: unreadCountResult[0].count
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Mark a notification as read
 */
const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        await db.query(
            'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        return res.json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Mark all notifications as read for the authenticated user
 */
const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.userId;

        await db.query(
            'UPDATE notifications SET is_read = TRUE WHERE user_id = ?',
            [userId]
        );

        return res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Delete a notification
 */
const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        await db.query(
            'DELETE FROM notifications WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        return res.json({ success: true, message: 'Notification deleted' });
    } catch (error) {
        console.error('Error deleting notification:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Helper function to create a notification
 * This is not an exported route handler, but a utility for other controllers
 */
const createNotification = async (userId, title, message, type, relatedEntityType = null, relatedEntityId = null, actionUrl = null) => {
    try {
        const result = await db.query(
            `INSERT INTO notifications 
            (user_id, title, message, type, related_entity_type, related_entity_id, action_url) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [userId, title, message, type, relatedEntityType, relatedEntityId, actionUrl]
        );
        return result.insertId;
    } catch (error) {
        console.error('Error creating notification:', error);
        return null;
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification
};
