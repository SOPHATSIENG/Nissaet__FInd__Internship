-- Create internship_skills table (junction table)
CREATE TABLE IF NOT EXISTS internship_skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    internship_id INT NOT NULL,
    skill_id INT NOT NULL,
    skill_level ENUM('beginner', 'intermediate', 'advanced', 'expert') DEFAULT 'intermediate',
    is_required BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (internship_id) REFERENCES internships(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,
    UNIQUE KEY unique_internship_skill (internship_id, skill_id),
    INDEX idx_internship_id (internship_id),
    INDEX idx_skill_id (skill_id),
    INDEX idx_is_required (is_required)
);
