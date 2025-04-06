module.exports = {
  TOKEN_EXPIRY: '1d',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  JWT_SECRET: process.env.JWT_SECRET,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  EMAIL_VERIFICATION_SUBJECT: 'Verify Your Email - Finance Tracker',
  DEFAULT_BUDGET_CATEGORIES: [
    'Food',
    'Transport',
    'Entertainment',
    'Groceries',
    'Shopping',
    'Health',
  ],
  SUPPORTED_TRANSACTION_TYPES: ['income', 'expense'],
};
