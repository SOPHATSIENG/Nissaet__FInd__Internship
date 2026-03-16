const db = require('./config/db');

async function getAllApplications() {
  try {
    // Get ALL applications from database without company filter
    const applications = await db.query(`
      SELECT
        a.id,
        a.student_id,
        a.internship_id,
        a.cover_letter,
        a.resume_url,
        a.status,
        a.applied_at,
        a.updated_at,
        u.full_name,
        u.email,
        u.phone,
        s.university,
        s.current_education_level,
        s.major,
        i.title AS internship_title,
        i.company_id,
        c.name AS company_name
      FROM applications a
      JOIN students s ON a.student_id = s.id
      JOIN users u ON s.user_id = u.id
      JOIN internships i ON a.internship_id = i.id
      JOIN companies c ON i.company_id = c.id
      ORDER BY a.applied_at DESC
    `);
    
    console.log('All applications from database:');
    console.log('Total:', applications.length);
    applications.forEach((app, index) => {
      console.log(`${index + 1}. ${app.full_name} - ${app.internship_title} (${app.company_name})`);
    });
    
    return applications;
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}

getAllApplications().then(applications => {
  console.log('\nFinal result:', applications.length, 'applications');
  process.exit(0);
}).catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
