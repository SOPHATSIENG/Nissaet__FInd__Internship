const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createTestUser() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'nissaet_db'
    });

    try {
        const email = 'test@example.com';
        const password = 'test123';
        const fullName = 'Test User';
        const hashedPassword = await bcrypt.hash(password, 10);

        // Check if user already exists
        const [existing] = await connection.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            console.log('✅ Test user already exists:', email);
            
await connection.end();
            return;
        }

        // Insert new user
        await connection.execute(
            'INSERT INTO users (email, password, full_name, role) VALUES (?, ?, ?, ?)',
            [email, hashedPassword, fullName, 'student']
        );

        console.log('✅ Test user created successfully!');
        console.log('Email: ', email);
        console.log('Password:', password);
        console.log('\nYou can now login with these credentials.');

    } catch (error) {
        console.error('❌ Error creating test user:', error.message);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

createTestUser();
