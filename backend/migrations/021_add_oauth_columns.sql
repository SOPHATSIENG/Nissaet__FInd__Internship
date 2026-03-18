-- Add Google and GitHub OAuth columns to users table
ALTER TABLE users 
ADD COLUMN google_id VARCHAR(255) NULL,
ADD COLUMN github_id VARCHAR(255) NULL;

-- Add indexes for OAuth columns for faster lookups
ALTER TABLE users 
ADD INDEX idx_google_id (google_id),
ADD INDEX idx_github_id (github_id);

