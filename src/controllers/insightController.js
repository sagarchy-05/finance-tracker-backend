require('dotenv').config();
const { createXai } = require('@ai-sdk/xai');
const { generateText } = require('ai');
const Insight = require('../models/Insight');
const Transaction = require('../models/Transaction');

const xai = createXai({ apiKey: process.env.XAI_API_KEY });
const xaiModel = process.env.XAI_MODEL;

// Helper: call xAI Grok via AI SDK
const callGrokLLM = async (prompt) => {
  if (!process.env.XAI_API_KEY) {
    throw new Error('XAI_API_KEY is not set in environment');
  }

  const { text } = await generateText({
    model: xai(xaiModel),
    system: 'You are a smart and concise personal finance assistant.',
    prompt,
    maxTokens: 300,
    temperature: 0.7,
  });

  if (!text) {
    throw new Error('xAI returned no content');
  }

  return text;
};

const generateInsight = async (req, res) => {
  try {
    const userId = req.user?._id || req.user;

    if (!userId) {
      throw new Error('req.user is not set. Check your auth middleware.');
    }

    const transactions = await Transaction.find({ userId });

    if (!transactions || transactions.length === 0) {
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
Given the following list of recent financial transactions, generate exactly 3 to 5 personalized insights that will help the user save money, spot spending patterns, or improve financial habits.

Respond ONLY with bullet points that start with a dash (-). Do NOT mention or repeat the transactions. Avoid generic tips. Each bullet must be concise and actionable.

Transactions:
${transactionText}
`;

    const rawText = await callGrokLLM(prompt);

    const aiInsight = rawText
      .split('\n')
      .map((line) => line.replace(/^[-*]\s*-?\s*/, '- ').trim())
      .filter((line) => line && line.startsWith('-'))
      .slice(0, 5)
      .join('\n')
      .trim();

    const isValidInsight =
      aiInsight &&
      !aiInsight.includes('Transactions:') &&
      aiInsight.split('\n').length >= 3;

    const savedInsight = await Insight.create({
      userId,
      content: isValidInsight ? aiInsight : 'No insight generated',
    });

    return res.status(200).json({ insight: savedInsight });
  } catch (error) {
    console.error('Error generating insight:', error);
    return res
      .status(500)
      .json({ message: 'Failed to generate insight', error: error.message });
  }
};

const getInsights = async (req, res) => {
  try {
    const userId = req.user?._id || req.user;
    const insights = await Insight.find({ userId }).sort({ createdAt: -1 });
    return res.status(200).json({ insights });
  } catch (error) {
    console.error('Error fetching insights:', error);
    return res
      .status(500)
      .json({ message: 'Failed to fetch insights', error: error.message });
  }
};

module.exports = { generateInsight, getInsights };