-- Add image column for internship posts
ALTER TABLE internships
  ADD COLUMN IF NOT EXISTS image LONGTEXT NULL AFTER description;
