const db = require('../db');
const scraper = require('./scraper');
const analyzer = require('./analyzer');
const ai = require('./ai');
const logger = require('../utils/logger');

async function processDailyWordle() {
  logger.info('Starting daily Wordle processing...');
  
  // 1. Scrape data
  const scrapeResult = await scraper.scrapeWordleData();
  
  // 2. Validation & Deduplication
  const [existing] = await db.pool.execute(
    'SELECT id FROM wordle_data WHERE puzzle_number = ?',
    [scrapeResult.puzzle_number]
  );
  
  if (existing.length > 0) {
    logger.info(`Puzzle ${scrapeResult.puzzle_number} already exists -> skip`);
    return { success: true, skipped: true, puzzle_number: scrapeResult.puzzle_number };
  }

  // 3. Analyzer
  const analysis = analyzer.analyzeWord(scrapeResult.word);

  // 4. AI Hint Generation
  const hints = await ai.generateHints(scrapeResult.word);

  // 5. Insert into DB
  await db.pool.execute(
    `INSERT INTO wordle_data 
      (date, puzzle_number, word, hint1, hint2, hint3, final_hint, vowel_count, repeated_letters) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      scrapeResult.date,
      scrapeResult.puzzle_number,
      scrapeResult.word,
      hints.hint1,
      hints.hint2,
      hints.hint3,
      hints.final_hint,
      analysis.vowel_count,
      analysis.repeated_letters
    ]
  );

  logger.info(`Successfully processed puzzle ${scrapeResult.puzzle_number}`);
  return { success: true, skipped: false, puzzle_number: scrapeResult.puzzle_number };
}

async function getWordleDataForDates(locale = 'global') {
  // Fetch latest 3 records to cover yesterday, today, tomorrow logic
  // Relying on server-side ordering
  const [rows] = await db.pool.execute(
    `SELECT * FROM wordle_data 
     WHERE locale = ? 
     ORDER BY date DESC 
     LIMIT 3`,
    [locale]
  );

  // Example mapping. You could adjust this depending on exact requirements
  const result = {};
  if (rows.length > 0) result.today = rows[0];
  if (rows.length > 1) result.yesterday = rows[1];
  if (rows.length > 2) result.tomorrow = rows[2]; // Might not exist unless prepublished

  // Remove sensitive word if necessary, but spec says backend handles data
  // Assuming frontend hides the word until solved.

  return result;
}

async function getAllWordleData(page = 1, limit = 10, locale = 'global') {
  const offset = (page - 1) * limit;
  const [rows] = await db.pool.execute(
    `SELECT * FROM wordle_data 
     WHERE locale = ? 
     ORDER BY date DESC 
     LIMIT ? OFFSET ?`,
    [locale, parseInt(limit, 10), offset]
  );
  return rows;
}

async function saveManualWordle(data) {
  const { date, puzzle_number, word, hints, vowel_count, repeated_letters, locale = 'global' } = data;
  
  const [existing] = await db.pool.execute(
    'SELECT id FROM wordle_data WHERE puzzle_number = ?',
    [puzzle_number]
  );
  
  if (existing.length > 0) {
    throw new Error('Puzzle number already exists');
  }

  await db.pool.execute(
    `INSERT INTO wordle_data 
      (date, puzzle_number, word, hint1, hint2, hint3, final_hint, vowel_count, repeated_letters, locale) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      date,
      puzzle_number,
      word,
      hints[0] || '',
      hints[1] || '',
      hints[2] || '',
      hints[3] || '',
      vowel_count,
      repeated_letters,
      locale
    ]
  );
  
  return { success: true };
}

module.exports = {
  processDailyWordle,
  getWordleDataForDates,
  getAllWordleData,
  saveManualWordle
};
