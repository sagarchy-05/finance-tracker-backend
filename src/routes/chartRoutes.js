const express = require('express');
const router = express.Router();
const {
  getCategoryTotals,
  getMonthlyTrends,
  getBudgetVsActual,
  getDailyExpenseSummary,
} = require('../controllers/chartsController');
const authenticateUser = require('../middleware/auth/authMiddleware');

router.use(authenticateUser);

router.get('/category-totals', getCategoryTotals);
router.get('/monthly-trends', getMonthlyTrends);
router.get('/budget-vs-actual', getBudgetVsActual);
router.get('/daily-summary', getDailyExpenseSummary);

module.exports = router;
