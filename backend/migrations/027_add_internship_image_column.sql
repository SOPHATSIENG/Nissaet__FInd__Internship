-- Add image column for internship posts (MySQL 5.7 compatible)
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'internships' AND COLUMN_NAME = 'image');
SET @sql := IF(@col_exists = 0, 'ALTER TABLE internships ADD COLUMN image LONGTEXT NULL AFTER description', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
