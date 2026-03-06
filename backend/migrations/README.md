# Database Migrations

This directory contains SQL migration files for the Nissaet internship database.

## Migration Files

The migrations are numbered and will be executed in order:

1. `001_create_users_table.sql` - Users table with authentication and profile data
2. `002_create_categories_table.sql` - Categories for internships
3. `003_create_companies_table.sql` - Company profiles linked to users
4. `004_create_students_table.sql` - Student profiles linked to users
5. `005_create_skills_table.sql` - Skills database
6. `006_create_internships_table.sql` - Internship postings
7. `007_create_applications_table.sql` - Student applications to internships
8. `008_create_internship_skills_table.sql` - Junction table for internship requirements
9. `009_create_student_skills_table.sql` - Junction table for student skills
10. `010_create_user_skills_table.sql` - Junction table for user skills
11. `011_create_notifications_table.sql` - User notifications
12. `012_create_page_views_table.sql` - Analytics for page views
13. `013_create_reviews_table.sql` - Internship reviews
14. `014_create_saved_internships_table.sql` - Bookmarked internships
15. `015_create_skill_trends_table.sql` - Skill demand trends
16. `016_create_user_tokens_table.sql` - Authentication tokens

## Running Migrations

### Setup Environment Variables

Make sure your `.env` file contains:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=nissaet_db
```

### Commands

- **Run all pending migrations:**
  ```bash
  npm run migrate
  ```

- **Check migration status:**
  ```bash
  npm run migrate:status
  ```

- **Rollback a specific migration:**
  ```bash
  npm run migrate:rollback 001_create_users_table.sql
  ```

## Database Schema Features

### Primary Keys
- All tables use `INT AUTO_INCREMENT PRIMARY KEY` named `id`

### Foreign Keys
- Proper relationships with `ON DELETE CASCADE` where appropriate
- Referential integrity maintained across all related tables

### Indexes
- Performance indexes on frequently queried columns
- Composite indexes for complex queries
- Unique constraints where data uniqueness is required

### Timestamps
- `created_at` with `DEFAULT CURRENT_TIMESTAMP`
- `updated_at` with automatic update on row changes

### Constraints
- `ENUM` types for controlled values
- `CHECK` constraints for data validation
- `UNIQUE` constraints for preventing duplicates

## Best Practices Followed

1. **Naming Convention:** Descriptive table and column names
2. **Data Types:** Appropriate data types for storage efficiency
3. **Normalization:** Proper database normalization
4. **Performance:** Strategic indexing for query optimization
5. **Scalability:** Design supports future growth
6. **Security:** Proper constraints and validation

## Migration System

The migration system tracks executed migrations in a `migrations` table and prevents re-execution. Each migration runs in a transaction, ensuring atomicity - either all changes succeed or none are applied.
