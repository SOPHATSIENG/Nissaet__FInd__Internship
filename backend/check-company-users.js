const db = require('./config/db');

async function checkCompanyUsers() {
  try {
    const rows = await db.query('SELECT id, email, role FROM users WHERE role = "company" LIMIT 5');
    console.log('Company users:');
    rows.forEach(row => console.log(`ID: ${row.id}, Email: ${row.email}, Role: ${row.role}`));
    
    // Also check companies table
    const companies = await db.query('SELECT id, name, user_id FROM companies LIMIT 5');
    console.log('\nCompanies:');
    companies.forEach(row => console.log(`ID: ${row.id}, Name: ${row.name}, User ID: ${row.user_id}`));
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkCompanyUsers();
