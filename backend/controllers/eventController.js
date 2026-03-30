const db = require('../config/db');

/**
 * Helper to identify database schema errors (missing columns/tables)
 */
const isSchemaError = (error) =>
    error && (error.code === 'ER_BAD_FIELD_ERROR' || error.code === 'ER_NO_SUCH_TABLE');
const isDuplicateEntry = (error) => error && error.code === 'ER_DUP_ENTRY';

const companyPostImageSubquery = `
    SELECT p.image_url
    FROM posts p
    WHERE p.company_id = c.id
      AND p.status = 'published'
      AND p.image_url IS NOT NULL
      AND p.image_url != ''
    ORDER BY p.created_at DESC
    LIMIT 1
`;

const eventSelectFields = (includeRegistrationUrl = true) => `
    e.id,
    e.company_id,
    e.title,
    e.description,
    e.type,
    e.event_date,
    e.start_time,
    e.end_time,
    e.location,
    e.is_virtual,
    e.meeting_url,
    ${includeRegistrationUrl ? 'e.registration_url' : 'NULL AS registration_url'},
    e.max_participants,
    e.current_participants,
    e.registration_deadline,
    e.requirements,
    e.tags,
    COALESCE(e.image_url, (${companyPostImageSubquery})) AS image_url,
    e.status,
    e.created_at
`;

const companyEventsSelect = (includeRegistrationUrl = true) => `
    SELECT
        e.id,
        e.title,
        e.description,
        e.type,
        e.event_date,
        e.start_time,
        e.end_time,
        e.location,
        e.is_virtual,
        e.meeting_url,
        ${includeRegistrationUrl ? 'e.registration_url' : 'NULL AS registration_url'},
        e.max_participants,
        e.current_participants,
        e.registration_deadline,
        e.requirements,
        e.tags,
        e.image_url,
        e.status,
        e.created_at,
        (
            SELECT COUNT(*)
            FROM event_registrations er
            WHERE er.event_id = e.id
        ) AS total_registrations
    FROM events e
    WHERE e.company_id = ?
    ORDER BY e.created_at DESC
`;

/**
 * Get all events with filtering and search
 */
const getAllEvents = async (req, res) => {
    try {
        const { search, type, location, limit: queryLimit } = req.query;
        const parsedLimit = Number.parseInt(queryLimit, 10);
        const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 100) : null;

        let query = `
            SELECT
                e.id,
                e.company_id,
                e.title,
                e.description,
                e.type,
                e.event_date,
                e.start_time,
                e.end_time,
                e.location,
                e.is_virtual,
                e.meeting_url,
                e.registration_url,
                e.max_participants,
                e.current_participants,
                e.registration_deadline,
                e.requirements,
                e.tags,
                COALESCE(e.image_url, (${companyPostImageSubquery})) AS image_url,
                e.status,
                e.created_at,
                COALESCE(c.name, u.company_name) AS company_name,
                c.id AS company_profile_id,
                c.logo AS company_logo,
                COALESCE(c.industry, u.industry) AS industry
            FROM events e
            JOIN users u ON e.company_id = u.id
            LEFT JOIN companies c ON c.user_id = u.id
            WHERE e.status = 'published'
        `;

        const params = [];

        if (search) {
            query += ` AND (e.title LIKE ? OR e.description LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`);
        }

        if (type) {
            query += ` AND e.type = ?`;
            params.push(type);
        }

        if (location) {
            query += ` AND (e.location LIKE ? OR u.location LIKE ?)`;
            params.push(`%${location}%`, `%${location}%`);
        }

        query += ` ORDER BY e.event_date ASC, e.start_time ASC`;

        if (limit) {
            query += ` LIMIT ?`;
            params.push(limit);
        }

        const events = await db.query(query, params);
        res.json(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        if (isSchemaError(error)) {
            return res.status(500).json({ error: 'Database schema error. Please check event tables exist.' });
        }
        res.status(500).json({ error: 'Failed to fetch events' });
    }
};

/**
 * Get featured events
 */
