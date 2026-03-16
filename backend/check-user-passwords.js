const db = require('./config/db');

async function checkUsers() {
  try {
    const users = await db.query('SELECT id, email, role, full_name FROM users WHERE role = "company" LIMIT 3');
    console.log('Available company users:');
    users.forEach(row => {
      console.log(`ID: ${row.id}, Email: ${row.email}, Name: ${row.full_name}`);
    });
    
    console.log('\nTry logging in with these emails. If you don\'t know the password, you can:');
    console.log('1. Use password reset feature in the app');
    console.log('2. Or I can help you create a new test user');
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkUsers();
