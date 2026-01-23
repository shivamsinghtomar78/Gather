import rateLimit from 'express-rate-limit';

// Rate limiter for signin attempts - prevents brute force attacks
export const signinLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 attempts per window
    message: {
        message: 'Too many login attempts. Please try again in 15 minutes.',
        retryAfter: 15
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skipSuccessfulRequests: true, // Don't count successful logins
});

// Rate limiter for signup - prevents mass account creation
export const signupLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 signups per hour per IP
    message: {
        message: 'Too many accounts created from this IP. Please try again in an hour.',
        retryAfter: 60
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiter for password reset requests
export const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 reset requests per hour
    message: {
        message: 'Too many password reset requests. Please try again later.',
        retryAfter: 60
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// General API rate limiter
export const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    message: {
        message: 'Too many requests. Please slow down.',
        retryAfter: 1
    },
    standardHeaders: true,
    legacyHeaders: false,
});