const getFeaturedEvents = async (req, res) => {
    try {
        const query = `
            SELECT
                e.id,
                e.company_id,
                e.title,
                e.description,
                e.type,
                e.event_date,
                e.start_time,
                e.end_time,
                e.location,
                e.is_virtual,
                e.meeting_url,
                e.registration_url,
                e.max_participants,
                e.current_participants,
                e.registration_deadline,
                e.requirements,
                e.tags,
                COALESCE(e.image_url, (${companyPostImageSubquery})) AS image_url,
                e.status,
                e.created_at,
                COALESCE(c.name, u.company_name) AS company_name,
                c.id AS company_profile_id,
                c.logo AS company_logo,
                COALESCE(c.industry, u.industry) AS industry
            FROM events e
            JOIN users u ON e.company_id = u.id
            LEFT JOIN companies c ON c.user_id = u.id
            WHERE e.status = 'published'
            AND e.event_date >= CURDATE()
            ORDER BY e.event_date ASC, e.current_participants DESC
            LIMIT 10
        `;

        const events = await db.query(query);
        res.json(events);
    } catch (error) {
        console.error('Error fetching featured events:', error);
        res.status(500).json({ error: 'Failed to fetch featured events' });
    }
};

/**
 * Get upcoming events
 */
const getUpcomingEvents = async (req, res) => {
    try {
        const query = `
            SELECT
                e.id,
                e.company_id,
                e.title,
                e.description,
                e.type,
                e.event_date,
                e.start_time,
                e.end_time,
                e.location,
                e.is_virtual,
                e.meeting_url,
                e.registration_url,
                e.max_participants,
                e.current_participants,
                e.registration_deadline,
                e.requirements,
                e.tags,
                COALESCE(e.image_url, (${companyPostImageSubquery})) AS image_url,
                e.status,
                e.created_at,
                COALESCE(c.name, u.company_name) AS company_name,
                c.id AS company_profile_id,
                c.logo AS company_logo,
                COALESCE(c.industry, u.industry) AS industry
            FROM events e
            JOIN users u ON e.company_id = u.id
            LEFT JOIN companies c ON c.user_id = u.id
            WHERE e.status = 'published'
            AND e.event_date >= CURDATE()
            ORDER BY e.event_date ASC, e.start_time ASC
            LIMIT 20
        `;

        const events = await db.query(query);
        res.json(events);
    } catch (error) {
        console.error('Error fetching upcoming events:', error);
        res.status(500).json({ error: 'Failed to fetch upcoming events' });
    }
};

/**
 * Get event by ID
 */
const getEventById = async (req, res) => {
    try {
        const { id } = req.params;
        const buildQuery = (includeRegistrationUrl = true) => `
            SELECT
                ${eventSelectFields(includeRegistrationUrl)},
                COALESCE(c.name, u.company_name) AS company_name,
                c.id AS company_profile_id,
                c.logo AS company_logo,
                COALESCE(c.description, u.bio, '') AS company_description,
                COALESCE(c.industry, u.industry) AS industry,
                COALESCE(c.headquarters, u.location) AS company_location,
                COALESCE(c.website, u.website) AS website
            FROM events e
            JOIN users u ON e.company_id = u.id
            LEFT JOIN companies c ON c.user_id = u.id
            WHERE e.id = ?
        `;

        const fallbackQuery = `
            SELECT
                ${eventSelectFields(false)},
                COALESCE(u.company_name, '') AS company_name,
                NULL AS company_logo,
                COALESCE(u.bio, '') AS company_description,
                COALESCE(u.industry, '') AS industry,
                COALESCE(u.location, '') AS company_location,
                COALESCE(u.website, '') AS website
            FROM events e
            JOIN users u ON e.company_id = u.id
            WHERE e.id = ?
        `;

        let events;
        try {
            events = await db.query(buildQuery(true), [id]);
        } catch (error) {
            if (!isSchemaError(error)) throw error;
            try {
                events = await db.query(buildQuery(false), [id]);
            } catch (fallbackError) {
                if (!isSchemaError(fallbackError)) throw fallbackError;
                events = await db.query(fallbackQuery, [id]);
            }
        }
        
        if (events.length === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }

        const event = events[0];

        // Check if user is registered for this event
        if (req.user && req.user.role === 'student') {
            const registrationQuery = `
                SELECT id, registration_date, status 
                FROM event_registrations 
                WHERE event_id = ? AND student_id = ?
            `;
            const registrations = await db.query(registrationQuery, [id, req.user.id]);
            event.userRegistration = registrations[0] || null;
        }

        res.json(event);
    } catch (error) {
        console.error('Error fetching event:', error);
        res.status(500).json({ error: 'Failed to fetch event' });
    }
};

