const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Check if we're using PostgreSQL (Render) or MySQL (local)
const isPostgres = process.env.DB_TYPE === 'postgres' || process.env.NODE_ENV === 'production';

let db;

if (isPostgres) {
    // PostgreSQL configuration for Render
    const pgConfig = {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 5432,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
    };

    console.log('Using PostgreSQL with config:', {
        host: pgConfig.host,
        port: pgConfig.port,
        user: pgConfig.user,
        database: pgConfig.database,
        password: pgConfig.password ? '***' : '(empty)'
    });

    db = new Pool(pgConfig);

    module.exports = {
        connection: async () => {
            try {
                const client = await db.connect();
                console.log('PostgreSQL connection acquired successfully');
                return client;
            } catch (error) {
                console.error('PostgreSQL connection failed:', error);
                throw error;
            }
        },
        query: async (sql, params) => {
            try {
                const client = await db.connect();
                try {
                    const result = await client.query(sql, params);
                    return result.rows;
                } finally {
                    client.release();
                }
            } catch (error) {
                console.error('PostgreSQL query failed:', error);
                throw error;
            }
        },
        queryRaw: async (sql, params) => {
            try {
                const client = await db.connect();
                try {
                    const result = await client.query(sql, params);
                    return [result.rows, result];
                } finally {
                    client.release();
                }
            } catch (error) {
                console.error('PostgreSQL query failed:', error);
                throw error;
            }
        },
        getResults: (queryResult) => {
            if (Array.isArray(queryResult)) {
                return queryResult;
            }
            return queryResult;
        },
        pool: db,
        testConnection: async () => {
            try {
                const client = await db.connect();
                console.log('PostgreSQL connected successfully');
                client.release();
                return true;
            } catch (error) {
                console.error('PostgreSQL connection failed:', error.message);
                return false;
            }
        },
        initDatabase: async () => {
            console.log('PostgreSQL database initialization not needed (managed by Render)');
        }
    };
} else {
    // Fallback to MySQL for local development
    console.log('Using MySQL for local development');
    module.exports = require('./db.js');
}
