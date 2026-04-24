require('dotenv').config();

module.exports = {
  server: {
    port: process.env.PORT || 3000,
    apiBaseUrl: process.env.API_BASE_URL || '/api/wordle',
    corsOrigin: process.env.CORS_ORIGIN || '*'
  },
  schedule: {
    timezone: process.env.TIMEZONE || 'Asia/Karachi',
    cron: process.env.CRON_SCHEDULE || '5 14 * * *',
    retryIntervalMin: parseInt(process.env.RETRY_INTERVAL_MIN, 10) || 5,
    retryMaxAttempts: parseInt(process.env.RETRY_MAX_ATTEMPTS, 10) || 12
  },
  scraper: {
    baseNytApi: process.env.SCRAPE_BASE_NYT_API || 'https://www.nytimes.com/svc/wordle/v2',
    baseNyt: process.env.SCRAPE_BASE_NYT || 'https://www.nytimes.com',
    cnetPattern: process.env.SCRAPE_CNET_PATTERN || 'https://www.cnet.com/tech/gaming/todays-wordle-hints-answer-and-help-for-{{DATE}}-{{PUZZLE_NUMBER}}/',
    mashablePattern: process.env.SCRAPE_MASHABLE_PATTERN || 'https://mashable.com/article/wordle-today-answer-{{DATE}}',
    wordtipsUrl: process.env.SCRAPE_WORDTIPS_URL || 'https://word.tips/todays-wordle-answer/',
    timeoutMs: parseInt(process.env.SCRAPE_TIMEOUT_MS, 10) || 10000,
    userAgent: process.env.SCRAPE_USER_AGENT || 'Mozilla/5.0'
  },
  ai: {
    apiUrl: process.env.AI_API_URL || 'https://api.openai.com/v1/chat/completions',
    apiKey: process.env.AI_API_KEY,
    model: process.env.AI_MODEL || 'gpt-3.5-turbo',
    promptTemplate: process.env.AI_PROMPT_TEMPLATE || 'Generate hints for the Wordle word: {{WORD}}. Do NOT say the word has 5 letters. Return JSON with keys: hint1 (part of speech or vague meaning), hint2 (category), hint3 (specific), final_hint (strong).'
  },
  security: {
    apiKey: process.env.API_KEY || 'default_secret'
  },
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    pass: process.env.DB_PASS || '',
    name: process.env.DB_NAME || 'wordle_db',
    poolSize: parseInt(process.env.DB_POOL_SIZE, 10) || 5
  },
  flags: {
    enableCache: process.env.ENABLE_CACHE === 'true',
    enableFallbackHints: process.env.ENABLE_FALLBACK_HINTS !== 'false'
  },
  wordle: {
    baseDate: process.env.BASE_DATE || '2026-04-25',
    basePuzzleNumber: parseInt(process.env.BASE_PUZZLE_NUMBER, 10) || 1771
  }
};