/**
 * Get company events
 */
const getCompanyEvents = async (req, res) => {
    try {
        const companyId = req.user?.userId || req.user?.id;
        let events;

        try {
            events = await db.query(companyEventsSelect(true), [companyId]);
        } catch (error) {
            if (!isSchemaError(error)) {
                throw error;
            }

            // Allow the company event list to keep working before the optional
            // registration link migration has been applied.
            events = await db.query(companyEventsSelect(false), [companyId]);
        }

        res.json(events);
    } catch (error) {
        console.error('Error fetching company events:', error);
        res.status(500).json({ error: 'Failed to fetch company events' });
    }
};

/**
 * Get company event statistics
 */
const getCompanyEventStats = async (req, res) => {
    try {
        const companyId = req.user?.userId || req.user?.id;
        
        const query = `
            SELECT
                COUNT(*) as total_events,
                COUNT(CASE WHEN status = 'published' THEN 1 END) as published_events,
                COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_events,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_events,
                COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_events,
                SUM(current_participants) as total_participants,
                COUNT(CASE WHEN event_date >= CURDATE() AND status = 'published' THEN 1 END) as upcoming_events
            FROM events
            WHERE company_id = ?
        `;

        const stats = await db.query(query, [companyId]);
        res.json(stats[0] || {});
    } catch (error) {
        console.error('Error fetching company event stats:', error);
        res.status(500).json({ error: 'Failed to fetch event statistics' });
    }
};

/**
 * Get student registered events
 */
const getStudentRegisteredEvents = async (req, res) => {
    try {
        const studentId = req.user?.userId || req.user?.id;
        
        const query = `
            SELECT
                e.id,
                e.company_id,
                e.title,
                e.description,
                e.type,
                e.event_date,
                e.start_time,
                e.end_time,
                e.location,
                e.is_virtual,
                e.meeting_url,
                e.registration_url,
                e.max_participants,
                e.current_participants,
                e.registration_deadline,
                e.requirements,
                e.tags,
                COALESCE(e.image_url, (${companyPostImageSubquery})) AS image_url,
                e.status,
                e.created_at,
                er.registration_date,
                er.status as registration_status,
                COALESCE(c.name, u.company_name) AS company_name,
                c.id AS company_profile_id,
                c.logo AS company_logo,
                COALESCE(c.industry, u.industry) AS industry
            FROM events e
            JOIN event_registrations er ON e.id = er.event_id
            JOIN users u ON e.company_id = u.id
            LEFT JOIN companies c ON c.user_id = u.id
            WHERE er.student_id = ?
            ORDER BY e.event_date ASC, e.start_time ASC
        `;

        const events = await db.query(query, [studentId]);
        res.json(events);
    } catch (error) {
        console.error('Error fetching student registered events:', error);
        res.status(500).json({ error: 'Failed to fetch registered events' });
    }
};

/**
 * Get recommended events for student
 */
const getRecommendedEvents = async (req, res) => {
    try {
        const studentId = req.user?.userId || req.user?.id;
        
        // Get student's university and field of study
        const studentQuery = `
            SELECT university, education, graduation_year
            FROM users
            WHERE id = ?
        `;
        const students = await db.query(studentQuery, [studentId]);
        
        if (students.length === 0) {
            return res.json([]);
        }

        const student = students[0];
        
        const query = `
            SELECT
                e.id,
                e.company_id,
                e.title,
                e.description,
                e.type,
                e.event_date,
                e.start_time,
                e.end_time,
                e.location,
                e.is_virtual,
                e.meeting_url,
                e.registration_url,
                e.max_participants,
                e.current_participants,
                e.registration_deadline,
                e.requirements,
                e.tags,
                COALESCE(e.image_url, (${companyPostImageSubquery})) AS image_url,
                e.status,
                e.created_at,
                COALESCE(c.name, u.company_name) AS company_name,
                c.id AS company_profile_id,
                c.logo AS company_logo,
                COALESCE(c.industry, u.industry) AS industry
            FROM events e
            JOIN users u ON e.company_id = u.id
            LEFT JOIN companies c ON c.user_id = u.id
            WHERE e.status = 'published'
            AND e.event_date >= CURDATE()
            AND e.registration_deadline >= CURDATE()
            AND e.id NOT IN (
                SELECT event_id FROM event_registrations WHERE student_id = ?
            )
            ORDER BY e.event_date ASC
            LIMIT 10
        `;

        const events = await db.query(query, [studentId]);
        res.json(events);
    } catch (error) {
        console.error('Error fetching recommended events:', error);
        res.status(500).json({ error: 'Failed to fetch recommended events' });
    }
};

