const mysql = require('mysql2/promise'); // ✅ using promise-based pool
const dbUrl = process.env.DATABASE_URL;
const dbConfig = new URL(dbUrl);

const pool = mysql.createPool({
  host: dbConfig.hostname,                // ✅ mysql-xyz.rendermysql.com
  user: dbConfig.username,                // ✅ root
  password: dbConfig.password,            // ✅ Nayan@123 (decoded from %40)
  database: dbConfig.pathname.substring(1), // ✅ removes leading `/` from /sedb
  port: dbConfig.port || 3306,            // ✅ port 3306
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
