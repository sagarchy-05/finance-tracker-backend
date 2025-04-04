const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');

// Create a new transaction and update budget spent
exports.createTransaction = async (req, res) => {
  try {
    const { amount, type, category, date, description } = req.body;

    if (!amount || !type || !category) {
      return res
        .status(400)
        .json({ message: 'Amount, type, and category are required' });
    }

    // Find user's budget
    const userBudget = await Budget.findOne({ userId: req.user });
    if (!userBudget) {
      return res
        .status(400)
        .json({ message: 'No budgets found. Set a budget first.' });
    }

    const budget = userBudget.budgets.find((b) => b.category === category);
    if (!budget) {
      return res
        .status(400)
        .json({ message: `No budget found for category: ${category}` });
    }

    if (type === 'expense') {
      if (budget.spent + amount > budget.limit) {
        return res.status(400).json({
          message: `Transaction exceeds budget limit for ${category}`,
        });
      }
      budget.spent += amount;
    } else if (type === 'income') {
      budget.spent -= amount; // Reduce spent for income
    }

    const transaction = new Transaction({
      userId: req.user,
      amount,
      type,
      category,
      date,
      description,
    });
    await transaction.save();
    await userBudget.save();

    res
      .status(201)
      .json({ message: 'Transaction added successfully', transaction });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all transactions for the logged-in user
exports.getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user }).sort({
      date: -1,
    });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update a transaction and adjust budget spent
exports.updateTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { amount, type, category, date, description } = req.body;

    const transaction = await Transaction.findOne({
      _id: transactionId,
      userId: req.user,
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const userBudget = await Budget.findOne({ userId: req.user });

    if (!userBudget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    let budgetCategory = userBudget.budgets.find(
      (b) => b.category === category
    );

    if (!budgetCategory) {
      return res.status(400).json({ message: `No budget set for ${category}` });
    }

    if (type === 'expense') {
      const totalSpent = await Transaction.aggregate([
        { $match: { userId: req.user, category, type: 'expense' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);

      const currentSpent = totalSpent.length ? totalSpent[0].total : 0;
      const newSpentAmount = currentSpent - transaction.amount + amount;

      if (newSpentAmount > budgetCategory.limit) {
        return res.status(400).json({
          message: `Updated transaction exceeds budget for ${category}!`,
        });
      }

      budgetCategory.spent = newSpentAmount;
    }

    // Update transaction
    transaction.amount = amount;
    transaction.type = type;
    transaction.category = category;
    transaction.date = date || transaction.date;
    transaction.description = description || transaction.description;

    await transaction.save();
    await userBudget.save();

    res.json({ message: 'Transaction updated successfully', transaction });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a transaction and update budget spent
exports.deleteTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;

    const transaction = await Transaction.findOneAndDelete({
      _id: transactionId,
      userId: req.user,
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const userBudget = await Budget.findOne({ userId: req.user });

    if (!userBudget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    let budgetCategory = userBudget.budgets.find(
      (b) => b.category === transaction.category
    );

    if (budgetCategory && transaction.type === 'expense') {
      budgetCategory.spent -= transaction.amount;
      if (budgetCategory.spent < 0) budgetCategory.spent = 0;
      await userBudget.save();
    }

    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
