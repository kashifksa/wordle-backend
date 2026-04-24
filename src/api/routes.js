const express = require('express');
const controllers = require('./controllers');
const config = require('../config');

const router = express.Router();

// Middleware to check API key for protected routes
const requireApiKey = (req, res, next) => {
  // Allow localhost for manual admin triggers
  const isLocalhost = req.ip === '::1' || req.ip === '127.0.0.1' || req.ip === '::ffff:127.0.0.1';
  if (isLocalhost) return next();

  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  if (token !== config.security.apiKey) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  next();
};

router.get('/', controllers.getRecent);
router.get('/all', controllers.getAll);
router.post('/save', requireApiKey, controllers.saveManual);
router.post('/fetch', requireApiKey, controllers.fetchManual);

module.exports = router;
