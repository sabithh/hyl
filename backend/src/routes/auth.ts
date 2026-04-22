import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authController } from '../controllers/auth';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  createGymOwnerSchema,
} from '../validators/auth';
import config from '../config';

const router = Router();

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.authMaxRequests,
  message: { success: false, message: 'Too many auth attempts, try again later' },
});

router.post('/create-gym-owner', authLimiter, validate(createGymOwnerSchema), authController.createGymOwner);
router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh', authLimiter, validate(refreshTokenSchema), authController.refresh);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.get('/profile', authenticate, authController.getProfile);
router.get('/me', authenticate, authController.getProfile);
router.put('/change-password', authenticate, validate(changePasswordSchema), authController.changePassword);

export default router;
