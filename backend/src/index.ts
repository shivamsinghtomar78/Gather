import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import authRoutes from './routes/auth';
import contentRoutes from './routes/content';
import brainRoutes from './routes/brain';
import searchRoutes from './routes/search';

dotenv.config();

const app = express();
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
        console.log(`📨 CORS check for origin: ${origin || 'NO ORIGIN (same-origin or tools)'}`);

        // Allow requests with no origin (same-origin, mobile apps, curl)
        if (!origin) {
            console.log('✅ Allowing no-origin request');
            return callback(null, true);
        }

        // Check exact match
        const isAllowed = allowedOrigins.some(ao => ao === origin);
        if (isAllowed) {
            console.log(`✅ Origin ${origin} is in allowed list`);
            return callback(null, true);
        }

        // Check Vercel pattern (*.vercel.app)
        if (origin.match(/^https:\/\/[\w-]+\.vercel\.app$/)) {
            console.log(`✅ Origin ${origin} matches Vercel pattern`);
            return callback(null, true);
        }

        // Block and log
        console.error(`❌ CORS BLOCKED: ${origin}`);
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 600 // Cache preflight for 10 minutes
}));

app.use(express.json());

// Request logging middleware - MUST be before routes
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log('═══════════════════════════════════════════════════════');
    console.log(`[${timestamp}] ${req.method} ${req.url}`);
    console.log('Full URL:', req.protocol + '://' + req.get('host') + req.originalUrl);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('Query:', JSON.stringify(req.query, null, 2));
    console.log('═══════════════════════════════════════════════════════');
    next();
});

// Routes
app.use('/api/v1', authRoutes);
app.use('/api/v1/content', contentRoutes);
app.use('/api/v1/brain', brainRoutes);
app.use('/api/v1/search', searchRoutes);

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

// 404 handler - MUST be after all routes
app.use((req, res) => {
    console.log('❌ 404 NOT FOUND:', req.method, req.url);
    console.log('Available routes:', [
        'GET /health',
        'GET /',
        'POST /api/v1/signup',
        'POST /api/v1/signin',
        'GET /api/v1/content',
        'POST /api/v1/content',
        'DELETE /api/v1/content',
        'POST /api/v1/brain/share',
        'GET /api/v1/brain/:shareLink'
    ]);
    res.status(404).json({
        error: 'Not Found',
        requestedUrl: req.url,
        method: req.method,
        message: 'The requested endpoint does not exist'
    });
});

// Connect to database and start server
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Gather API running on http://localhost:${PORT}`);
    });
}).catch((error) => {
    console.error('Failed to connect to database:', error);
    process.exit(1);
});

export default app;
