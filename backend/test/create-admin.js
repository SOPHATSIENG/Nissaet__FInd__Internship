const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createAdminUser() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'nissaet_db'
    });

    try {
        const email = 'admin@nissaet.com';
        const password = 'admin123';
        const fullName = 'Admin User';
        const hashedPassword = await bcrypt.hash(password, 10);

        // Check if admin user already exists
        const [existing] = await connection.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            console.log('✅ Admin user already exists with email:', email);
            // Update password if needed
            await connection.execute('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email]);
            console.log('✅ Admin password updated');
            await connection.end();
            return;
        }

        // Insert new admin user
        await connection.execute(
            'INSERT INTO users (email, password, full_name, role) VALUES (?, ?, ?, ?)',
            [email, hashedPassword, fullName, 'admin']
        );

        console.log('✅ Admin user created successfully!');
        console.log('Email:', email);
        console.log('Password:', password);
        console.log('Role: admin');
        console.log('\nYou can now login to the admin dashboard with these credentials.');

    } catch (error) {
        console.error('❌ Error creating admin user:', error.message);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

createAdminUser();
