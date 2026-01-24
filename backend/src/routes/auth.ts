import { Router } from 'express';
import { signinLimiter, signupLimiter, passwordResetLimiter } from '../middleware/rateLimiter';
import { authMiddleware } from '../middleware/auth';
import { AuthController } from '../controllers/authController';

const router = Router();

// Auth Routes
router.post('/signup', signupLimiter, AuthController.signup);
router.post('/signin', signinLimiter, AuthController.signin);
router.post('/refresh', AuthController.refresh);
router.post('/logout', authMiddleware, AuthController.logout);
router.post('/logout-all', authMiddleware, AuthController.logoutAll);

// Password Management
router.post('/forgot-password', passwordResetLimiter, AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);
router.post('/change-password', authMiddleware, AuthController.changePassword);

// Email Verification
router.post('/verify-email', AuthController.verifyEmail);
// router.post('/resend-verification', AuthController.resendVerification); // TODO: Implement if needed

// User Routes
router.get('/me', authMiddleware, AuthController.getMe);

export default router;
