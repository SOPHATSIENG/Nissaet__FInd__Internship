const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'nissaet_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 10000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
};

// Log database config (without password)
console.log('Database config:', {
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    database: dbConfig.database,
    password: dbConfig.password ? '***' : '(empty)'
});

// First, try to connect without specifying database to create it if needed
const createDatabaseIfNotExists = async () => {
    const tempConfig = { ...dbConfig, database: undefined };
    let connection;
    try {
        connection = await mysql.createConnection(tempConfig);
        await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        console.log(`Database '${dbConfig.database}' ensured to exist`);
        await connection.end();
    } catch (error) {
        console.error('Error creating database:', error.message);
        if (connection) await connection.end();
    }
};

// Create the pool
const pool = mysql.createPool(dbConfig);

// Helper function to get the raw results from query
const getResults = (queryResult) => {
    if (Array.isArray(queryResult) && queryResult.length >= 1) {
        return queryResult[0];
    }
    return queryResult;
};

// Export module
module.exports = {
    connection: async () => {
        try {
            const conn = await pool.getConnection();
            console.log('Database connection acquired successfully');
            return conn;
        } catch (error) {
            console.error('Database connection failed:', error);
            throw error;
        }
    },
    query: async (sql, params) => {
        try {
            const [results] = await pool.execute(sql, params);
            return results;
        } catch (error) {
            console.error('Query failed:', error);
            throw error;
        }
    },
    queryRaw: async (sql, params) => {
        try {
            const result = await pool.execute(sql, params);
            return result;
        } catch (error) {
            console.error('Query failed:', error);
            throw error;
        }
    },
    getResults,
    pool,
    testConnection: async () => {
        try {
            const connection = await pool.getConnection();
            console.log('Database connected successfully');
            connection.release();
            return true;
        } catch (error) {
            console.error('Database connection failed:', error.message);
            return false;
        }
    },
    initDatabase: createDatabaseIfNotExists
};

