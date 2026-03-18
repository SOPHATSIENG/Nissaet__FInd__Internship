-- Change event image_url to LONGTEXT to support base64 images
ALTER TABLE events
    MODIFY COLUMN image_url LONGTEXT NULL;
