-- Add profile settings columns used by dynamic account settings
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS profile_image LONGTEXT NULL,
    ADD COLUMN IF NOT EXISTS notify_internship_matches_email BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS notify_internship_matches_in_app BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS notify_application_status_email BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS notify_application_status_in_app BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS notify_career_tips_email BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS notify_career_tips_in_app BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS notify_frequency ENUM('Instant', 'Daily', 'Weekly') DEFAULT 'Daily',
    ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE;
