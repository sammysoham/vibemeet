import rateLimit from "express-rate-limit";

export const generalRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 80,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please slow down." },
});

export const authRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please try again in a minute." },
});
