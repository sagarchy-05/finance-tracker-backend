const express = require('express');
const authMiddleware = require('../middleware/auth/authMiddleware');

const transactionController = require('../controllers/transactionController');

const router = express.Router();

router.post('/create', authMiddleware, transactionController.createTransaction);
router.get('/all', authMiddleware, transactionController.getTransactions);
router.put(
  '/:transactionId',
  authMiddleware,
  transactionController.updateTransaction
);

router.delete(
  '/delete/:transactionId',
  authMiddleware,
  transactionController.deleteTransaction
);

module.exports = router;
