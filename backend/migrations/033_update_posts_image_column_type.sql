-- Ensure posts can store long image URLs or base64 data
ALTER TABLE posts
  MODIFY COLUMN image_url LONGTEXT;
