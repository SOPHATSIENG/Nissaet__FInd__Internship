-- Add positions column to internships table
ALTER TABLE internships ADD COLUMN positions INT DEFAULT 1 AFTER stipend_currency;
