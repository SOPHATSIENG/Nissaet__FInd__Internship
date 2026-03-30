const db = require('../config/db');

async function checkCompanyApplications() {
  try {
    // Check internships and their applications
    const internships = await db.query(`
      SELECT 
        i.id as internship_id,
        i.title,
        i.company_id,
        c.name as company_name,
        c.user_id,
        COUNT(a.id) as application_count
      FROM internships i
      LEFT JOIN companies c ON i.company_id = c.id
      LEFT JOIN applications a ON i.id = a.internship_id
      GROUP BY i.id, i.title, i.company_id, c.name, c.user_id
      ORDER BY application_count DESC
    `);
    
    console.log('Internships with applications:');
    internships.forEach(row => {
      console.log(`Internship ID: ${row.internship_id}`);
      console.log(`Title: ${row.title}`);
      console.log(`Company: ${row.company_name} (User ID: ${row.user_id})`);
      console.log(`Applications: ${row.application_count}`);
      console.log('---');
    });
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkCompanyApplications();
