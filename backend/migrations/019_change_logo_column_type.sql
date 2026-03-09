-- Change logo column to LONGTEXT to support base64 images
ALTER TABLE companies
    MODIFY COLUMN logo LONGTEXT;
