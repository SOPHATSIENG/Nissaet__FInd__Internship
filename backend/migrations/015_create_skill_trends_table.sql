-- Create skill_trends table
CREATE TABLE IF NOT EXISTS skill_trends (
    id INT AUTO_INCREMENT PRIMARY KEY,
    skill_id INT NOT NULL,
    date DATE NOT NULL,
    demand_count INT DEFAULT 0,
    supply_count INT DEFAULT 0,
    average_salary DECIMAL(10,2),
    growth_rate DECIMAL(5,2), -- percentage
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,
    UNIQUE KEY unique_skill_date (skill_id, date),
    INDEX idx_skill_id (skill_id),
    INDEX idx_date (date),
    INDEX idx_demand_count (demand_count),
    INDEX idx_growth_rate (growth_rate)
);
