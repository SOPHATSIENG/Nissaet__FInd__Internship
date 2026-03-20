-- Normalize internship company_id to companies.id when it currently stores users.id
UPDATE internships i
JOIN companies c ON c.user_id = i.company_id
SET i.company_id = c.id;
