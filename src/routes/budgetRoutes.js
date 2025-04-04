const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth/authMiddleware');
const budgetController = require('../controllers/budgetController');

router.put('/update', authMiddleware, budgetController.setBudgets);
router.get('/', authMiddleware, budgetController.getBudgets);
router.delete('/:category', authMiddleware, budgetController.deleteBudget);

module.exports = router;
