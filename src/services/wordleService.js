const db = require('../db');
const scraper = require('./scraper');
const analyzer = require('./analyzer');
const ai = require('./ai');
const logger = require('../utils/logger');

async function processDailyWordle() {
  logger.info('Starting daily Wordle processing...');
  
  // 0. Schema migrations
  try {
    await db.pool.execute('ALTER TABLE wordle_data ADD COLUMN source VARCHAR(32) DEFAULT "unknown"');
  } catch (e) {}
  try {
    await db.pool.execute('ALTER TABLE wordle_data ADD COLUMN vowel_letters VARCHAR(32) DEFAULT NULL');
  } catch (e) {}

  // 1. Scrape data
  const scrapeResult = await scraper.fetchWordleData();
  
  // 2. Validation & Deduplication
  const [existing] = await db.pool.execute(
    'SELECT * FROM wordle_data WHERE puzzle_number = ?',
    [scrapeResult.puzzle_number]
  );
  
  if (existing.length > 0) {
    logger.info('Already exists in DB');
    return { 
      success: true, 
      message: 'Already exists', 
      puzzle_number: existing[0].puzzle_number,
      word: existing[0].word,
      date: existing[0].date,
      source: existing[0].source || scrapeResult.source || 'unknown',
      vowel_count: existing[0].vowel_count,
      vowel_letters: existing[0].vowel_letters || '',
      inserted: false
    };
  }

  // 3. Analyzer
  const analysis = analyzer.analyzeWord(scrapeResult.word);

  // 4. AI Hint Generation
  const hints = await ai.generateHints(scrapeResult.word);



  // 5. Insert into DB
  await db.pool.execute(
    `INSERT INTO wordle_data 
      (date, puzzle_number, word, hint1, hint2, hint3, final_hint, vowel_count, vowel_letters, repeated_letters, source) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      scrapeResult.date,
      scrapeResult.puzzle_number,
      scrapeResult.word,
      hints.hint1,
      hints.hint2,
      hints.hint3,
      hints.final_hint,
      analysis.vowel_count,
      analysis.vowel_letters,
      analysis.repeated_letters,
      scrapeResult.source || 'unknown'
    ]
  );

  logger.info(`Source used: ${scrapeResult.source || 'NYTimes'}`);
  logger.info(`Fetched word: ${scrapeResult.word}`);
  logger.info(`Puzzle number: ${scrapeResult.puzzle_number}`);
  logger.info(`Date assigned: ${scrapeResult.date}`);

  return { 
    success: true, 
    message: "Inserted", 
    word: scrapeResult.word,
    puzzle_number: scrapeResult.puzzle_number,
    date: scrapeResult.date,
    source: scrapeResult.source || 'unknown',
    vowel_count: analysis.vowel_count,
    vowel_letters: analysis.vowel_letters,
    inserted: true
  };
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
  const { word, puzzle_number, locale = 'global' } = data;
  
  if (!word || !puzzle_number) {
    throw new Error('Word and puzzle_number are required');
  }

  // 1. Validation
  const cleanWord = String(word).trim().toUpperCase();
  if (!/^[A-Z]{5}$/.test(cleanWord)) {
    throw new Error('Word must be exactly 5 letters');
  }
  const cleanPuzzleNumber = parseInt(puzzle_number, 10);
  if (isNaN(cleanPuzzleNumber)) {
    throw new Error('Puzzle number must be a valid integer');
  }

  // 2. Duplicate Check
  const [existing] = await db.pool.execute(
    'SELECT * FROM wordle_data WHERE puzzle_number = ?',
    [cleanPuzzleNumber]
  );
  
  if (existing.length > 0) {
    logger.info(`Already exists: ${existing[0].word} (#${existing[0].puzzle_number})`);
    return {
      success: true,
      message: `Already exists: ${existing[0].word} (#${existing[0].puzzle_number})`,
      word: existing[0].word,
      puzzle_number: existing[0].puzzle_number,
      date: existing[0].date,
      source: existing[0].source || 'manual',
      inserted: false
    };
  }

  // 3. Auto Date Calculation (Fixed Logic based on puzzle number)
  const config = require('../config');
  const baseDateStr = config.wordle.baseDate;
  const basePuzzleNumber = config.wordle.basePuzzleNumber;
  
  // Calculate difference in days
  const diffDays = cleanPuzzleNumber - basePuzzleNumber;
  
  // Create Date object from base date (UTC to avoid timezone shifts)
  const calculatedDate = new Date(`${baseDateStr}T00:00:00Z`);
  calculatedDate.setDate(calculatedDate.getDate() + diffDays);
  
  // Format to YYYY-MM-DD
  const year = calculatedDate.getFullYear().toString();
  const month = (calculatedDate.getMonth() + 1).toString().padStart(2, '0');
  const day = calculatedDate.getDate().toString().padStart(2, '0');
  const newDateStr = `${year}-${month}-${day}`;

  // 4. Analysis
  const analysis = analyzer.analyzeWord(cleanWord);

  // 5. AI Hint Generation
  const hints = await ai.generateHints(cleanWord);

  // 6. Insert
  await db.pool.execute(
    `INSERT INTO wordle_data 
      (date, puzzle_number, word, hint1, hint2, hint3, final_hint, vowel_count, vowel_letters, repeated_letters, source, locale) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      newDateStr,
      cleanPuzzleNumber,
      cleanWord,
      hints.hint1,
      hints.hint2,
      hints.hint3,
      hints.final_hint,
      analysis.vowel_count,
      analysis.vowel_letters,
      analysis.repeated_letters,
      'manual',
      locale
    ]
  );
  
  logger.info("Manual entry triggered");
  logger.info(`Word: ${cleanWord}`);
  logger.info(`Puzzle #: ${cleanPuzzleNumber}`);
  logger.info(`Calculated date: ${newDateStr}`);
  logger.info("Inserted successfully");

  return { 
    success: true, 
    word: cleanWord,
    puzzle_number: cleanPuzzleNumber,
    date: newDateStr,
    source: 'manual',
    message: 'Inserted successfully',
    inserted: true
  };
}

module.exports = {
  processDailyWordle,
  getWordleDataForDates,
  getAllWordleData,
  saveManualWordle
};
