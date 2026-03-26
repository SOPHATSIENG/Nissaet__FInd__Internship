const db = require('./config/db');
const bcrypt = require('bcryptjs');

async function createTestUser() {
  try {
    const email = 'testuser@example.com';
    const password = 'Password123';
    const fullName = 'Test User';
    const role = 'student';
    
    // Check if user already exists
    const users = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (users.length > 0) {
      console.log('User already exists. Deleting it first...');
      await db.query('DELETE FROM users WHERE id = ?', [users[0].id]);
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert user with fallback for password/password_hash and full_name/name
    let result;
    try {
      result = await db.query(
        'INSERT INTO users (email, password, role, full_name) VALUES (?, ?, ?, ?)',
        [email, hashedPassword, role, fullName]
      );
    } catch (err) {
      try {
        result = await db.query(
          'INSERT INTO users (email, password_hash, role, full_name) VALUES (?, ?, ?, ?)',
          [email, hashedPassword, role, fullName]
        );
      } catch (err2) {
        try {
          result = await db.query(
            'INSERT INTO users (email, password, role, name) VALUES (?, ?, ?, ?)',
            [email, hashedPassword, role, fullName]
          );
        } catch (err3) {
          result = await db.query(
            'INSERT INTO users (email, password_hash, role, name) VALUES (?, ?, ?, ?)',
            [email, hashedPassword, role, fullName]
          );
        }
      }
    }
    
    const userId = result.insertId;
    console.log(`User created successfully with ID: ${userId}`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    
    // Create student profile
    try {
      await db.query(
        'INSERT INTO students (user_id, university, major, current_education_level) VALUES (?, ?, ?, ?)',
        [userId, 'Test University', 'Computer Science', 'undergraduate']
      );
      console.log('Student profile created successfully!');
    } catch (err) {
      console.error('Error creating student profile:', err.message);
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Fatal Error:', err);
    process.exit(1);
  }
}

createTestUser();
