import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import {
    signupSchema, signinSchema, refreshSchema,
    changePasswordSchema, forgotPasswordSchema,
    resetPasswordSchema, verifyEmailSchema
} from '../schemas/authSchemas';
import { AuthRequest } from '../middleware/auth';
import logger from '../utils/logger';

// Helper to get device info from request
function getDeviceInfo(req: Request): string {
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const ip = req.ip || req.socket.remoteAddress || 'Unknown';
    return `${userAgent.substring(0, 100)} - ${ip}`;
}

export class AuthController {
    static async signup(req: Request, res: Response): Promise<void> {
        try {
            const validation = signupSchema.safeParse(req.body);
            if (!validation.success) {
                logger.warn(`Signup validation failed: ${JSON.stringify(validation.error.errors)}`);
                res.status(411).json({ message: 'Error in inputs', errors: validation.error.errors });
                return;
            }

            await AuthService.signup(validation.data);
            logger.info(`✅ User signed up successfully: ${validation.data.username}`);
            res.status(200).json({ message: 'Signed up successfully.' });
        } catch (error: any) {
            if (error.message === 'USER_EXISTS') {
                logger.warn(`Signup failed: User exists - ${req.body.email}`);
                res.status(403).json({ message: 'An account with this email already exists.' });
            } else {
                logger.error(`Signup error: ${error.message}`);
                res.status(500).json({ message: 'Server error' });
            }
        }
    }

