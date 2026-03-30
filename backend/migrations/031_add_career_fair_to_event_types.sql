-- Add career fair to events type enum
ALTER TABLE events
    MODIFY COLUMN type ENUM('workshop', 'seminar', 'webinar', 'competition', 'networking', 'career_fair', 'other')
    DEFAULT 'workshop';
