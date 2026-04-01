-- Add status column to users for admin management (MySQL 5.7 compatible)
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'status');
SET @sql := IF(@col_exists = 0, 'ALTER TABLE users ADD COLUMN status ENUM(''active'', ''pending'', ''suspended'') DEFAULT ''active''', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
