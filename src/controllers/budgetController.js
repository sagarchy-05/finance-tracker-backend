const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');

// 1. Set or update multiple budgets at once
exports.setBudgets = async (req, res) => {
  try {
    const { budgets } = req.body; // Expecting [{ category, limit }, ...]

    if (!Array.isArray(budgets)) {
      return res.status(400).json({ message: 'Invalid budgets data' });
    }

    let userBudget = await Budget.findOne({ userId: req.user });

    if (!userBudget) {
      userBudget = new Budget({
        userId: req.user,
        budgets: budgets.map((b) => ({ ...b, spent: 0 })),
      });
    } else {
      budgets.forEach((budget) => {
        const existingBudget = userBudget.budgets.find(
          (b) => b.category === budget.category
        );
        if (existingBudget) {
          existingBudget.limit = budget.limit;
        } else {
          userBudget.budgets.push({ ...budget, spent: 0 });
        }
      });
    }

    await userBudget.save();
    res.json({
      message: 'Budgets updated successfully',
      budgets: userBudget.budgets,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// 2. Get the user's budgets
exports.getBudgets = async (req, res) => {
  try {
    const userBudget = await Budget.findOne({ userId: req.user });

    if (!userBudget || userBudget.budgets.length === 0) {
      return res.status(404).json({ message: 'No budgets found' });
    }

    res.json(userBudget.budgets);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// 3. Delete a budget category (if no expenses recorded under it)
exports.deleteBudget = async (req, res) => {
  try {
    const { category } = req.params;

    let userBudget = await Budget.findOne({ userId: req.user });

    if (
      !userBudget ||
      !userBudget.budgets.some((b) => b.category === category)
    ) {
      return res.status(404).json({ message: 'Budget category not found' });
    }

    // Check if transactions exist for this category
    const totalSpent = await Transaction.aggregate([
      { $match: { userId: req.user, category, type: 'expense' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const spent = totalSpent.length ? totalSpent[0].total : 0;

    if (spent > 0) {
      return res.status(400).json({
        message: `Cannot remove budget for ${category} as you have already spent ${spent}`,
      });
    }

    // Filter out the budget that needs to be deleted
    userBudget.budgets = userBudget.budgets.filter(
      (b) => b.category !== category
    );

    await userBudget.save();

    res.json({ message: `Budget for ${category} deleted successfully` });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
