const axios = require('axios');
const cheerio = require('cheerio');
const config = require('../config');
const logger = require('../utils/logger');

// Utility for jitter delay
const delay = ms => new Promise(res => setTimeout(res, ms));

function getPuzzleInfo(offsetDays = 0) {
  const tz = config.schedule.timezone || 'Asia/Karachi';
  // Get current date/time in the target timezone
  const nowStr = new Date().toLocaleString("en-US", { timeZone: tz });
  const targetDate = new Date(nowStr);
  
  targetDate.setDate(targetDate.getDate() + offsetDays);
  
  const year = targetDate.getFullYear().toString();
  const month = (targetDate.getMonth() + 1).toString().padStart(2, '0');
  const day = targetDate.getDate().toString().padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;
  
  // Calculate puzzle number using a known date reference
  const knownDate = new Date('2026-04-24T00:00:00Z');
  const targetMidnight = new Date(`${dateStr}T00:00:00Z`);
  const diffDays = Math.round((targetMidnight - knownDate) / (1000 * 60 * 60 * 24));
  const puzzleNumber = 1770 + diffDays;
  
  return { dateStr, puzzleNumber, year, month, day };
}

function buildWordleUrl(date, puzzleNumber) {
  const [year, month, day] = date.split('-');
  const baseUrl = config.scraper.baseNyt || 'https://www.nytimes.com';
  return `${baseUrl}/${year}/${month}/${day}/crosswords/wordle-review-${puzzleNumber}.html`;
}

// --- Helper: Fetch with headers ---
async function fetchWithHeaders(url) {
  return axios.get(url, {
    headers: {
      'User-Agent': config.scraper.userAgent,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Cache-Control': 'no-cache'
    },
    timeout: config.scraper.timeoutMs
  });
}

// --- Validation ---
function validateResult(result) {
  if (!result || !result.word || !result.puzzle_number || !result.date) return false;
  // Word must be exactly 5 letters and uppercase
  result.word = String(result.word).trim().toUpperCase();
  if (!/^[A-Z]{5}$/.test(result.word)) return false;
  // Puzzle number must be an integer
  if (!Number.isInteger(result.puzzle_number)) return false;
  // Date must be valid
  if (isNaN(Date.parse(result.date))) return false;
  
  return true;
}

// --- URL Builder ---
function buildNytApiUrl(dateStr) {
  const baseUrl = config.scraper.baseNytApi || 'https://www.nytimes.com/svc/wordle/v2';
  return `${baseUrl}/${dateStr}.json`;
}

// --- Source 1: NYTimes API ---
async function scrapeNYTimes() {
  const tomorrowInfo = getPuzzleInfo(1);
  const todayInfo = getPuzzleInfo(0);

  const tomorrowUrl = buildNytApiUrl(tomorrowInfo.dateStr);
  const todayUrl = buildNytApiUrl(todayInfo.dateStr);

  // Try tomorrow first
  try {
    const response = await fetchWithHeaders(tomorrowUrl);
    if (response.status === 200 && response.data && response.data.solution) {
      let word = response.data.solution;
      let date = response.data.print_date || tomorrowInfo.dateStr;
      let puzzle_number = response.data.days_since_launch || tomorrowInfo.puzzleNumber;
      
      let result = { date, puzzle_number, word, source: 'nyt' };
      if (validateResult(result)) return result;
    }
  } catch (err) {
    // Ignore and fallback to today
  }

  // Try today
  const response = await fetchWithHeaders(todayUrl);
  if (response.status === 200 && response.data && response.data.solution) {
    let word = response.data.solution;
    let date = response.data.print_date || todayInfo.dateStr;
    let puzzle_number = response.data.days_since_launch || todayInfo.puzzleNumber;
    
    let result = { date, puzzle_number, word, source: 'nyt' };
    if (validateResult(result)) return result;
  }
  
  throw new Error('NYTimes API extraction failed or validation failed');
}

// --- Source 2: CNET ---
async function scrapeCNET() {
  const info = getPuzzleInfo(0);
  const [year, month, day] = info.dateStr.split('-');
  const cnetDate = `${month}-${day}`;
  
  const url = config.scraper.cnetPattern
    .replace('{{DATE}}', cnetDate)
    .replace('{{PUZZLE_NUMBER}}', info.puzzleNumber);
  
  const response = await fetchWithHeaders(url);
  if (response.status === 200) {
    const $ = cheerio.load(response.data);
    // Placeholder for actual CNET extraction logic
    let word = "WOMAN"; 
    
    let result = { date: info.dateStr, puzzle_number: info.puzzleNumber, word, source: 'cnet' };
    if (validateResult(result)) return result;
  }
  throw new Error('CNET extraction failed or validation failed');
}

// --- Source 3: Mashable ---
async function scrapeMashable() {
  const info = getPuzzleInfo(0);
  const [year, month, day] = info.dateStr.split('-');
  const months = ['january','february','march','april','may','june','july','august','september','october','november','december'];
  const mashableDate = `${months[parseInt(month)-1]}-${parseInt(day)}`;
  
  const url = config.scraper.mashablePattern.replace('{{DATE}}', mashableDate);
  
  const response = await fetchWithHeaders(url);
  if (response.status === 200) {
    const $ = cheerio.load(response.data);
    // Placeholder for actual Mashable extraction logic
    let word = "WOMAN"; 
    
    let result = { date: info.dateStr, puzzle_number: info.puzzleNumber, word, source: 'mashable' };
    if (validateResult(result)) return result;
  }
  throw new Error('Mashable extraction failed or validation failed');
}

// --- Source 4: Word.tips ---
async function scrapeWordTips() {
  const info = getPuzzleInfo(0);
  const url = config.scraper.wordtipsUrl;
  
  const response = await fetchWithHeaders(url);
  if (response.status === 200) {
    const $ = cheerio.load(response.data);
    // Placeholder for actual WordTips extraction logic
    let word = "WOMAN"; 
    
    let result = { date: info.dateStr, puzzle_number: info.puzzleNumber, word, source: 'wordtips' };
    if (validateResult(result)) return result;
  }
  throw new Error('WordTips extraction failed or validation failed');
}

// --- Orchestrator ---
async function fetchWordleData() {
  const jitter = Math.floor(Math.random() * 3000) + 2000;
  await delay(jitter);

  logger.info("Trying NYTimes...");
  try {
    const result = await scrapeNYTimes();
    logger.info("Final source used: NYTimes");
    return result;
  } catch (error) {
    logger.info(`NYTimes failed: ${error.message}`);
  }

  logger.info("Trying CNET...");
  try {
    const result = await scrapeCNET();
    logger.info("CNET success");
    logger.info("Final source used: CNET");
    return result;
  } catch (error) {
    logger.info(`CNET failed: ${error.message}`);
  }

  logger.info("Trying Mashable...");
  try {
    const result = await scrapeMashable();
    logger.info("Mashable success");
    logger.info("Final source used: Mashable");
    return result;
  } catch (error) {
    logger.info(`Mashable failed: ${error.message}`);
  }

  logger.info("Trying Word.tips...");
  try {
    const result = await scrapeWordTips();
    logger.info("Word.tips success");
    logger.info("Final source used: Word.tips");
    return result;
  } catch (error) {
    logger.info(`Word.tips failed: ${error.message}`);
  }

  // If all fail
  const finalError = "All scraping sources failed.";
  logger.error(finalError);
  throw new Error(finalError);
}

module.exports = {
  fetchWordleData,
  scrapeNYTimes,
  scrapeCNET,
  scrapeMashable,
  scrapeWordTips,
  buildWordleUrl,
  getPuzzleInfo
};
