const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const mongoose = require('mongoose');

// 1. Category-wise totals
const getCategoryTotals = async (req, res) => {
  try {
    const userId = req.user?._id || req.user;

    const totals = await Transaction.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
        },
      },
      {
        $project: {
          _id: 0,
          category: '$_id',
          total: 1,
        },
      },
    ]);

    res.status(200).json({ data: totals });
  } catch (err) {
    console.error('Error in getCategoryTotals:', err);
    res
      .status(500)
      .json({ message: 'Failed to fetch category totals', error: err.message });
  }
};

// 2. Monthly spending trends
const getMonthlyTrends = async (req, res) => {
  try {
    const userId = req.user?._id || req.user;

    const trends = await Transaction.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
          },
          total: { $sum: '$amount' },
        },
      },
      {
        $project: {
          month: {
            $concat: [
              { $toString: '$_id.year' },
              '-',
              {
                $cond: [
                  { $lt: ['$_id.month', 10] },
                  { $concat: ['0', { $toString: '$_id.month' }] },
                  { $toString: '$_id.month' },
                ],
              },
            ],
          },
          total: 1,
          _id: 0,
        },
      },
      { $sort: { month: 1 } },
    ]);

    res.status(200).json({ data: trends });
  } catch (err) {
    console.error('Error in getMonthlyTrends:', err);
    res
      .status(500)
      .json({ message: 'Failed to fetch monthly trends', error: err.message });
  }
};

// 3. Budget vs actual comparison
const getBudgetVsActual = async (req, res) => {
  try {
    const userId = req.user._id || req.user;
    const userBudgetDoc = await Budget.findOne({ userId });

    if (!userBudgetDoc || !userBudgetDoc.budgets.length) {
      return res.status(200).json({ data: [] });
    }

    const results = await Promise.all(
      userBudgetDoc.budgets.map(async (b) => {
        const spent = await Transaction.aggregate([
          {
            $match: {
              userId,
              category: b.category,
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' },
            },
          },
        ]);

        return {
          category: b.category,
          budget: b.limit,
          spent: spent[0]?.total || 0,
        };
      })
    );

    res.status(200).json({ data: results });
  } catch (error) {
    console.error('Error in getBudgetVsActual:', error);
    res.status(500).json({
      message: 'Failed to fetch budget comparison',
      error: error.message,
    });
  }
};

// 4. Daily expense summary
const getDailyExpenseSummary = async (req, res) => {
  try {
    const userId = req.user?._id || req.user;

    const summary = await Transaction.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            day: { $dayOfMonth: '$date' },
          },
          total: { $sum: '$amount' },
        },
      },
      {
        $project: {
          date: {
            $dateFromParts: {
              year: '$_id.year',
              month: '$_id.month',
              day: '$_id.day',
            },
          },
          total: 1,
          _id: 0,
        },
      },
      { $sort: { date: 1 } },
    ]);

    res.status(200).json({ data: summary });
  } catch (err) {
    console.error('Error in getDailyExpenseSummary:', err);
    res
      .status(500)
      .json({ message: 'Failed to fetch daily summary', error: err.message });
  }
};

module.exports = {
  getCategoryTotals,
  getMonthlyTrends,
  getBudgetVsActual,
  getDailyExpenseSummary,
};
