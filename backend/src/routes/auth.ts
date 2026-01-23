import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import { User, IUser } from '../models/User';
import { signinLimiter, signupLimiter, passwordResetLimiter } from '../middleware/rateLimiter';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Constants
const ACCESS_TOKEN_EXPIRY = '15m'; // Short-lived access token
const REFRESH_TOKEN_EXPIRY_DAYS = 30; // Long-lived refresh token
const SALT_ROUNDS = 12; // Increased from 10 for better security

// Validation schemas
const signupSchema = z.object({
    username: z.string()
        .min(3, 'Username must be at least 3 characters')
        .max(30, 'Username must be at most 30 characters')
        .regex(/^[a-zA-Z0-9_ ]+$/, 'Username can only contain letters, numbers, underscores, and spaces'),
    email: z.string()
        .email('Invalid email format'),
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .max(20, 'Password must be at most 20 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character')
});

const signinSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string()
});

const refreshSchema = z.object({
    refreshToken: z.string()
});

const forgotPasswordSchema = z.object({
    email: z.string().email('Invalid email format')
});

const resetPasswordSchema = z.object({
    token: z.string(),
    newPassword: z.string()
        .min(8, 'Password must be at least 8 characters')
        .max(20, 'Password must be at most 20 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character')
});

const verifyEmailSchema = z.object({
    token: z.string()
});

