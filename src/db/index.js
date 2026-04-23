const mysql = require('mysql2/promise');
const config = require('../config');
const logger = require('../utils/logger');

const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.pass,
  database: config.db.name,
  connectionLimit: config.db.poolSize,
  waitForConnections: true,
  queueLimit: 0
});

async function initDb() {
  try {
    const connection = await pool.getConnection();
    await connection.query(`
      CREATE TABLE IF NOT EXISTS wordle_data (
        id INT PRIMARY KEY AUTO_INCREMENT,
        date DATE NOT NULL,
        puzzle_number INT UNIQUE NOT NULL,
        word VARCHAR(10) NOT NULL,
        hint1 TEXT,
        hint2 TEXT,
        hint3 TEXT,
        final_hint TEXT,
        vowel_count INT,
        repeated_letters VARCHAR(32),
        locale VARCHAR(16) DEFAULT 'global',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX(date),
        INDEX(locale, date)
      )
    `);
    connection.release();
    logger.info('Database initialized and tables verified.');
  } catch (err) {
    logger.error('Failed to initialize database', err);
    throw err;
  }
}

module.exports = {
  pool,
  initDb
};
