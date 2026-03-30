const mysql = require('mysql2/promise');
require('dotenv').config();

async function cleanDatabase() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'nissaet_db',
        multipleStatements: true
    });

    try {
        console.log('Dropping all tables...');
        // Get all tables
        const [tables] = await connection.execute(
            "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ?",
            [process.env.DB_NAME || 'nissaet_db']
        );

        // Drop all tables
        for (const table of tables) {
            try {
                await connection.query(`DROP TABLE \`${table.TABLE_NAME}\``);
                console.log(`✅ Dropped ${table.TABLE_NAME}`);
            } catch (err) {
                console.warn(`⚠️  Failed to drop ${table.TABLE_NAME}: ${err.message.substring(0, 80)}`);
            }
        }

        console.log('\n✅ All tables dropped! Database is now clean.');
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

cleanDatabase();