/**
 * Create new event
 */
const createEvent = async (req, res) => {
    try {
        const companyId = req.user?.userId || req.user?.id;
        const {
            title,
            description,
            type,
            event_date,
            start_time,
            end_time,
            location,
            is_virtual,
            meeting_url,
            registration_url,
            max_participants,
            registration_deadline,
            requirements,
            tags,
            image_url,
            status = 'draft'
        } = req.body;

        if (!title || !description || !event_date || !start_time || !end_time) {
            return res.status(400).json({ error: 'Missing required event fields' });
        }

        const toNull = (value) => (value === undefined || value === '' ? null : value);
        const isVirtual = is_virtual === true || is_virtual === 'true';
        const parsedMaxParticipants = Number.isFinite(max_participants)
            ? max_participants
            : Number.isFinite(Number.parseInt(max_participants, 10))
                ? Number.parseInt(max_participants, 10)
                : null;

        const sanitized = {
            title,
            description,
            type: toNull(type) || 'workshop',
            event_date,
            start_time,
            end_time,
            location: toNull(location),
            is_virtual: isVirtual,
            meeting_url: toNull(meeting_url),
            registration_url: toNull(registration_url),
            max_participants: parsedMaxParticipants,
            registration_deadline: toNull(registration_deadline),
            requirements: toNull(requirements),
            tags: toNull(tags),
            image_url: toNull(image_url),
            status: toNull(status) || 'draft'
        };

        const bindParams = [
            companyId,
            sanitized.title,
            sanitized.description,
            sanitized.type,
            sanitized.event_date,
            sanitized.start_time,
            sanitized.end_time,
            sanitized.location,
            sanitized.is_virtual,
            sanitized.meeting_url,
            sanitized.registration_url,
            sanitized.max_participants,
            sanitized.registration_deadline,
            sanitized.requirements,
            sanitized.tags,
            sanitized.image_url,
            sanitized.status
        ].map((value) => (value === undefined ? null : value));
        let result;
        try {
            const query = `
                INSERT INTO events (
                    company_id, title, description, type, event_date, start_time, end_time,
                    location, is_virtual, meeting_url, registration_url, max_participants, registration_deadline,
                    requirements, tags, image_url, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            result = await db.query(query, bindParams);
        } catch (error) {
            if (!isSchemaError(error)) throw error;

            const fallbackQuery = `
                INSERT INTO events (
                    company_id, title, description, type, event_date, start_time, end_time,
                    location, is_virtual, meeting_url, max_participants, registration_deadline,
                    requirements, tags, image_url, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const fallbackParams = bindParams.filter((_, index) => index !== 10);
            result = await db.query(fallbackQuery, fallbackParams);
        }

        res.status(201).json({ id: result.insertId, message: 'Event created successfully' });
    } catch (error) {
        console.error('Error creating event:', error);
        if (isSchemaError(error)) {
            return res.status(500).json({ error: 'Database schema error. Please check event tables exist.' });
        }
        res.status(500).json({ error: error.message || 'Failed to create event' });
    }
};

/**
 * Update event
 */
const updateEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.user?.userId || req.user?.id;
        const {
            title,
            description,
            type,
            event_date,
            start_time,
            end_time,
            location,
            is_virtual,
            meeting_url,
            registration_url,
            max_participants,
            registration_deadline,
            requirements,
            tags,
            image_url,
            status
        } = req.body;

        if (!title || !description || !event_date || !start_time || !end_time) {
            return res.status(400).json({ error: 'Missing required event fields' });
        }

        const toNull = (value) => (value === undefined || value === '' ? null : value);
        const isVirtual = is_virtual === true || is_virtual === 'true';
        const parsedMaxParticipants = Number.isFinite(max_participants)
            ? max_participants
            : Number.isFinite(Number.parseInt(max_participants, 10))
                ? Number.parseInt(max_participants, 10)
                : null;

        // Check if event belongs to company
        const checkQuery = `SELECT company_id FROM events WHERE id = ?`;
        const events = await db.query(checkQuery, [id]);
        
        if (events.length === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }

        if (Number(events[0].company_id) !== Number(companyId)) {
            return res.status(403).json({ error: 'Not authorized to update this event' });
        }

        const updateParams = [
            title,
            description,
            toNull(type) || 'workshop',
            event_date,
            start_time,
            end_time,
            toNull(location),
            isVirtual,
            toNull(meeting_url),
            toNull(registration_url),
            parsedMaxParticipants,
            toNull(registration_deadline),
            toNull(requirements),
            toNull(tags),
            toNull(image_url),
            toNull(status) || 'draft',
            id
        ].map((value) => (value === undefined ? null : value));
        try {
            const query = `
                UPDATE events SET
                    title = ?, description = ?, type = ?, event_date = ?, start_time = ?,
                    end_time = ?, location = ?, is_virtual = ?, meeting_url = ?, registration_url = ?,
                    max_participants = ?, registration_deadline = ?, requirements = ?,
                    tags = ?, image_url = ?, status = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `;
            await db.query(query, updateParams);
        } catch (error) {
            if (!isSchemaError(error)) throw error;

            const fallbackQuery = `
                UPDATE events SET
                    title = ?, description = ?, type = ?, event_date = ?, start_time = ?,
                    end_time = ?, location = ?, is_virtual = ?, meeting_url = ?,
                    max_participants = ?, registration_deadline = ?, requirements = ?,
                    tags = ?, image_url = ?, status = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `;
            const fallbackParams = updateParams.filter((_, index) => index !== 9);
            await db.query(fallbackQuery, fallbackParams);
        }

        res.json({ message: 'Event updated successfully' });
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({ error: error.message || 'Failed to update event' });
    }
};