// Helper function to generate tokens
function generateTokens(userId: string, deviceInfo?: string) {
    const jwtSecret = process.env.JWT_SECRET!;

    // Access token - short lived
    const accessToken = jwt.sign(
        { userId, type: 'access' },
        jwtSecret,
        { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    // Refresh token - long lived
    const refreshToken = jwt.sign(
        { userId, type: 'refresh', device: deviceInfo },
        jwtSecret,
        { expiresIn: `${REFRESH_TOKEN_EXPIRY_DAYS}d` }
    );

    return { accessToken, refreshToken };
}

// Helper function to hash sensitive tokens (refresh tokens, reset tokens)
function hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
}

// Helper function to get device info from request
function getDeviceInfo(req: Request): string {
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const ip = req.ip || req.socket.remoteAddress || 'Unknown';
    return `${userAgent.substring(0, 100)} - ${ip}`;
}

// POST /api/v1/signup
router.post('/signup', signupLimiter, async (req: Request, res: Response): Promise<void> => {
    console.log('📝 Signup request received');

    try {
        // Validate input
        const validation = signupSchema.safeParse(req.body);
        if (!validation.success) {
            console.log('❌ Validation failed:', validation.error.errors);
            res.status(411).json({
                message: 'Error in inputs',
                errors: validation.error.errors
            });
            return;
        }

        const { username, email, password } = validation.data;
        console.log(`✅ Validation passed for user: ${username}, email: ${email}`);

        // Check if user already exists by username
        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            console.log(`⚠️ Username already exists: ${username}`);
            res.status(403).json({ message: 'User already exists with this username' });
            return;
        }

        // Check if user already exists by email
        const existingEmail = await User.findOne({ email: email.toLowerCase() });
        if (existingEmail) {
            console.log(`⚠️ Email already exists: ${email}`);
            res.status(403).json({ message: 'User already exists with this email' });
            return;
        }

        // Hash password with higher cost factor
        console.log('🔐 Hashing password...');
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        // Create user
        console.log('💾 Creating user in database...');
        const verificationToken = crypto.randomBytes(32).toString('hex');
        await User.create({
            username,
            email: email.toLowerCase(),
            password: hashedPassword,
            refreshTokens: [],
            loginAttempts: 0,
            isEmailVerified: false, // Now disabled by default
            emailVerificationToken: hashToken(verificationToken),
            emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        });

        console.log(`✅ User created successfully: ${username}`);
        console.log(`📧 [MOCK EMAIL] Verification token for ${email}: ${verificationToken}`);
        res.status(200).json({ message: 'Signed up successfully. Please verify your email.' });
    } catch (error) {
        console.error('❌ Signup error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/v1/signin
router.post('/signin', signinLimiter, async (req: Request, res: Response): Promise<void> => {
    console.log('🔑 Signin request received');

    try {
        // Validate input
        const validation = signinSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(411).json({
                message: 'Error in inputs',
                errors: validation.error.errors
            });
            return;
        }

        const { email, password } = validation.data;

        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            // Generic error to prevent user enumeration
            res.status(403).json({ message: 'Invalid email or password' });
            return;
        }

        // Check if account is locked
        if (user.isLocked()) {
            const lockTime = user.lockUntil ? Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000) : 15;
            console.log(`🔒 Account locked for user: ${email}`);
            res.status(423).json({
                message: `Account is temporarily locked. Please try again in ${lockTime} minutes.`,
                code: 'ACCOUNT_LOCKED',
                retryAfter: lockTime
            });
            return;
        }

        // Check if email is verified
        if (!user.isEmailVerified) {
            res.status(403).json({
                message: 'Please verify your email before signing in.',
                code: 'EMAIL_NOT_VERIFIED'
            });
            return;
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            // Increment login attempts
            await user.incLoginAttempts();
            console.log(`❌ Invalid password for user: ${email}, attempts: ${user.loginAttempts + 1}`);

            const attemptsRemaining = Math.max(0, 5 - (user.loginAttempts + 1));
            res.status(403).json({
                message: 'Invalid email or password',
                attemptsRemaining: attemptsRemaining > 0 ? attemptsRemaining : undefined
            });
            return;
        }

        // Reset login attempts on successful login
        await user.resetLoginAttempts();

        // Generate JWT token
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            res.status(500).json({ message: 'JWT secret not configured' });
            return;
        }

        const deviceInfo = getDeviceInfo(req);
        const { accessToken, refreshToken } = generateTokens(user._id.toString(), deviceInfo);

        // Store refresh token in database
        const refreshTokenExpiry = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
        const sessionId = crypto.randomUUID();

        // Limit stored refresh tokens to 5 per user (removes oldest if exceeded)
        if (user.refreshTokens.length >= 5) {
            user.refreshTokens = user.refreshTokens.slice(-4); // Keep last 4
        }

        user.refreshTokens.push({
            sessionId,
            token: hashToken(refreshToken), // Store hashed token
            deviceInfo,
            createdAt: new Date(),
            expiresAt: refreshTokenExpiry
        });
        await user.save();

        console.log(`✅ User signed in successfully: ${email}`);

        res.status(200).json({
            accessToken,
            refreshToken,
            expiresIn: 900, // 15 minutes in seconds
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error('❌ Signin error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/v1/refresh - Refresh access token
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
    console.log('🔄 Token refresh request received');

    try {
        const validation = refreshSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(411).json({
                message: 'Refresh token is required',
                errors: validation.error.errors
            });
            return;
        }

        const { refreshToken } = validation.data;

        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            res.status(500).json({ message: 'JWT secret not configured' });
            return;
        }

        // Verify refresh token
        let decoded: any;
        try {
            decoded = jwt.verify(refreshToken, jwtSecret);
        } catch (err: any) {
            if (err.name === 'TokenExpiredError') {
                res.status(401).json({
                    message: 'Refresh token expired. Please sign in again.',
                    code: 'REFRESH_TOKEN_EXPIRED'
                });
                return;
            }
            res.status(401).json({ message: 'Invalid refresh token' });
            return;
        }

        // Ensure it's a refresh token
        if (decoded.type !== 'refresh') {
            res.status(401).json({ message: 'Invalid token type' });
            return;
        }

        // Find user and verify token exists in their refresh tokens
        const user = await User.findById(decoded.userId);
        if (!user) {
            res.status(401).json({ message: 'User not found' });
            return;
        }

        // Check if refresh token is in user's stored tokens
        const hashedRefreshToken = hashToken(refreshToken);
        const tokenIndex = user.refreshTokens.findIndex(rt => rt.token === hashedRefreshToken);
        if (tokenIndex === -1) {
            // Token not found - might be stolen or already used
            console.log(`⚠️ Refresh token not found for user: ${user.email}`);
            res.status(401).json({
                message: 'Invalid refresh token. Please sign in again.',
                code: 'INVALID_REFRESH_TOKEN'
            });
            return;
        }

        // Check if token is expired in database
        if (user.refreshTokens[tokenIndex].expiresAt < new Date()) {
            // Remove expired token
            user.refreshTokens.splice(tokenIndex, 1);
            await user.save();
            res.status(401).json({
                message: 'Refresh token expired. Please sign in again.',
                code: 'REFRESH_TOKEN_EXPIRED'
            });
            return;
        }

        // Generate new tokens (token rotation for security)
        const deviceInfo = user.refreshTokens[tokenIndex].deviceInfo;
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateTokens(
            user._id.toString(),
            deviceInfo
        );

        // Replace old refresh token with new one (rotation)
        user.refreshTokens[tokenIndex] = {
            sessionId: user.refreshTokens[tokenIndex].sessionId, // Keep same session ID
            token: hashToken(newRefreshToken), // Store hashed token
            deviceInfo,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
        };
        await user.save();

        console.log(`✅ Token refreshed for user: ${user.email}`);

        res.status(200).json({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            expiresIn: 900 // 15 minutes in seconds
        });
    } catch (error) {
        console.error('❌ Token refresh error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/v1/logout - Logout and invalidate refresh token
router.post('/logout', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    console.log('🚪 Logout request received');

    try {
        const { refreshToken } = req.body;
        const userId = req.userId;

        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        const user = await User.findById(userId);
        if (!user) {
            res.status(401).json({ message: 'User not found' });
            return;
        }

        if (refreshToken) {
            // Remove specific refresh token
            const hashedToken = hashToken(refreshToken);
            user.refreshTokens = user.refreshTokens.filter(rt => rt.token !== hashedToken);
        }

        await user.save();

        console.log(`✅ User logged out: ${user.email}`);
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('❌ Logout error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/v1/logout-all - Logout from all devices
router.post('/logout-all', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    console.log('🚪 Logout from all devices request received');

    try {
        const userId = req.userId;

        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        const user = await User.findById(userId);
        if (!user) {
            res.status(401).json({ message: 'User not found' });
            return;
        }

        // Clear all refresh tokens
        user.refreshTokens = [];
        await user.save();

        console.log(`✅ User logged out from all devices: ${user.email}`);
        res.status(200).json({ message: 'Logged out from all devices successfully' });
    } catch (error) {
        console.error('❌ Logout all error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /api/v1/sessions - Get all active sessions
router.get('/sessions', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.userId;

        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        const user = await User.findById(userId);
        if (!user) {
            res.status(401).json({ message: 'User not found' });
            return;
        }

        // Return sanitized session info (without actual tokens)
        const sessions = user.refreshTokens.map((rt) => ({
            id: rt.sessionId,
            deviceInfo: rt.deviceInfo,
            createdAt: rt.createdAt,
            expiresAt: rt.expiresAt,
            isActive: rt.expiresAt > new Date()
        }));

        res.status(200).json({ sessions });
    } catch (error) {
        console.error('❌ Get sessions error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// DELETE /api/v1/sessions/:id - Revoke a specific session
router.delete('/sessions/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.userId;

        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        const user = await User.findById(userId);
        if (!user) {
            res.status(401).json({ message: 'User not found' });
            return;
        }

        // Find the index of the session by ID
        const sessionIndex = user.refreshTokens.findIndex(rt => rt.sessionId === req.params.id);

        if (sessionIndex === -1) {
            res.status(404).json({ message: 'Session not found' });
            return;
        }

        // Remove the session
        user.refreshTokens.splice(sessionIndex, 1);
        await user.save();

        console.log(`✅ Session ${req.params.id} revoked for user: ${user.email}`);
        res.status(200).json({ message: 'Session revoked successfully' });
    } catch (error) {
        console.error('❌ Revoke session error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/v1/forgot-password - Request password reset
router.post('/forgot-password', passwordResetLimiter, async (req: Request, res: Response): Promise<void> => {
    try {
        const validation = forgotPasswordSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ message: 'Invalid email', errors: validation.error.errors });
            return;
        }

        const { email } = validation.data;
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            // Generic message to prevent account enumeration
            res.status(200).json({ message: 'If an account exists with that email, a reset link has been sent.' });
            return;
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        user.passwordResetToken = hashToken(resetToken);
        user.passwordResetExpires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour
        await user.save();

        // MOCK EMAIL LOGGING
        console.log(`📧 [MOCK EMAIL] Password reset token for ${email}: ${resetToken}`);

        res.status(200).json({ message: 'If an account exists with that email, a reset link has been sent.' });
    } catch (error) {
        console.error('❌ Forgot password error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/v1/reset-password - Reset password with token
router.post('/reset-password', async (req: Request, res: Response): Promise<void> => {
    try {
        const validation = resetPasswordSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ message: 'Invalid input', errors: validation.error.errors });
            return;
        }

        const { token, newPassword } = validation.data;
        const hashedToken = hashToken(token);

        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: new Date() }
        });

        if (!user) {
            res.status(400).json({ message: 'Invalid or expired reset token' });
            return;
        }

        // Hash new password
        user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;

        // Invalidate all existing sessions for security after password change
        user.refreshTokens = [];
        await user.save();

        console.log(`✅ Password reset successfully for user: ${user.email}`);
        res.status(200).json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('❌ Reset password error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/v1/verify-email - Verify email with token
router.post('/verify-email', async (req: Request, res: Response): Promise<void> => {
    try {
        const validation = verifyEmailSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ message: 'Invalid token' });
            return;
        }

        const { token } = validation.data;
        const hashedToken = hashToken(token);

        const user = await User.findOne({
            emailVerificationToken: hashedToken,
            emailVerificationExpires: { $gt: new Date() }
        });

        if (!user) {
            res.status(400).json({ message: 'Invalid or expired verification token' });
            return;
        }

        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();

        console.log(`✅ Email verified for user: ${user.email}`);
        res.status(200).json({ message: 'Email verified successfully' });
    } catch (error) {
        console.error('❌ Email verification error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/v1/resend-verification - Resend verification email
router.post('/resend-verification', async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ message: 'Email is required' });
            return;
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            // Generic message
            res.status(200).json({ message: 'If an account exists, a verification email has been sent.' });
            return;
        }

        if (user.isEmailVerified) {
            res.status(400).json({ message: 'Email is already verified' });
            return;
        }

        const verificationToken = crypto.randomBytes(32).toString('hex');
        user.emailVerificationToken = hashToken(verificationToken);
        user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await user.save();

        // MOCK EMAIL LOGGING
        console.log(`📧 [MOCK EMAIL] New verification token for ${email}: ${verificationToken}`);

        res.status(200).json({ message: 'Verification email sent.' });
    } catch (error) {
        console.error('❌ Resend verification error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /api/v1/me - Get current user info
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.userId;

        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        const user = await User.findById(userId).select('-password -refreshTokens -emailVerificationToken -passwordResetToken');
        if (!user) {
            res.status(401).json({ message: 'User not found' });
            return;
        }

        res.status(200).json({
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                isEmailVerified: user.isEmailVerified,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error('❌ Get user error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;
