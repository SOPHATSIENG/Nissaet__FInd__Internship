const db = require('./config/db');
const bcrypt = require('bcrypt');

async function createTestCompany() {
  try {
    const hashedPassword = await bcrypt.hash('test123', 10);
    
    // Insert user
    const userResult = await db.query(
      'INSERT INTO users (email, password, role, full_name) VALUES (?, ?, ?, ?)',
      ['testcompany@demo.com', hashedPassword, 'company', 'Test Demo Company']
    );
    
    const userId = userResult.insertId;
    
    // Insert company
    const companyResult = await db.query(
      'INSERT INTO companies (user_id, name, description, industry, location, website) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, 'Test Demo Company', 'A demo company for testing', 'Technology', 'Phnom Penh, Cambodia', 'https://demo.com']
    );
    
    console.log('Test company created successfully!');
    console.log('Email: testcompany@demo.com');
    console.log('Password: test123');
    console.log('User ID:', userId);
    console.log('Company ID:', companyResult.insertId);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

createTestCompany();
