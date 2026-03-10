const db = require('./config/db');

async function checkApplicationDetails() {
  try {
    const applications = await db.query(`
      SELECT a.*, u.full_name, u.email, u.phone, s.university, s.education, i.title as internship_title, c.company_name
      FROM applications a 
      JOIN students s ON a.student_id = s.id
      JOIN users u ON s.user_id = u.id
      JOIN internships i ON a.internship_id = i.id
      JOIN companies c ON i.company_id = c.id
      LIMIT 1
    `);
    
    console.log('Application structure:', JSON.stringify(applications[0], null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkApplicationDetails();