/**
 * Delete event
 */
const deleteEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.user?.userId || req.user?.id;
        const isAdmin = req.user?.role === 'admin';

        // Check if event belongs to company
        const checkQuery = `SELECT company_id FROM events WHERE id = ?`;
        const events = await db.query(checkQuery, [id]);
        
        if (events.length === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }

        if (!isAdmin && Number(events[0].company_id) !== Number(companyId)) {
            return res.status(403).json({ error: 'Not authorized to delete this event' });
        }

        await db.query('DELETE FROM events WHERE id = ?', [id]);
        res.json({ message: 'Event deleted successfully' });
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ error: error.message || 'Failed to delete event' });
    }
};

/**
 * Register for event
 */
const registerForEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const studentId = req.user?.userId || req.user?.id;

        // Check if event exists and is published
        const eventQuery = `SELECT * FROM events WHERE id = ? AND status = 'published'`;
        const events = await db.query(eventQuery, [id]);
        
        if (events.length === 0) {
            return res.status(404).json({ error: 'Event not found or not published' });
        }

        const event = events[0];

        // Check if registration deadline has passed
        if (event.registration_deadline && new Date(event.registration_deadline) < new Date()) {
            return res.status(400).json({ error: 'Registration deadline has passed' });
        }

        // Check if event is full
        if (event.max_participants && event.current_participants >= event.max_participants) {
            return res.status(400).json({ error: 'Event is full' });
        }

        // Check if already registered
        const existingQuery = `SELECT id FROM event_registrations WHERE event_id = ? AND student_id = ?`;
        const existing = await db.query(existingQuery, [id, studentId]);
        
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Already registered for this event' });
        }

        // Register for event using a single connection to ensure transaction safety
        const conn = await db.pool.getConnection();
        try {
            await conn.beginTransaction();

            await conn.execute(
                'INSERT INTO event_registrations (event_id, student_id) VALUES (?, ?)',
                [id, studentId]
            );

            // Update current participants count
            await conn.execute(
                'UPDATE events SET current_participants = current_participants + 1 WHERE id = ?',
                [id]
            );

            await conn.commit();
            res.status(201).json({ message: 'Successfully registered for event' });
        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error('Error registering for event:', error);
        if (isSchemaError(error)) {
            return res.status(500).json({ error: 'Database schema error. Please run migrations for events.' });
        }
        if (isDuplicateEntry(error)) {
            return res.status(400).json({ error: 'Already registered for this event' });
        }
        res.status(500).json({ error: error.message || 'Failed to register for event' });
    }
};

