import rateLimit from "express-rate-limit";
import { rateLimitConfig } from "@/config";

export const createRateLimit = (options?: {
  windowMs?: number;
  max?: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}) => {
  return rateLimit({
    windowMs: options?.windowMs || rateLimitConfig.windowMs,
    max: options?.max || rateLimitConfig.maxRequests,
    message: {
      success: false,
      error: "Too many requests",
      message: options?.message || "Too many requests from this IP, please try again later",
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: options?.skipSuccessfulRequests || false,
    skipFailedRequests: options?.skipFailedRequests || false,
    handler: (_req, res) => {
      res.status(429).json({
        success: false,
        error: "Rate limit exceeded",
        message: options?.message || "Too many requests from this IP, please try again later",
        retryAfter: Math.ceil(rateLimitConfig.windowMs / 1000),
      });
    },
  });
};

// General API rate limit
export const generalRateLimit = createRateLimit({
  max: 100, // 100 requests per window
  message: "Too many requests, please try again later",
});

// Strict rate limit for sensitive operations
export const strictRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: "Too many sensitive operations, please slow down",
});

// Auth rate limit for login attempts
export const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per 15 minutes
  message: "Too many authentication attempts, please try again later",
  skipSuccessfulRequests: true,
});

// GitHub API operation rate limit
export const githubApiRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 50, // 50 GitHub API calls per minute
  message: "Too many GitHub API calls, please slow down to avoid hitting GitHub's rate limits",
});

// Batch operations rate limit
export const batchOperationRateLimit = createRateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // 3 batch operations per 5 minutes
  message: "Too many batch operations, please wait before performing more bulk actions",
}); 