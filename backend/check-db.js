const db = require('./config/db');

async function checkDatabase() {
  try {
    console.log('Checking database contents...');
    
    // Check if there are any students
    const students = await db.query('SELECT COUNT(*) as count FROM students');
    console.log('Total students:', students[0].count);
    
    // Check if there are any applications
    const applications = await db.query('SELECT COUNT(*) as count FROM applications');
    console.log('Total applications:', applications[0].count);
    
    // Check if there are any internships
    const internships = await db.query('SELECT COUNT(*) as count FROM internships');
    console.log('Total internships:', internships[0].count);
    
    // Show sample data if exists
    if (applications[0].count > 0) {
      const sampleApps = await db.query(`
        SELECT a.*, u.full_name, u.email, i.title as internship_title 
        FROM applications a 
        JOIN users u ON a.student_id = (SELECT id FROM students WHERE user_id = u.id) 
        JOIN internships i ON a.internship_id = i.id 
        LIMIT 5
      `);
      console.log('Sample applications:', sampleApps);
    } else {
      console.log('No applications found in database');
    }
    
    // Check if there are any users with student role
    const studentUsers = await db.query(`
      SELECT COUNT(*) as count FROM users u 
      JOIN students s ON u.id = s.user_id
    `);
    console.log('Users with student profiles:', studentUsers[0].count);
    
  } catch (error) {
    console.error('Database error:', error);
  } finally {
    process.exit(0);
  }
}

checkDatabase();
