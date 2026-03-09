const mysql = require('mysql2/promise');

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'nissaet_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

module.exports = {
    connection: async () => {
        try {
            const conn = await pool.getConnection();
            console.log('Database connected successfully');
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
    pool
};  

