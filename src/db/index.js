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
        date VARCHAR(10) NOT NULL,
        puzzle_number INT UNIQUE NOT NULL,
        word VARCHAR(10) NOT NULL,
        hint1 TEXT,
        hint2 TEXT,
        hint3 TEXT,
        final_hint TEXT,
        vowel_count INT,
        repeated_letters VARCHAR(32),
        locale VARCHAR(16) DEFAULT 'global',
        entry_type VARCHAR(16) DEFAULT 'auto',
        url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX(date),
        INDEX(locale, date)
      )
    `);

    // Ensure columns exist for existing tables
    try { await connection.query('ALTER TABLE wordle_data ADD COLUMN source VARCHAR(32) DEFAULT "unknown"'); } catch (e) {}
    try { await connection.query('ALTER TABLE wordle_data ADD COLUMN entry_type VARCHAR(16) DEFAULT "auto"'); } catch (e) {}
    try { await connection.query('ALTER TABLE wordle_data ADD COLUMN vowel_letters VARCHAR(32) DEFAULT NULL'); } catch (e) {}
    try { await connection.query('ALTER TABLE wordle_data ADD COLUMN url TEXT DEFAULT NULL'); } catch (e) {}
    
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
