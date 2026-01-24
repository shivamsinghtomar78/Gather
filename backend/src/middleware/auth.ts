import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger';

export interface AuthRequest extends Request {
    userId?: string;
}

interface JwtPayload {
    userId: string;
    type?: 'access' | 'refresh';
}

export const authMiddleware = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            res.status(401).json({ message: 'No token provided' });
            return;
        }

        // Support both "Bearer token" and legacy "token" format for backward compatibility
        let token: string;
        if (authHeader.startsWith('Bearer ')) {
            token = authHeader.slice(7);
        } else {
            // Legacy support - will be deprecated
            token = authHeader;
        }

        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            logger.error('❌ Auth Middleware: JWT secret not configured');
            res.status(500).json({ message: 'JWT secret not configured' });
            return;
        }

        const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
        logger.debug(`✅ Auth Middleware: Token verified for user ${decoded.userId}`);

        // Reject refresh tokens being used as access tokens
        if (decoded.type === 'refresh') {
            logger.warn('❌ Auth Middleware: Refresh token used as access token');
            res.status(401).json({ message: 'Invalid token type' });
            return;
        }

        req.userId = decoded.userId;
        next();
    } catch (error: any) {
        if (error.name === 'TokenExpiredError') {
            res.status(401).json({
                message: 'Token expired',
                code: 'TOKEN_EXPIRED'
            });
            return;
        }
        res.status(401).json({ message: 'Invalid or expired token' });
    }
};

