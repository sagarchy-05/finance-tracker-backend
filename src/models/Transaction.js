const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: true,
    },
    date: { type: Date, default: Date.now },
    description: { type: String, default: '', trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transaction', transactionSchema);
