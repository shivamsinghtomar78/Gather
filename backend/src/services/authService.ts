import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User, IUser } from '../models/User';
import { ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY_DAYS, SALT_ROUNDS, JWT_SECRET } from '../config/constants';

export class AuthService {
    static async signup(data: any) {
        const { username, email, password } = data;

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            throw new Error('USER_EXISTS');
        }

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        const user = await User.create({
            username,
            email: email.toLowerCase(),
            password: hashedPassword,
            refreshTokens: [],
            loginAttempts: 0,
            isEmailVerified: true
        });

        return user;
    }

    static async signin(data: any) {
        const { email, password } = data;

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            throw new Error('INVALID_CREDENTIALS');
        }

        if (user.isLocked()) {
            throw new Error('ACCOUNT_LOCKED');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            await user.incLoginAttempts();
            throw new Error('INVALID_CREDENTIALS');
        }

        await user.resetLoginAttempts();
        return user;
    }

    static generateTokens(userId: string, deviceInfo?: string) {
        if (!JWT_SECRET) throw new Error('JWT_SECRET not configured');

        const accessToken = jwt.sign(
            { userId, type: 'access' },
            JWT_SECRET,
            { expiresIn: ACCESS_TOKEN_EXPIRY }
        );

        const refreshToken = jwt.sign(
            { userId, type: 'refresh', device: deviceInfo },
            JWT_SECRET,
            { expiresIn: `${REFRESH_TOKEN_EXPIRY_DAYS}d` }
        );

        return { accessToken, refreshToken };
    }

    static hashToken(token: string): string {
        return crypto.createHash('sha256').update(token).digest('hex');
    }

    static async addRefreshToken(user: any, refreshToken: string, deviceInfo: string) {
        const hashedToken = this.hashToken(refreshToken);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);
        const sessionId = crypto.randomUUID();

        user.refreshTokens.push({
            sessionId,
            token: hashedToken,
            deviceInfo,
            lastActive: new Date(),
            expiresAt
        });

        // Limit number of active sessions (e.g., 5)
        if (user.refreshTokens.length > 5) {
            user.refreshTokens.shift(); // Remove oldest
        }

        await user.save();
    }

    static async refreshToken(refreshToken: string) {
        if (!JWT_SECRET) throw new Error('JWT_SECRET_MISSING');

        // Verify refresh token
        let decoded: any;
        try {
            decoded = jwt.verify(refreshToken, JWT_SECRET);
        } catch (err: any) {
            if (err.name === 'TokenExpiredError') {
                throw new Error('REFRESH_TOKEN_EXPIRED');
            }
            throw new Error('INVALID_REFRESH_TOKEN');
        }

        if (decoded.type !== 'refresh') {
            throw new Error('INVALID_TOKEN_TYPE');
        }

        const user = await User.findById(decoded.userId);
        if (!user) {
            throw new Error('USER_NOT_FOUND');
        }

        const hashedRefreshToken = this.hashToken(refreshToken);
        const tokenIndex = user.refreshTokens.findIndex((rt: any) => rt.token === hashedRefreshToken);

        if (tokenIndex === -1) {
            throw new Error('INVALID_REFRESH_TOKEN');
        }

        if (user.refreshTokens[tokenIndex].expiresAt < new Date()) {
            user.refreshTokens.splice(tokenIndex, 1);
            await user.save();
            throw new Error('REFRESH_TOKEN_EXPIRED');
        }

        // Rotate token
        const deviceInfo = user.refreshTokens[tokenIndex].deviceInfo;
        const { accessToken, refreshToken: newRefreshToken } = this.generateTokens(user._id.toString(), deviceInfo);

        user.refreshTokens[tokenIndex] = {
            sessionId: user.refreshTokens[tokenIndex].sessionId,
            token: this.hashToken(newRefreshToken),
            deviceInfo,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
        };

        await user.save();

        return { accessToken, refreshToken: newRefreshToken, user };
    }

    static async logout(userId: string, refreshToken?: string) {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('USER_NOT_FOUND');
        }

        if (refreshToken) {
            const hashedToken = this.hashToken(refreshToken);
            user.refreshTokens = user.refreshTokens.filter((rt: any) => rt.token !== hashedToken);
        }

        await user.save();
    }

    static async logoutAll(userId: string) {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('USER_NOT_FOUND');
        }
        user.refreshTokens = [];
        await user.save();
    }

    static async forgotPassword(email: string) {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return null; // Prevent enumeration

        const resetToken = crypto.randomBytes(32).toString('hex');
        user.passwordResetToken = this.hashToken(resetToken);
        user.passwordResetExpires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour
        await user.save();

        return { resetToken, user };
    }

    static async resetPassword(token: string, newPassword: string) {
        const hashedToken = this.hashToken(token);
        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: new Date() }
        });

        if (!user) {
            throw new Error('INVALID_RESET_TOKEN');
        }

        user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        user.refreshTokens = []; // Invalidate all sessions
        await user.save();

        return user;
    }

    static async changePassword(userId: string, data: any) {
        const { oldPassword, newPassword, refreshToken } = data;

        const user = await User.findById(userId);
        if (!user) throw new Error('USER_NOT_FOUND');

        const isValid = await bcrypt.compare(oldPassword, user.password);
        if (!isValid) throw new Error('INVALID_PASSWORD');

        user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);

        // Invalidate other sessions
        const currentHashedRefreshToken = refreshToken ? this.hashToken(refreshToken) : null;
        if (currentHashedRefreshToken) {
            user.refreshTokens = user.refreshTokens.filter((rt: any) => rt.token === currentHashedRefreshToken);
        } else {
            user.refreshTokens = [];
        }

        await user.save();
    }

    static async verifyEmail(token: string) {
        const hashedToken = this.hashToken(token);
        const user = await User.findOne({
            emailVerificationToken: hashedToken,
            emailVerificationExpires: { $gt: new Date() }
        });

        if (!user) throw new Error('INVALID_VERIFICATION_TOKEN');

        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();

        return user;
    }

    static async getUser(userId: string) {
        const user = await User.findById(userId).select('-password -refreshTokens -emailVerificationToken -passwordResetToken');
        if (!user) throw new Error('USER_NOT_FOUND');
        return user;
    }
}
