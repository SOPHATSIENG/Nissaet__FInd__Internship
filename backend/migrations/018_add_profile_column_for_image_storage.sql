-- FIX MARK: add profile column for avatar storage so uploaded image can be saved.
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS profile LONGTEXT NULL;
