import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User';

const router = Router();

// Validation schemas
const signupSchema = z.object({
    username: z.string()
        .min(3, 'Username must be at least 3 characters')
        .max(10, 'Username must be at most 10 characters'),
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

// POST /api/v1/signup
router.post('/signup', async (req: Request, res: Response): Promise<void> => {
    try {
        // Validate input
        const validation = signupSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(411).json({
                message: 'Error in inputs',
                errors: validation.error.errors
            });
            return;
        }

        const { username, email, password } = validation.data;

        // Check if user already exists by username
        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            res.status(403).json({ message: 'User already exists with this username' });
            return;
        }

        // Check if user already exists by email
        const existingEmail = await User.findOne({ email: email.toLowerCase() });
        if (existingEmail) {
            res.status(403).json({ message: 'User already exists with this email' });
            return;
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create user
        await User.create({
            username,
            email: email.toLowerCase(),
            password: hashedPassword
        });

        res.status(200).json({ message: 'Signed up successfully' });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/v1/signin
router.post('/signin', async (req: Request, res: Response): Promise<void> => {
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
            res.status(403).json({ message: 'Wrong email/password' });
            return;
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            res.status(403).json({ message: 'Wrong email/password' });
            return;
        }

        // Generate JWT token
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            res.status(500).json({ message: 'JWT secret not configured' });
            return;
        }

        const token = jwt.sign(
            { userId: user._id },
            jwtSecret,
            { expiresIn: '7d' }
        );

        res.status(200).json({ token });
    } catch (error) {
        console.error('Signin error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;
