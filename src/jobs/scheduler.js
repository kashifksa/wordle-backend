const cron = require('node-cron');
const config = require('../config');
const logger = require('../utils/logger');
const wordleService = require('../services/wordleService');

// Function to handle the job with retries
async function runJob() {
  let attempt = 0;
  
  while (attempt < config.schedule.retryMaxAttempts) {
    try {
      logger.info(`Starting wordle fetch job... attempt ${attempt + 1}/${config.schedule.retryMaxAttempts}`);
      const result = await wordleService.processDailyWordle(false);
      if (result.success) {
        logger.info('Wordle job completed successfully');
        break;
      }
    } catch (error) {
      logger.error('Wordle job failed', error);
      attempt++;
      
      if (attempt >= config.schedule.retryMaxAttempts) {
        logger.error('Max retry attempts reached. Job aborted.');
        break;
      }
      
      logger.info(`Sleeping for ${config.schedule.retryIntervalMin} minutes before next retry...`);
      await new Promise(resolve => setTimeout(resolve, config.schedule.retryIntervalMin * 60 * 1000));
    }
  }
}

function startScheduler() {
  logger.info(`Scheduling cron job at: ${config.schedule.cron} timezone: ${config.schedule.timezone}`);
  
  cron.schedule(config.schedule.cron, () => {
    runJob();
  }, {
    timezone: config.schedule.timezone
  });
}

module.exports = {
  startScheduler,
  runJob
};
