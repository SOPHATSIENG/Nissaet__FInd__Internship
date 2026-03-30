ALTER TABLE internships
ADD COLUMN stipend_max DECIMAL(10,2) NULL AFTER stipend;

UPDATE internships
SET stipend_max = stipend
WHERE stipend_max IS NULL;
