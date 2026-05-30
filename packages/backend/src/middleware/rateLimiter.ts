import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

// Initialize connection with Redis database or fallback silently
let redisClient: Redis | null = null;
try {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  redisClient = new Redis(redisUrl, { maxRetriesPerRequest: 1 });
} catch (e) {
  console.warn('Redis rate-limiting store offline. Falling back to local in-memory gatekeepers.');
}

const getStore = () => {
  if (redisClient) {
    try {
      return new RedisStore({
        // @ts-expect-error - ioredis type compatibility
        sendCommand: (...args: string[]) => redisClient.call(args[0], ...args.slice(1)),
      });
    } catch (e) {
      return undefined;
    }
  }
  return undefined;
};

/**
 * Standard Global API rate-limiter gate (100 requests per 15 minutes)
 */
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  store: getStore(),
  message: {
    status: 'error',
    code: 'TOO_MANY_REQUESTS',
    message: 'Global rate limit exceeded. Please try again after 15 minutes.'
  }
});

/**
 * High Strictness rate-limiter gate for authentication endpoints (5 requests per 15 minutes)
 * Protects against Brute Force & Credential Stuffing attacks
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  store: getStore(),
  message: {
    status: 'error',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
    message: 'Too many authentication attempts. Lockout triggered. Please retry after 15 minutes.'
  }
});

/**
 * High Speed Flood Protection gate for Messaging & Social Comments (30 requests per minute)
 */
export const socialRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  store: getStore(),
  message: {
    status: 'error',
    code: 'SOCIAL_RATE_LIMIT_EXCEEDED',
    message: 'Message/Comment flood detected. Rate limit exceeded. Throttling active.'
  }
});

/**
 * Safe File upload gate throttled at 10 requests per 15 minutes
 */
export const uploadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: getStore(),
  message: {
    status: 'error',
    code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
    message: 'Too many file uploads. Throttling active to prevent memory fatigue.'
  }
});
