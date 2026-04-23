const express = require('express');
const cors = require('cors');
const config = require('./config');
const db = require('./db');
const routes = require('./api/routes');
const scheduler = require('./jobs/scheduler');
const logger = require('./utils/logger');

async function startServer() {
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(cors({ origin: config.server.corsOrigin }));

  // Initialize DB
  try {
    await db.initDb();
  } catch (error) {
    logger.error('Could not initialize DB. Shutting down.', error);
    process.exit(1);
  }

  // Health endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API Routes
  app.use(config.server.apiBaseUrl, routes);

  // Start Scheduler
  scheduler.startScheduler();

  app.listen(config.server.port, () => {
    logger.info(`Server is running on port ${config.server.port}`);
    logger.info(`API Base URL: ${config.server.apiBaseUrl}`);
  });
}

startServer();
