-- Add login/activity tracking columns for user sessions
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS last_login_at DATETIME NULL,
    ADD COLUMN IF NOT EXISTS last_active_at DATETIME NULL,
    ADD INDEX idx_last_login_at (last_login_at),
    ADD INDEX idx_last_active_at (last_active_at);
