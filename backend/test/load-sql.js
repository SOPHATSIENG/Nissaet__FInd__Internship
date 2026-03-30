const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function loadSqlDump() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        multipleStatements: true
    });

    try {
        // First create the database if it doesn't exist
        console.log('Creating database...');
        await connection.query('CREATE DATABASE IF NOT EXISTS `nissaet_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
        
        // Now select it
        await connection.query('USE `nissaet_db`');
        console.log('✅ Database selected');
        
        // Read and execute the SQL dump
        const sqlPath = path.join(__dirname, 'config', 'nissaet_db.sql');
        let sql = fs.readFileSync(sqlPath, 'utf8');
        
        // Remove the USE statement from the dump if it exists
        sql = sql.replace(/^\s*USE\s+`?\w+`?\s*;/im, '');
        sql = sql.replace(/^\s*CREATE\s+DATABASE[^;]*;/im, '');
        
        console.log('Loading SQL dump...');
        // Split and execute statements individually with error handling
        const statements = sql.split(';').filter(s => s.trim());
        let successCount = 0;
        for (const statement of statements) {
            try {
                if (statement.trim()) {
                    await connection.query(statement);
                    successCount++;
                }
            } catch (err) {
                // Ignore "table already exists" errors
                if (err.code !== 'ER_TABLE_EXISTS_ERROR') {
                    console.warn('Warning executing statement:', err.message.substring(0, 100));
                }
            }
        }
        console.log(`✅ Database schema loaded! (${successCount} SQL statements executed)`);
    } catch (error) {
        console.error('❌ Error loading SQL dump:', error.message);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

loadSqlDump();
