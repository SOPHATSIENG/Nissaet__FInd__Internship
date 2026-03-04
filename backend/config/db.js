const mysql = require('mysql2/promise');
<<<<<<< HEAD
require('dotenv').config();

const host = process.env.DB_HOST || 'localhost';
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD || '';
const database = process.env.DB_NAME || 'nissaet_db';

const poolOptions = {
  host,
  user,
  password,
  database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const db = mysql.createPool(poolOptions);

async function ensureDatabaseAndSchema() {
  const admin = mysql.createPool({
    host,
    user,
    password,
    waitForConnections: true,
    connectionLimit: 2,
    queueLimit: 0
  });

  try {
    await admin.query(`CREATE DATABASE IF NOT EXISTS \`${database}\``);
  } finally {
    await admin.end();
  }

  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NULL,
      role VARCHAR(50) DEFAULT 'student',
      google_id VARCHAR(255) NULL,
      github_id VARCHAR(255) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  const [columns] = await db.query('SHOW COLUMNS FROM users');
  const byName = new Map(columns.map((col) => [col.Field, col]));

  if (!byName.has('google_id')) {
    await db.query('ALTER TABLE users ADD COLUMN google_id VARCHAR(255) NULL');
  }
  if (!byName.has('github_id')) {
    await db.query('ALTER TABLE users ADD COLUMN github_id VARCHAR(255) NULL');
  }
  if (!byName.has('role')) {
    await db.query("ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'student'");
  }
  if (byName.has('password') && byName.get('password').Null === 'NO') {
    await db.query('ALTER TABLE users MODIFY COLUMN password VARCHAR(255) NULL');
  }
}

let initError = null;
const ready = ensureDatabaseAndSchema().catch((error) => {
  initError = error;
  console.error('[db] initialization failed:', error.code || error.message);
});

const dbClient = {
  query: async (...args) => {
    await ready;
    if (initError) {
      throw initError;
    }
    return db.query(...args);
  },
  ready
};

module.exports = dbClient;
=======

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
>>>>>>> origin/feature/phat
