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
    url: process.env.SCRAPE_URL,
    timeoutMs: parseInt(process.env.SCRAPE_TIMEOUT_MS, 10) || 10000,
    userAgent: process.env.SCRAPE_USER_AGENT || 'Mozilla/5.0'
  },
  ai: {
    apiKey: process.env.AI_API_KEY,
    model: process.env.AI_MODEL || 'gpt-3.5-turbo',
    promptTemplate: process.env.AI_PROMPT_TEMPLATE || 'Generate hints for the Wordle word: {{WORD}}. Return JSON with keys: hint1 (vague), hint2 (category), hint3 (specific), final_hint (strong).'
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
  }
};
