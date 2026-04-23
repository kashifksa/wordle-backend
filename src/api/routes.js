const express = require('express');
const controllers = require('./controllers');
const config = require('../config');

const router = express.Router();

// Middleware to check API key for protected routes
const requireApiKey = (req, res, next) => {
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

module.exports = router;
