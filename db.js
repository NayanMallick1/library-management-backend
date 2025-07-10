const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',          // or your DB host
  user: 'root',    // your DB username
  password: 'Nayan@123', // your DB password
  database: 'SeDB',  // your DB name
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;
