const express = require('express');
const cors = require('cors');
const config = require('./config');
const db = require('./db');
const routes = require('./api/routes');
const scheduler = require('./jobs/scheduler');
const logger = require('./utils/logger');
const path = require('path');

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

  // Admin Panel Route
  app.get('/admin', (req, res) => {
    const isLocalhost = req.ip === '::1' || req.ip === '127.0.0.1' || req.ip === '::ffff:127.0.0.1';
    if (!isLocalhost) {
      return res.status(403).send('Forbidden: Admin access is only allowed from localhost');
    }
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
  });

  // API Routes
  app.use(config.server.apiBaseUrl, routes);

  // Start Scheduler
  scheduler.startScheduler();

  const PORT = process.env.PORT || config.server.port || 3000;

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
  logger.info(`API Base URL: ${config.server.apiBaseUrl}`);
});
    logger.info(`API Base URL: ${config.server.apiBaseUrl}`);
  });
}

startServer();