    static async signin(req: Request, res: Response): Promise<void> {
        try {
            const validation = signinSchema.safeParse(req.body);
            if (!validation.success) {
                res.status(411).json({ message: 'Error in inputs', errors: validation.error.errors });
                return;
            }

            const user = await AuthService.signin(validation.data);
            const deviceInfo = getDeviceInfo(req);
            const { accessToken, refreshToken } = AuthService.generateTokens(user._id.toString(), deviceInfo);

            await AuthService.addRefreshToken(user, refreshToken, deviceInfo);

            logger.info(`✅ User signed in: ${user.email}`);
            res.status(200).json({
                message: 'Signed in successfully',
                token: accessToken,
                refreshToken: refreshToken,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email
                }
            });
        } catch (error: any) {
            if (error.message === 'INVALID_CREDENTIALS' || error.message === 'INVALID_CREDENTIALS_USER' || error.message === 'INVALID_CREDENTIALS_PASSWORD') {
                logger.warn(`Signin failed: Invalid credentials (${error.message}) - ${req.body.email}`);
                res.status(403).json({ message: 'Invalid email or password' });
            } else if (error.message === 'ACCOUNT_LOCKED') {
                logger.warn(`Signin failed: Account locked - ${req.body.email}`);
                res.status(423).json({ message: 'Account is temporarily locked.' });
            } else {
                logger.error(`Signin error: ${error.message}`);
                res.status(500).json({ message: 'Server error' });
            }
        }
    }

    static async refresh(req: Request, res: Response): Promise<void> {
        try {
            const validation = refreshSchema.safeParse(req.body);
            if (!validation.success) {
                res.status(411).json({ message: 'Refresh token is required', errors: validation.error.errors });
                return;
            }

            const result = await AuthService.refreshToken(validation.data.refreshToken);
            logger.info(`🔄 Token refreshed for user: ${result.user.email}`);
            res.status(200).json({
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
                expiresIn: 900
            });
        } catch (error: any) {
            if (error.message === 'REFRESH_TOKEN_EXPIRED') {
                logger.warn(`Refresh failed: Token expired`);
                res.status(401).json({ message: 'Refresh token expired. Please sign in again.' });
            } else if (error.message === 'INVALID_REFRESH_TOKEN' || error.message === 'INVALID_TOKEN_TYPE') {
                logger.warn(`Refresh failed: Invalid token`);
                res.status(401).json({ message: 'Invalid refresh token' });
            } else if (error.message === 'USER_NOT_FOUND') {
                logger.warn(`Refresh failed: User not found`);
                res.status(401).json({ message: 'User not found' });
            } else {
                logger.error(`Refresh error: ${error.message}`);
                res.status(500).json({ message: 'Server error' });
            }
        }
    }

    static async logout(req: AuthRequest, res: Response): Promise<void> {
        try {
            if (!req.userId) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }
            await AuthService.logout(req.userId, req.body.refreshToken);
            logger.info(`User logged out: ${req.userId}`);
            res.status(200).json({ message: 'Logged out successfully' });
        } catch (error: any) {
            logger.error(`Logout error: ${error.message}`);
            res.status(500).json({ message: 'Server error' });
        }
    }

    static async logoutAll(req: AuthRequest, res: Response): Promise<void> {
        try {
            if (!req.userId) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }
            await AuthService.logoutAll(req.userId);
            logger.info(`User logged out from all devices: ${req.userId}`);
            res.status(200).json({ message: 'Logged out from all devices successfully' });
        } catch (error: any) {
            logger.error(`LogoutAll error: ${error.message}`);
            res.status(500).json({ message: 'Server error' });
        }
    }

    static async getMe(req: AuthRequest, res: Response): Promise<void> {
        try {
            if (!req.userId) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }
            const user = await AuthService.getUser(req.userId);
            res.status(200).json({ user });
        } catch (error: any) {
            if (error.message === 'USER_NOT_FOUND') {
                res.status(401).json({ message: 'User not found' });
            } else {
                logger.error(`GetMe error: ${error.message}`);
                res.status(500).json({ message: 'Server error' });
            }
        }
    }

    static async changePassword(req: AuthRequest, res: Response): Promise<void> {
        try {
            if (!req.userId) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }
            const validation = changePasswordSchema.safeParse(req.body);
            if (!validation.success) {
                res.status(400).json({ message: 'Invalid input', errors: validation.error.errors });
                return;
            }

            await AuthService.changePassword(req.userId, {
                ...validation.data,
                refreshToken: req.body.refreshToken
            });
            logger.info(`Password changed for user: ${req.userId}`);
            res.status(200).json({ message: 'Password changed successfully' });
        } catch (error: any) {
            if (error.message === 'INVALID_PASSWORD') {
                logger.warn(`Change password failed: Incorrect current password - User ${req.userId}`);
                res.status(403).json({ message: 'Incorrect current password' });
            } else {
                logger.error(`Change password error: ${error.message}`);
                res.status(500).json({ message: 'Server error' });
            }
        }
    }

    static async forgotPassword(req: Request, res: Response): Promise<void> {
        try {
            const validation = forgotPasswordSchema.safeParse(req.body);
            if (!validation.success) {
                res.status(400).json({ message: 'Invalid email', errors: validation.error.errors });
                return;
            }

            const result = await AuthService.forgotPassword(validation.data.email);

            // Log for mock email (in a real app, send actual email)
            if (result) {
                logger.info(`📧 [MOCK EMAIL] Password reset token for ${validation.data.email}: ${result.resetToken}`);
            }

            res.status(200).json({ message: 'If an account exists with that email, a reset link has been sent.' });
        } catch (error: any) {
            logger.error(`Forgot password error: ${error.message}`);
            res.status(500).json({ message: 'Server error' });
        }
    }

    static async resetPassword(req: Request, res: Response): Promise<void> {
        try {
            const validation = resetPasswordSchema.safeParse(req.body);
            if (!validation.success) {
                res.status(400).json({ message: 'Invalid input', errors: validation.error.errors });
                return;
            }

            await AuthService.resetPassword(validation.data.token, validation.data.newPassword);
            logger.info(`Password reset successfully via token`);
            res.status(200).json({ message: 'Password reset successfully' });
        } catch (error: any) {
            if (error.message === 'INVALID_RESET_TOKEN') {
                logger.warn(`Reset password failed: Invalid token`);
                res.status(400).json({ message: 'Invalid or expired reset token' });
            } else {
                logger.error(`Reset password error: ${error.message}`);
                res.status(500).json({ message: 'Server error' });
            }
        }
    }

    static async verifyEmail(req: Request, res: Response): Promise<void> {
        try {
            const validation = verifyEmailSchema.safeParse(req.body);
            if (!validation.success) {
                res.status(400).json({ message: 'Invalid token' });
                return;
            }

            await AuthService.verifyEmail(validation.data.token);
            logger.info(`Email verified via token`);
            res.status(200).json({ message: 'Email verified successfully' });
        } catch (error: any) {
            if (error.message === 'INVALID_VERIFICATION_TOKEN') {
                logger.warn(`Email verification failed: Invalid token`);
                res.status(400).json({ message: 'Invalid or expired verification token' });
            } else {
                logger.error(`Email verification error: ${error.message}`);
                res.status(500).json({ message: 'Server error' });
            }
        }
    }
}
