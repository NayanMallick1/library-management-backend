const mysql = require('mysql2/promise');
const dbUrl = process.env.DATABASE_URL;
const dbConfig = new URL(dbUrl);

const pool = mysql.createPool({
  host: dbConfig.hostname,
  user: dbConfig.username,
  password: dbConfig.password,
  database: dbConfig.pathname.substring(1),
  port: dbConfig.port || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;
