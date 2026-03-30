ALTER TABLE posts
ADD COLUMN internship_id INT NULL AFTER post_type,
ADD UNIQUE KEY uq_posts_internship_id (internship_id),
ADD INDEX idx_posts_internship_id (internship_id),
ADD CONSTRAINT fk_posts_internship_id
  FOREIGN KEY (internship_id) REFERENCES internships(id)
  ON DELETE CASCADE;
