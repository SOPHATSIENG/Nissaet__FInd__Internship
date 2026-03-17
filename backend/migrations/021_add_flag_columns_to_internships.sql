-- Add flag columns to internships table
ALTER TABLE internships
    ADD COLUMN is_flagged BOOLEAN DEFAULT FALSE AFTER status,
    ADD COLUMN flag_reason TEXT AFTER is_flagged,
    ADD COLUMN flagged_at TIMESTAMP NULL AFTER flag_reason;
