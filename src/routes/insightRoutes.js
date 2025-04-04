const express = require('express');
const router = express.Router();
const insightController = require('../controllers/insightController');
const authMiddleware = require('../middleware/auth/authMiddleware');
const { insightsRateLimiter } = require('../middleware/rateLimiter');

router.post(
  '/',
  authMiddleware,
  insightsRateLimiter,
  insightController.generateInsight
);
router.get('/', authMiddleware, insightController.getInsights);

module.exports = router;
