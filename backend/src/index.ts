import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { connectDB } from './config/db';
import authRoutes from './routes/auth';
import contentRoutes from './routes/content';
import brainRoutes from './routes/brain';
import profileRoutes from './routes/profile';
import logger from './utils/logger';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Critical Environment Check
if (!process.env.JWT_SECRET) {
    logger.error('CRITICAL: JWT_SECRET environment variable is not defined!');
    process.exit(1);
}

const io = new Server(httpServer, {
    cors: {
        origin: "*", // In production this should be restricted
        methods: ["GET", "POST"]
    }
});

// Attach io to app for use in routes
app.set('io', io);

const PORT = process.env.PORT || 3000;

// Trust proxy for Render/Cloudflare
app.set('trust proxy', 1);

// Middleware
// Enhanced CORS configuration with dynamic origin support
const allowedOrigins = [
    'https://gather-ochre.vercel.app',
    'https://gather-zxaa.onrender.com',
    'http://localhost:3000',
    'http://localhost:3001'
];

app.use(cors({
    origin: (origin, callback) => {
        // Log all CORS requests for debugging
        logger.debug(`📨 CORS check for origin: ${origin || 'NO ORIGIN (same-origin or tools)'}`);

        // Allow requests with no origin (same-origin, mobile apps, curl)
        if (!origin) {
            logger.debug('✅ Allowing no-origin request');
            return callback(null, true);
        }

        // Check exact match
        const isAllowed = allowedOrigins.some(ao => ao === origin);
        if (isAllowed) {
            logger.debug(`✅ Origin ${origin} is in allowed list`);
            return callback(null, true);
        }

        // Check Vercel pattern (*.vercel.app)
        if (origin.match(/^https:\/\/[\w-]+\.vercel\.app$/)) {
            logger.debug(`✅ Origin ${origin} matches Vercel pattern`);
            return callback(null, true);
        }

        // Block and log
        logger.warn(`❌ CORS BLOCKED: ${origin}`);
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 600 // Cache preflight for 10 minutes
}));

app.use(express.json({ limit: '10mb' }));

// Request logging middleware - MUST be before routes
app.use((req, res, next) => {
    // Helper to redact sensitive info
    const redact = (obj: any): any => {
        if (!obj || typeof obj !== 'object') return obj;
        const sensitiveKeys = ['password', 'token', 'refreshToken', 'accessToken', 'currentPassword', 'newPassword'];
        const redacted = { ...obj };
        for (const key of Object.keys(redacted)) {
            if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
                redacted[key] = '[REDACTED]';
            } else if (typeof redacted[key] === 'object') {
                redacted[key] = redact(redacted[key]);
            }
        }
        return redacted;
    };

    logger.http(`[${req.method}] ${req.url}`);
    logger.debug(`Full URL: ${req.protocol}://${req.get('host')}${req.originalUrl}`);

    // Redact headers and body
    const safeHeaders = redact(req.headers);
    const safeBody = redact(req.body);
    const safeQuery = redact(req.query);

    logger.debug(`Headers: ${JSON.stringify(safeHeaders)}`);
    logger.debug(`Body: ${JSON.stringify(safeBody)}`);
    logger.debug(`Query: ${JSON.stringify(safeQuery)}`);
    next();
});

// Routes
app.use('/api/v1', authRoutes);
app.use('/api/v1/content', contentRoutes);
app.use('/api/v1/brain', brainRoutes);
app.use('/api/v1/profile', profileRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Gather API is running' });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Gather API is running',
        endpoints: {
            health: '/health',
            signup: '/api/v1/signup',
            signin: '/api/v1/signin',
            content: '/api/v1/content',
            brain: '/api/v1/brain'
        }
    });
});

import { errorHandler } from './middleware/error';
import { AppError } from './utils/AppError';

// ... (keep imports)

// ... (after routes)

// 404 handler
app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use(errorHandler);

// Connect to database ...

// Connect to database and start server
connectDB().then(() => {
    httpServer.listen(PORT, () => {
        logger.info(`🚀 Gather API running on http://localhost:${PORT}`);
        logger.info(`📡 Real-time Socket.io server ready`);
    });
}).catch((error) => {
    logger.error(`Failed to connect to database: ${error}`);
    process.exit(1);
});

export default app;
