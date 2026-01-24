import { z } from 'zod';

export const signupSchema = z.object({
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

export const signinSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string()
});

export const refreshSchema = z.object({
    refreshToken: z.string()
});

export const forgotPasswordSchema = z.object({
    email: z.string().email('Invalid email format')
});

export const resetPasswordSchema = z.object({
    token: z.string(),
    newPassword: z.string()
        .min(8, 'Password must be at least 8 characters')
        .max(20, 'Password must be at most 20 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character')
});

export const verifyEmailSchema = z.object({
    token: z.string()
});

export const changePasswordSchema = z.object({
    oldPassword: z.string(),
    newPassword: z.string()
        .min(8, 'Password must be at least 8 characters')
        .max(20, 'Password must be at most 20 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character')
});
