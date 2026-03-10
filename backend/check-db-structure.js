const db = require('./config/db');

async function checkDBStructure() {
  try {
    console.log('Checking students table structure...');
    const students = await db.query('DESCRIBE students');
    console.log('Students table:', students);
    
    console.log('\nChecking applications table structure...');
    const applications = await db.query('DESCRIBE applications');
    console.log('Applications table:', applications);
    
    console.log('\nChecking actual application data...');
    const appData = await db.query(`
      SELECT a.*, u.full_name, u.email, u.phone, s.university, i.title as internship_title, c.company_name
      FROM applications a 
      JOIN students s ON a.student_id = s.id
      JOIN users u ON s.user_id = u.id
      JOIN internships i ON a.internship_id = i.id
      JOIN companies c ON i.company_id = c.id
      LIMIT 1
    `);
    
    if (appData.length > 0) {
      console.log('Sample application data:', JSON.stringify(appData[0], null, 2));
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkDBStructure();
