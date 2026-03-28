require('dotenv').config();
const Insight = require('../models/Insight');
const Transaction = require('../models/Transaction');

const XAI_API_KEY = process.env.XAI_API_KEY;
const XAI_MODEL = process.env.XAI_MODEL;
const XAI_URL = process.env.XAI_URL;

// Helper: call xAI Grok
const callGrokLLM = async (prompt) => {
  if (!XAI_API_KEY) {
    throw new Error('XAI_API_KEY is not set in environment');
  }

  const fetch = (...args) =>
    import('node-fetch').then(({ default: fetch }) => fetch(...args));

  const response = await fetch('XAI_URL', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${XAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: XAI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
      temperature: 0.7,
    }),
  });

  const textBody = await response.text();
  let data;
  try {
    data = JSON.parse(textBody);
  } catch (e) {
    console.error('xAI non-JSON body:', textBody);
    throw new Error(
      `xAI returned non-JSON (status ${response.status}): ${textBody.slice(0, 200)}...`
    );
  }

  if (!response.ok) {
    console.error('xAI error response:', data);
    throw new Error(data.error?.message || `xAI API error (status ${response.status})`);
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    console.error('Unexpected xAI response shape:', data);
    throw new Error(
      'xAI returned no content: ' + JSON.stringify(data).slice(0, 200) + '...'
    );
  }

  return content;
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
You are a smart and concise personal finance assistant.

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