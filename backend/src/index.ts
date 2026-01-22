import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import authRoutes from './routes/auth';
import contentRoutes from './routes/content';
import brainRoutes from './routes/brain';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/v1', authRoutes);
app.use('/api/v1/content', contentRoutes);
app.use('/api/v1/brain', brainRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Gather API is running' });
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
