import rateLimit from 'express-rate-limit';
import logger from '../utils/logger.js';

const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_AI_MAX) || 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    if (req.user?.id) return `ai_${req.user.id}`;
    return `ai_ip_${req.ip}`;
  },
  message: {
    success: false,
    error: 'AI rate limit exceeded. Maximum 20 requests per minute.',
    code: 'AI_RATE_LIMIT_EXCEEDED'
  },
  handler: (req, res) => {
    logger.warn(`[RateLimit] AI limit exceeded: User=${req.user?.id || 'anon'}, IP=${req.ip}`);
    res.status(429).json({
      success: false,
      error: 'Too many AI requests. Please wait a moment before sending more messages.',
      code: 'AI_RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil((req.rateLimit?.resetTime || Date.now() + 60000) / 1000)
    });
  },
  skip: (req) => {
    if (req.user?.role === 'superadmin') return true;
    return false;
  }
});

export default aiRateLimiter;
