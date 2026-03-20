-- Add status column to users for admin management
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS status ENUM('active', 'pending', 'suspended') DEFAULT 'active';
