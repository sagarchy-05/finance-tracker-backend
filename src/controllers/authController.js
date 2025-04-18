const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendVerificationEmail } = require('../utils/emailService');
const logger = require('../utils/logger');
const { JWT_SECRET, CLIENT_URL } = require('../utils/constants');

// User Signup
exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({ name, email, password: hashedPassword });
    await user.save();

    const Budget = require('../models/Budget');
    const defaultBudget = new Budget({
      userId: user._id,
      budgets: [
        {
          category: 'Others',
          limit: 0,
          spent: 0,
        },
      ],
    });
    await defaultBudget.save();

    await sendVerificationEmail(user);

    res.status(201).json({
      message: 'Signup successful. Check your email for verification!',
    });
    logger.info(`New user signed up: ${email}`);
  } catch (error) {
    logger.error(`Signup error: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// User Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      return res
        .status(403)
        .json({ message: 'Please verify your email first' });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        name: user.name,
        email: user.email,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        name: user.name,
        email: user.email,
      },
    });
    logger.info(`User logged in: ${email}`);
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Email Verification
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const decoded = jwt.verify(token, JWT_SECRET);

    await User.findByIdAndUpdate(decoded.userId, { isVerified: true });

    res.redirect(`${CLIENT_URL}/verify-success`);
    logger.info(`Email verified for userId: ${decoded.userId}`);
  } catch (error) {
    logger.warn(`Email verification failed: ${error.message}`);
    res.redirect(`${CLIENT_URL}/verify-failed`);
  }
};

//Resend Verification
exports.resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    await sendVerificationEmail(user);

    res.json({ message: 'Verification email resent. Check your inbox!' });
    logger.info(`Resent verification email to: ${email}`);
  } catch (error) {
    logger.error(`Resend verification error: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
