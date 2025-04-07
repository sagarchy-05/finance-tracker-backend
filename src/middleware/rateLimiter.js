const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  handler: (req, res) => {
    const now = new Date();
    const resetTime =
      req.rateLimit.resetTime || new Date(now.getTime() + 60 * 60 * 1000); // fallback
    const retryAfter = Math.ceil((resetTime - now) / 1000); // in seconds

    res.set('Retry-After', retryAfter);
    res.status(429).json({
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter, // in seconds
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = limiter;
