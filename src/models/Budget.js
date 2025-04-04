const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  budgets: [
    {
      category: { type: String, required: true },
      limit: { type: Number, required: true },
      spent: { type: Number, default: 0 }, // Added 'spent' field
    },
  ],
});

module.exports = mongoose.model('Budget', budgetSchema);
