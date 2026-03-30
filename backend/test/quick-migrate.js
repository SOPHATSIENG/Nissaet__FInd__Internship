const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigrations() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        multipleStatements: true
    });

    try {
        // Create database if it doesn't exist
        console.log('Creating/ensuring database exists...');
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'nissaet_db'}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        await connection.query(`USE \`${process.env.DB_NAME || 'nissaet_db'}\``);
        console.log('✅ Database ready');

        // Get all migration files
        const migrationsDir = path.join(__dirname, 'migrations');
        const files = fs.readdirSync(migrationsDir)
            .filter(file => file.endsWith('.sql'))
            .sort();

        console.log(`\nFound ${files.length} migration files`);
        console.log('Starting migrations...\n');

        let successCount = 0;
        let failCount = 0;

        for (const file of files) {
            try {
                const filePath = path.join(migrationsDir, file);
                const sql = fs.readFileSync(filePath, 'utf8').trim();
                
                if (!sql) continue;

                await connection.query(sql);
                console.log(`✅ ${file}`);
                successCount++;
            } catch (error) {
                // Log error but continue
                console.log(`⚠️  ${file} - ${error.message.split('\n')[0]}`);
                failCount++;
            }
        }

        console.log(`\n✅ Migrations complete! (${successCount} successful, ${failCount} skipped/failed)`);

        // Verify critical tables exist
        console.log('\nVerifying tables...');
        const [tables] = await connection.execute("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ?", [process.env.DB_NAME || 'nissaet_db']);
        console.log(`Found ${tables.length} tables`);
        
        if (tables.length > 0) {
            const criticalTables = ['users', 'students', 'companies', 'internships'];
            const tableNames = tables.map(t => t.TABLE_NAME);
            const missingTables = criticalTables.filter(t => !tableNames.includes(t));
            
            if (missingTables.length === 0) {
                console.log('✅ All critical tables exist!');
            } else {
                console.log(`⚠️  Missing critical tables: ${missingTables.join(', ')}`);
            }
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

runMigrations();