/**
 * Unregister from event
 */
const unregisterFromEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const studentId = req.user?.userId || req.user?.id;

        // Check if registered
        const existingQuery = `SELECT id FROM event_registrations WHERE event_id = ? AND student_id = ?`;
        const existing = await db.query(existingQuery, [id, studentId]);
        
        if (existing.length === 0) {
            return res.status(400).json({ error: 'Not registered for this event' });
        }

        const conn = await db.pool.getConnection();
        try {
            await conn.beginTransaction();

            await conn.execute(
                'DELETE FROM event_registrations WHERE event_id = ? AND student_id = ?',
                [id, studentId]
            );

            // Update current participants count
            await conn.execute(
                'UPDATE events SET current_participants = current_participants - 1 WHERE id = ? AND current_participants > 0',
                [id]
            );

            await conn.commit();
            res.json({ message: 'Successfully unregistered from event' });
        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error('Error unregistering from event:', error);
        if (isSchemaError(error)) {
            return res.status(500).json({ error: 'Database schema error. Please run migrations for events.' });
        }
        res.status(500).json({ error: error.message || 'Failed to unregister from event' });
    }
};

/**
 * Get event registrations (for companies)
 */
const getEventRegistrations = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.user?.userId || req.user?.id;

        // Check if event belongs to company
        const checkQuery = `SELECT company_id FROM events WHERE id = ?`;
        const events = await db.query(checkQuery, [id]);
        
        if (events.length === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }

        if (Number(events[0].company_id) !== Number(companyId)) {
            return res.status(403).json({ error: 'Not authorized to view registrations for this event' });
        }

        const registrationsQuery = `
            SELECT
                er.id,
                er.registration_date,
                er.status,
                er.notes,
                u.id as student_id,
                u.full_name,
                u.email,
                u.phone AS phone,
                COALESCE(s.university, u.university) AS university,
                COALESCE(s.current_education_level, u.education) AS education,
                COALESCE(s.graduation_year, u.graduation_year) AS graduation_year,
                COALESCE(s.resume_url, u.cv_url) AS cv_url
            FROM event_registrations er
            JOIN users u ON er.student_id = u.id
            LEFT JOIN students s ON s.user_id = u.id
            WHERE er.event_id = ?
            ORDER BY er.registration_date ASC
        `;

        const fallbackRegistrationsQuery = `
            SELECT
                er.id,
                er.registration_date,
                er.status,
                er.notes,
                u.id as student_id,
                u.full_name,
                u.email,
                u.phone AS phone,
                u.university AS university,
                u.education AS education,
                u.graduation_year AS graduation_year,
                u.cv_url AS cv_url
            FROM event_registrations er
            JOIN users u ON er.student_id = u.id
            WHERE er.event_id = ?
            ORDER BY er.registration_date ASC
        `;

        let registrations;
        try {
            registrations = await db.query(registrationsQuery, [id]);
        } catch (error) {
            if (!isSchemaError(error)) throw error;
            registrations = await db.query(fallbackRegistrationsQuery, [id]);
        }
        res.json(registrations);
    } catch (error) {
        console.error('Error fetching event registrations:', error);
        res.status(500).json({ error: 'Failed to fetch event registrations' });
    }
};

module.exports = {
    getAllEvents,
    getFeaturedEvents,
    getUpcomingEvents,
    getEventById,
    getCompanyEvents,
    getCompanyEventStats,
    getStudentRegisteredEvents,
    getRecommendedEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    registerForEvent,
    unregisterFromEvent,
    getEventRegistrations
};
