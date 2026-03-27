ALTER TABLE posts
ADD COLUMN event_id INT NULL AFTER internship_id,
ADD UNIQUE KEY uq_posts_event_id (event_id),
ADD INDEX idx_posts_event_id (event_id),
ADD CONSTRAINT fk_posts_event_id
  FOREIGN KEY (event_id) REFERENCES events(id)
  ON DELETE CASCADE;
