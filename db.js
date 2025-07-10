const mysql = require('mysql2/promise');
require('dotenv').config(); // Load environment variables

// Validate required environment variables
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

let pool;
try {
  const dbConfig = new URL(process.env.DATABASE_URL);
  
  pool = mysql.createPool({
    host: dbConfig.hostname,
    user: dbConfig.username,
    password: dbConfig.password,
    database: dbConfig.pathname.substring(1),
    port: dbConfig.port || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
  });

  // Test the connection on startup
  (async () => {
    try {
      const connection = await pool.getConnection();
      await connection.ping();
      connection.release();
      console.log('✅ Database connection established successfully');
    } catch (err) {
      console.error('❌ Database connection failed:', err);
      process.exit(1);
    }
  })();

} catch (err) {
  console.error('❌ Error parsing DATABASE_URL:', err);
  process.exit(1);
}

// Graceful shutdown handler
process.on('SIGINT', async () => {
  try {
    await pool.end();
    console.log('Database pool closed gracefully');
    process.exit(0);
  } catch (err) {
    console.error('Error closing database pool:', err);
    process.exit(1);
  }
});

module.exports = pool;