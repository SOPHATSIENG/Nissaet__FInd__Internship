-- FIX MARK: add profile column for avatar storage so uploaded image can be saved. (MySQL 5.7 compatible)
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'profile');
SET @sql := IF(@col_exists = 0, 'ALTER TABLE users ADD COLUMN profile LONGTEXT NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
