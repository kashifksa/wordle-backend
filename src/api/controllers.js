const wordleService = require('../services/wordleService');
const logger = require('../utils/logger');

// Simple in-memory cache
let cache = {
  data: null,
  timestamp: 0
};

const getRecent = async (req, res) => {
  try {
    const locale = req.query.locale || 'global';
    const config = require('../config');
    
    // Check cache
    if (config.flags.enableCache) {
      const now = Date.now();
      // 60 seconds TTL
      if (cache.data && (now - cache.timestamp < 60000)) {
        return res.json(cache.data);
      }
    }

    const data = await wordleService.getWordleDataForDates(locale);
    
    if (config.flags.enableCache) {
      cache.data = data;
      cache.timestamp = Date.now();
    }

    res.json(data);
  } catch (error) {
    logger.error('API Error: getRecent', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const locale = req.query.locale || 'global';

    const data = await wordleService.getAllWordleData(page, limit, locale);
    res.json({ data, page, limit });
  } catch (error) {
    logger.error('API Error: getAll', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const saveManual = async (req, res) => {
  try {
    const data = req.body;
    
    if (!data.date || !data.puzzle_number || !data.word) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await wordleService.saveManualWordle(data);
    
    // Invalidate cache
    cache.data = null;
    cache.timestamp = 0;

    res.json({ success: true, message: 'Puzzle saved manually' });
  } catch (error) {
    logger.error('API Error: saveManual', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

module.exports = {
  getRecent,
  getAll,
  saveManual
};
