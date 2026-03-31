const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

class MigrationRunner {
    constructor() {
        this.connection = null;
        this.dbConfig = {
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'nissaet_db',
            multipleStatements: true,
            waitForConnections: true,
            connectionLimit: 1
        };
    }

    async connect() {
        try {
            const tempConfig = { ...this.dbConfig, database: undefined };
            const tempConn = await mysql.createConnection(tempConfig);
            await tempConn.execute(
                `CREATE DATABASE IF NOT EXISTS \`${this.dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
            );
            await tempConn.end();

            this.connection = await mysql.createConnection(this.dbConfig);
        } catch (error) {
            console.error('Database connection failed:', error.message);
            throw error;
        }
    }

    async disconnect() {
        if (this.connection) {
            await this.connection.end();
        }
    }

    async createMigrationsTable() {
        const createTableSQL = `CREATE TABLE IF NOT EXISTS migrations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                filename VARCHAR(255) NOT NULL UNIQUE,
                executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`;

        await this.connection.query(createTableSQL);
    }

    async getExecutedMigrations() {
        await this.createMigrationsTable();
        const [rows] = await this.connection.execute('SELECT filename FROM migrations ORDER BY filename');
        return rows.map(row => row.filename);
    }

    async getMigrationFiles() {
        const migrationsDir = path.join(__dirname, 'migrations');
        const files = fs.readdirSync(migrationsDir)
            .filter(file => file.endsWith('.sql'))
            .sort();
        return files;
    }

    async executeMigration(filename) {
        const filePath = path.join(__dirname, 'migrations', filename);
        const sql = fs.readFileSync(filePath, 'utf8');

        await this.connection.query(sql);
        await this.connection.execute(
            'INSERT INTO migrations (filename) VALUES (?)',
            [filename]
        );
    }

    async runMigrations() {
        try {
            await this.connect();
            await this.createMigrationsTable();

            const executedMigrations = await this.getExecutedMigrations();
            const migrationFiles = await this.getMigrationFiles();

            const pendingMigrations = migrationFiles.filter(file => !executedMigrations.includes(file));

            if (pendingMigrations.length === 0) {
                console.log('No pending migrations');
                return;
            }

            for (const filename of pendingMigrations) {
                await this.executeMigration(filename);
                console.log(`Executed migration: ${filename}`);
            }
        } catch (error) {
            console.error('Migration failed:', error.message);
            process.exit(1);
        } finally {
            await this.disconnect();
        }
    }

    async rollbackMigration(filename) {
        try {
            await this.connect();
            await this.connection.execute(
                'DELETE FROM migrations WHERE filename = ?',
                [filename]
            );
            console.log(`Rolled back migration: ${filename}`);
            console.log('Note: SQL rollback is not implemented.');
        } catch (error) {
            console.error('Failed to rollback migration:', error.message);
            throw error;
        } finally {
            await this.disconnect();
        }
    }

    async showStatus() {
        try {
            await this.connect();
            await this.createMigrationsTable();

            const executedMigrations = await this.getExecutedMigrations();
            const migrationFiles = await this.getMigrationFiles();

            console.log('\nMigration Status:');
            console.log('==================');

            migrationFiles.forEach(file => {
                const status = executedMigrations.includes(file) ? 'OK' : 'PENDING';
                console.log(`${status} ${file}`);
            });

            const pendingCount = migrationFiles.filter(file => !executedMigrations.includes(file)).length;
            console.log(`\nSummary: ${executedMigrations.length} executed, ${pendingCount} pending`);
        } catch (error) {
            console.error('Failed to show migration status:', error.message);
        } finally {
            await this.disconnect();
        }
    }
}

async function main() {
    const command = process.argv[2];
    const filename = process.argv[3];

    const runner = new MigrationRunner();

    switch (command) {
        case 'run':
            await runner.runMigrations();
            break;
        case 'rollback':
            if (!filename) {
                console.error('Please provide a filename to rollback');
                process.exit(1);
            }
            await runner.rollbackMigration(filename);
            break;
        case 'status':
            await runner.showStatus();
            break;
        default:
            console.log(`
Migration Runner
==================

Usage:
  node migrate.js run        - Run all pending migrations
  node migrate.js status     - Show migration status
  node migrate.js rollback <filename> - Rollback a migration

Environment variables:
  DB_HOST - Database host (default: localhost)
  DB_USER - Database user (default: root)
  DB_PASSWORD - Database password
  DB_NAME - Database name (default: nissaet_db)
            `);
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = MigrationRunner;
