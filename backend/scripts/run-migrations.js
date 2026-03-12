#!/usr/bin/env node

const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'nissaet_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

async function runMigrations() {
    const connection = await mysql.createConnection(dbConfig);
    
    try {
        console.log('🚀 Starting database migrations...');
        
        // Create migrations table if it doesn't exist
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS migrations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                filename VARCHAR(255) NOT NULL UNIQUE,
                executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Get all migration files
        const migrationsDir = path.join(__dirname, '../migrations');
        const files = await fs.readdir(migrationsDir);
        const sqlFiles = files
            .filter(file => file.endsWith('.sql'))
            .sort();
        
        // Get executed migrations
        const [executedMigrations] = await connection.execute(
            'SELECT filename FROM migrations'
        );
        const executedFiles = executedMigrations.map(row => row.filename);
        
        // Run pending migrations
        for (const file of sqlFiles) {
            if (!executedFiles.includes(file)) {
                console.log(`📝 Running migration: ${file}`);
                
                const filePath = path.join(migrationsDir, file);
                const sql = await fs.readFile(filePath, 'utf8');
                
                // Split SQL by semicolons and execute each statement
                const statements = sql
                    .split(';')
                    .map(stmt => stmt.trim())
                    .filter(stmt => stmt.length > 0);
                
                for (const statement of statements) {
                    await connection.execute(statement);
                }
                
                // Record migration
                await connection.execute(
                    'INSERT INTO migrations (filename) VALUES (?)',
                    [file]
                );
                
                console.log(`✅ Completed: ${file}`);
            } else {
                console.log(`⏭️  Skipped: ${file} (already executed)`);
            }
        }
        
        console.log('🎉 All migrations completed successfully!');
        
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

if (require.main === module) {
    runMigrations();
}

module.exports = { runMigrations };
