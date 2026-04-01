-- Add stipend_max column if missing (MySQL 5.7 compatible)
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'internships' AND COLUMN_NAME = 'stipend_max');
SET @sql := IF(@col_exists = 0, 'ALTER TABLE internships ADD COLUMN stipend_max DECIMAL(10,2) NULL AFTER stipend', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE internships
SET stipend_max = stipend
WHERE stipend_max IS NULL;
