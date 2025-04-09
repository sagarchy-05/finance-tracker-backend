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
    } else {
      budget.spent = Math.max(0, budget.spent - amount);
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

    const prevBudget = userBudget.budgets.find(
      (b) => b.category === transaction.category
    );
    const newBudget = userBudget.budgets.find((b) => b.category === category);

    if (!newBudget) {
      return res.status(400).json({ message: `No budget set for ${category}` });
    }

    // Reverse old budget impact
    if (prevBudget) {
      if (transaction.type === 'expense') {
        prevBudget.spent = Math.max(0, prevBudget.spent - transaction.amount);
      } else {
        prevBudget.spent += transaction.amount;
      }
    }

    // Check new budget limit before applying
    if (type === 'expense') {
      if (newBudget.spent + amount > newBudget.limit) {
        return res.status(400).json({
          message: `Updated transaction exceeds budget for ${category}!`,
        });
      }
      newBudget.spent += amount;
    } else {
      newBudget.spent = Math.max(0, newBudget.spent - amount);
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

    const budgetCategory = userBudget.budgets.find(
      (b) => b.category === transaction.category
    );

    if (budgetCategory) {
      if (transaction.type === 'expense') {
        budgetCategory.spent = Math.max(
          0,
          budgetCategory.spent - transaction.amount
        );
      } else if (transaction.type === 'income') {
        budgetCategory.spent += transaction.amount;
      }

      await userBudget.save();
    }

    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
