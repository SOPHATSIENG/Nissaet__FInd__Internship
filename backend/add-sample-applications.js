const db = require('./config/db');

async function addSampleApplications() {
  try {
    console.log('Adding sample applications...');
    
    // Get existing students and internships
    const students = await db.query('SELECT s.id, s.user_id, u.full_name, u.email FROM students s JOIN users u ON s.user_id = u.id LIMIT 3');
    const internships = await db.query('SELECT id, title FROM internships LIMIT 3');
    
    console.log('Students:', students);
    console.log('Internships:', internships);
    
    if (students.length === 0 || internships.length === 0) {
      console.log('No students or internships found. Please create some first.');
      return;
    }
    
    // Add sample applications
    for (let i = 0; i < Math.min(students.length, internships.length); i++) {
      const student = students[i];
      const internship = internships[i];
      
      // Check if application already exists
      const existing = await db.query(
        'SELECT id FROM applications WHERE student_id = ? AND internship_id = ?',
        [student.id, internship.id]
      );
      
      if (existing.length === 0) {
        await db.query(
          'INSERT INTO applications (student_id, internship_id, cover_letter, status) VALUES (?, ?, ?, ?)',
          [student.id, internship.id, 'I am very interested in this internship opportunity.', 'pending']
        );
        
        // Update internship applications count
        await db.query(
          'UPDATE internships SET applications_count = applications_count + 1 WHERE id = ?',
          [internship.id]
        );
        
        console.log(`Added application: ${student.full_name} -> ${internship.title}`);
      } else {
        console.log(`Application already exists: ${student.full_name} -> ${internship.title}`);
      }
    }
    
    console.log('Sample applications added successfully!');
    
  } catch (error) {
    console.error('Error adding sample applications:', error);
  } finally {
    process.exit(0);
  }
}

addSampleApplications();
