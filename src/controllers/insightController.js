require('dotenv').config();
const Insight = require('../models/Insight');
const Transaction = require('../models/Transaction');

const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
const HF_MODEL = process.env.HF_MODEL || 'tiiuae/falcon-7b-instruct';

const generateInsight = async (req, res) => {
  try {
    const fetch = (...args) =>
      import('node-fetch').then(({ default: fetch }) => fetch(...args));

    const userId = req.user?._id || req.user;
    const transactions = await Transaction.find({ userId });

    if (transactions.length === 0) {
      return res.status(200).json({
        message: 'No transactions present to generate insights on.',
        insights: [],
      });
    }

    const transactionText = transactions
      .map(
        (t) =>
          `₹${t.amount} for ${t.category}${
            t.description ? ` (${t.description})` : ''
          }`
      )
      .join(', ');

    const prompt = `
You are a smart and concise personal finance assistant.

Given the following list of recent financial transactions, generate exactly 3 to 5 personalized insights that will help the user save money, spot spending patterns, or improve financial habits.

Respond ONLY with bullet points that start with a dash (-). Do NOT mention or repeat the transactions. Avoid generic tips. Each bullet must be concise and actionable.

Transactions:
${transactionText}
`;

    const response = await fetch(
      `https://api-inference.huggingface.co/models/${HF_MODEL}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          options: { wait_for_model: true },
        }),
      }
    );

    const result = await response.json();

    if (!response.ok || !Array.isArray(result) || !result[0]?.generated_text) {
      throw new Error(result?.error || 'Invalid AI response format');
    }

    const rawText = result[0]?.generated_text || '';
    const aiInsight = rawText
      .split('\n')
      .map((line) => line.replace(/^[-*]\s*-?\s*/, '- ').trim()) // Clean up bullets
      .filter((line) => line && line.startsWith('-')) // Only keep lines that are actual insights
      .slice(0, 5)
      .join('\n')
      .trim();

    // fallback if AI response is invalid or just echoed the prompt
    const isValidInsight =
      aiInsight &&
      !aiInsight.includes('Transactions:') &&
      aiInsight.split('\n').length >= 3;

    const savedInsight = await Insight.create({
      userId,
      content: isValidInsight ? aiInsight : 'No insight generated',
    });

    res.status(200).json({ insight: savedInsight });
  } catch (error) {
    console.error('Error generating insight:', error);
    res
      .status(500)
      .json({ message: 'Failed to generate insight', error: error.message });
  }
};

const getInsights = async (req, res) => {
  try {
    const userId = req.user?._id || req.user;
    const insights = await Insight.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json({ insights });
  } catch (error) {
    console.error('Error fetching insights:', error);
    res
      .status(500)
      .json({ message: 'Failed to fetch insights', error: error.message });
  }
};

module.exports = { generateInsight, getInsights };
