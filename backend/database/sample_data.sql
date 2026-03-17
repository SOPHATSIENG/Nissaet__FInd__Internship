-- ============================================================================
-- NISSAET PROJECT - SAMPLE DATA FOR CLOUD DATABASE
-- ============================================================================
-- Run this file in phpMyAdmin or MySQL client to populate test data
-- IMPORTANT: Uses ID 100+ to avoid conflicts with existing data
-- ============================================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================================
-- INSERT USERS (Start from ID 100)
-- ============================================================================

INSERT INTO `users` (`id`, `email`, `password`, `full_name`, `role`, `phone`, `dob`, `address`, `education`, `university`, `graduation_year`, `bio`, `company_name`, `industry`, `location`, `website`, `contact_person`, `contact_phone`) VALUES
(100, 'admin@nissaet.com', '$2a$10$pBQZEXh0nIavzgPc7YE2tOGbZdBTmEgCLGyWe8fcf6twVi1htZruC', 'Admin User', 'admin', '+85512345678', '1990-01-01', 'Phnom Penh, Cambodia', 'Bachelor of Computer Science', 'Royal University of Phnom Penh', 2012, 'System administrator', NULL, NULL, NULL, NULL, NULL, NULL),
(101, 'techcorp@example.com', '$2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 'Tech Corp HR', 'company', '+85598765432', '1985-05-15', 'Phnom Penh, Cambodia', 'Bachelor of Business', 'National University of Cambodia', 2008, NULL, 'Tech Corp Cambodia', 'Technology', 'Phnom Penh', 'https://techcorp.com.kh', 'John Smith', '+85598765432'),
(102, 'designstudio@example.com', '$2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 'Design Studio HR', 'company', '+85591234567', '1988-03-20', 'Siem Reap, Cambodia', 'Bachelor of Design', 'University of Cambodia', 2010, NULL, 'Creative Design Studio', 'Design', 'Siem Reap', 'https://creativedesign.studio', 'Sarah Lee', '+85591234567'),
(103, 'financeplus@example.com', '$2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 'Finance Plus HR', 'company', '+85596789012', '1987-08-10', 'Phnom Penh, Cambodia', 'MBA', 'Pannastra University', 2009, NULL, 'Finance Plus Co.', 'Finance', 'Phnom Penh', 'https://financeplus.com.kh', 'David Chen', '+85596789012'),
(104, 'student1@example.com', '$2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 'Sokha Pen', 'student', '+85569789012', '2003-06-15', 'Phnom Penh, Cambodia', 'undergraduate', 'Royal University of Phnom Penh', 2025, 'Computer Science student', NULL, NULL, NULL, NULL, NULL),
(105, 'student2@example.com', '$2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 'Davida Kim', 'student', '+85568789012', '2002-11-20', 'Siem Reap, Cambodia', 'undergraduate', 'National University of Cambodia', 2024, 'Design student', NULL, NULL, NULL, NULL, NULL),
(106, 'student3@example.com', '$2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 'Rithy Ny', 'student', '+85567789012', '2003-03-08', 'Battambang, Cambodia', 'undergraduate', 'University of Battambang', 2026, 'Business major', NULL, NULL, NULL, NULL, NULL),
(107, 'student4@example.com', '$2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 'Sreysor Ear', 'student', '+85566789012', '2002-09-25', 'Phnom Penh, Cambodia', 'graduate', 'Royal University of Phnom Penh', 2023, 'Finance graduate', NULL, NULL, NULL, NULL, NULL);

-- ============================================================================
-- INSERT COMPANIES (Start from ID 100)
-- ============================================================================

INSERT INTO `companies` (`id`, `user_id`, `name`, `description`, `industry`, `website`, `logo`, `company_size`, `founded_year`, `headquarters`, `is_verified`) VALUES
(100, 101, 'Tech Corp Cambodia', 'A leading technology company.', 'Technology', 'https://techcorp.com.kh', 'https://picsum.photos/seed/company1/200/200', '51-200', 2015, 'Phnom Penh', 1),
(101, 102, 'Creative Design Studio', 'A boutique design agency.', 'Design', 'https://creativedesign.studio', 'https://picsum.photos/seed/company2/200/200', '11-50', 2018, 'Siem Reap', 1),
(102, 103, 'Finance Plus Co.', 'A professional accounting firm.', 'Finance', 'https://financeplus.com.kh', 'https://picsum.photos/seed/company3/200/200', '11-50', 2017, 'Phnom Penh', 1),
(103, 101, 'Digital Marketing Hub', 'A digital marketing agency.', 'Marketing', 'https://digitalmarketinghub.com', 'https://picsum.photos/seed/company4/200/200', '1-10', 2020, 'Phnom Penh', 0),
(104, 103, 'Smart Retail Solutions', 'A retail technology company.', 'Retail Technology', 'https://smartretail.kh', 'https://picsum.photos/seed/company5/200/200', '11-50', 2019, 'Phnom Penh', 0);

-- ============================================================================
-- INSERT SKILLS
-- ============================================================================

INSERT INTO `skills` (`id`, `name`, `description`, `category`, `is_active`) VALUES
(1, 'JavaScript', 'Programming language', 'Programming', 1),
(2, 'React.js', 'JavaScript library', 'Frontend', 1),
(3, 'Node.js', 'JavaScript runtime', 'Backend', 1),
(4, 'Python', 'Programming language', 'Programming', 1),
(5, 'HTML/CSS', 'Web markup and style', 'Frontend', 1),
(6, 'UI/UX Design', 'User interface design', 'Design', 1),
(7, 'Figma', 'Design tool', 'Design', 1),
(8, 'Adobe XD', 'Design tool', 'Design', 1),
(9, 'Photoshop', 'Image editing', 'Design', 1),
(10, 'Accounting', 'Financial skills', 'Finance', 1),
(11, 'Financial Analysis', 'Analyzing financial data', 'Finance', 1),
(12, 'Excel', 'Spreadsheet software', 'Office', 1),
(13, 'Digital Marketing', 'Online marketing', 'Marketing', 1),
(14, 'SEO', 'Search optimization', 'Marketing', 1),
(15, 'Social Media', 'Social management', 'Marketing', 1),
(16, 'Content Writing', 'Writing content', 'Content', 1),
(17, 'Data Analysis', 'Analyzing data', 'Data', 1),
(18, 'SQL', 'Database language', 'Programming', 1),
(19, 'TypeScript', 'Typed JavaScript', 'Programming', 1),
(20, 'Vue.js', 'JavaScript framework', 'Frontend', 1);

-- ============================================================================
-- INSERT STUDENTS (user_id 104-107)
-- ============================================================================

INSERT INTO `students` (`id`, `user_id`, `date_of_birth`, `gender`, `nationality`, `current_education_level`, `university`, `major`, `graduation_year`, `gpa`, `resume_url`, `linkedin_url`, `portfolio_url`, `is_available`) VALUES
(1, 104, '2003-06-15', 'male', 'Cambodian', 'undergraduate', 'Royal University of Phnom Penh', 'Computer Science', 2025, 3.75, '', '', '', 1),
(2, 105, '2002-11-20', 'female', 'Cambodian', 'undergraduate', 'National University of Cambodia', 'Graphic Design', 2024, 3.60, '', '', '', 1),
(3, 106, '2003-03-08', 'male', 'Cambodian', 'undergraduate', 'University of Battambang', 'Business Administration', 2026, 3.45, '', '', NULL, 1),
(4, 107, '2002-09-25', 'male', 'Cambodian', 'graduate', 'Royal University of Phnom Penh', 'Accounting', 2023, 3.80, '', '', NULL, 1);

-- ============================================================================
-- INSERT INTERNSHIPS (company_id 100-104)
-- ============================================================================

INSERT INTO `internships` (`id`, `company_id`, `title`, `description`, `requirements`, `responsibilities`, `benefits`, `location`, `is_remote`, `is_hybrid`, `type`, `duration_months`, `stipend`, `stipend_currency`, `application_deadline`, `start_date`, `end_date`, `status`, `views_count`, `applications_count`) VALUES
(1, 100, 'Frontend Developer Intern', ' .', 'CS student, HTML/CSS/JS knowledge', 'Develop web apps, write code', '$300/month, Certificate', 'Phnom Penh', 0, 1, 'full-time', 6, 300.00, 'USD', '2025-04-30', '2025-05-01', '2025-10-31', 'active', 145, 8),
(2, 100, 'Backend Developer Intern', 'Develop server-side apps.', 'CS student, Node.js knowledge', 'API development, database work', '$350/month, Certificate', 'Phnom Penh', 0, 1, 'full-time', 6, 350.00, 'USD', '2025-05-15', '2025-06-01', '2025-11-30', 'active', 98, 5),
(3, 101, 'UI/UX Design Intern', 'Design user interfaces.', 'Design student, Figma knowledge', 'Create UI designs', '$250/month, Certificate', 'Siem Reap', 0, 1, 'full-time', 4, 250.00, 'USD', '2025-05-01', '2025-05-15', '2025-09-14', 'active', 203, 12),
(4, 101, 'Graphic Design Intern', 'Create visual content.', 'Design student, Adobe skills', 'Design materials', '$200/month, Portfolio', 'Siem Reap', 0, 0, 'part-time', 3, 200.00, 'USD', '2025-04-25', '2025-05-10', '2025-08-09', 'active', 156, 7),
(5, 102, 'Accounting Intern', 'Learn accounting.', 'Accounting student', 'Assist with bookkeeping', '$280/month, Training', 'Phnom Penh', 0, 1, 'full-time', 6, 280.00, 'USD', '2025-05-20', '2025-06-01', '2025-12-01', 'active', 87, 4),
(6, 102, 'Financial Analyst Intern', 'Analyze financial data.', 'Finance student, Excel skills', 'Prepare reports', '$300/month, Experience', 'Phnom Penh', 0, 1, 'full-time', 4, 300.00, 'USD', '2025-05-10', '2025-06-01', '2025-09-30', 'active', 112, 6),
(7, 103, 'Digital Marketing Intern', 'Learn digital marketing.', 'Marketing student', 'Social media management', '$200/month, Experience', 'Phnom Penh', 1, 0, 'full-time', 3, 200.00, 'USD', '2025-04-28', '2025-05-15', '2025-08-14', 'active', 178, 9),
(8, 103, 'Content Writer Intern', 'Write content.', 'Communications student', 'Write articles', '$180/month, Portfolio', 'Remote', 1, 0, 'part-time', 3, 180.00, 'USD', '2025-05-05', '2025-05-20', '2025-08-19', 'active', 134, 6),
(9, 104, 'Software Testing Intern', 'Test software.', 'CS student', 'Execute test cases', '$250/month, Experience', 'Phnom Penh', 0, 1, 'full-time', 4, 250.00, 'USD', '2025-05-12', '2025-06-01', '2025-09-30', 'active', 76, 3),
(10, 100, 'Data Analysis Intern', 'Analyze data.', 'Statistics student, SQL knowledge', 'Analyze data sets', '$320/month, Mentorship', 'Phnom Penh', 0, 1, 'full-time', 6, 320.00, 'USD', '2025-05-08', '2025-06-01', '2025-11-30', 'active', 189, 10);

-- ============================================================================
-- INSERT INTERNSHIP SKILLS
-- ============================================================================

INSERT INTO `internship_skills` (`internship_id`, `skill_id`, `skill_level`, `is_required`) VALUES
(1, 1, 'intermediate', 1),
(1, 2, 'intermediate', 1),
(1, 5, 'intermediate', 1),
(2, 1, 'intermediate', 1),
(2, 3, 'intermediate', 1),
(2, 18, 'intermediate', 1),
(3, 6, 'intermediate', 1),
(3, 7, 'intermediate', 1),
(4, 6, 'beginner', 1),
(4, 7, 'intermediate', 1),
(4, 9, 'intermediate', 1),
(5, 10, 'intermediate', 1),
(5, 12, 'intermediate', 1),
(6, 11, 'intermediate', 1),
(6, 12, 'intermediate', 1),
(7, 13, 'intermediate', 1),
(7, 14, 'beginner', 1),
(8, 16, 'intermediate', 1),
(8, 13, 'beginner', 1),
(9, 1, 'beginner', 1),
(9, 12, 'intermediate', 1),
(10, 17, 'intermediate', 1),
(10, 18, 'intermediate', 1),
(10, 12, 'intermediate', 1);

-- ============================================================================
-- INSERT CATEGORIES
-- ============================================================================

INSERT INTO `categories` (`id`, `name`, `description`, `icon`, `color`, `is_active`) VALUES
(1, 'Technology', 'Software development', 'code', '#3b82f6', 1),
(2, 'Design', 'UI/UX and creative', 'palette', '#8b5cf6', 1),
(3, 'Finance', 'Accounting and finance', 'dollar-sign', '#10b981', 1),
(4, 'Marketing', 'Digital marketing', 'megaphone', '#f59e0b', 1),
(5, 'Business', 'Business management', 'briefcase', '#6366f1', 1),
(6, 'Engineering', 'Technical internships', 'cpu', '#ec4899', 1);

-- ============================================================================
-- INSERT STUDENT SKILLS
-- ============================================================================

INSERT INTO `student_skills` (`student_id`, `skill_id`, `skill_level`, `years_experience`, `is_primary`) VALUES
(1, 1, 'intermediate', 2, 1),
(1, 2, 'intermediate', 1, 1),
(1, 5, 'advanced', 2, 0),
(2, 6, 'intermediate', 2, 1),
(2, 7, 'advanced', 3, 1),
(3, 13, 'intermediate', 1, 1),
(3, 15, 'intermediate', 2, 1),
(4, 10, 'intermediate', 1, 1),
(4, 12, 'advanced', 3, 1);

-- ============================================================================
-- INSERT SAMPLE APPLICATIONS
-- ============================================================================

INSERT INTO `applications` (`internship_id`, `student_id`, `cover_letter`, `resume_url`, `status`, `notes`) VALUES
(1, 1, 'I am interested in this position.', '', 'pending', NULL),
(1, 2, 'I want to expand my skills.', '', 'reviewing', NULL),
(3, 2, 'I am passionate about UI/UX.', '', 'pending', NULL),
(5, 4, 'Excited to apply.', '', 'accepted', NULL),
(7, 3, 'Enthusiastic about marketing.', '', 'pending', NULL),
(10, 1, 'Want to develop data skills.', '', 'reviewing', NULL);

-- ============================================================================
-- RE-ENABLE FOREIGN KEY CHECKS
-- ============================================================================
SET FOREIGN_KEY_CHECKS = 1;

