import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import config from './config';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

// Route imports
import authRoutes from './routes/auth';
import gymRoutes from './routes/gym';
import memberRoutes from './routes/members';
import planRoutes from './routes/plans';
import subscriptionRoutes from './routes/subscriptions';
import paymentRoutes from './routes/payments';
import attendanceRoutes from './routes/attendance';
import exerciseRoutes from './routes/exercises';
import workoutRoutes from './routes/workouts';
import dietPlanRoutes from './routes/dietPlans';
import notificationRoutes from './routes/notifications';
import announcementRoutes from './routes/announcements';
import referralRoutes from './routes/referrals';
import nutritionRoutes from './routes/nutrition';
import progressRoutes from './routes/progress';
import chatRoutes from './routes/chat';
import analyticsRoutes from './routes/analytics';
import marketingRoutes from './routes/marketing';
import trainerRoutes from './routes/trainers';
import sessionRoutes from './routes/sessions';
import classRoutes from './routes/classes';
import feedbackRoutes from './routes/feedback';
import biRoutes from './routes/bi';

const app = express();

// Trust the proxy (Render) so rate limiting works correctly
app.set('trust proxy', 1);

// ==========================================
// Global Middleware
// ==========================================

// Security headers
app.use(helmet());

// CORS
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

// General rate limiter
app.use(rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: { success: false, message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
}));

// ==========================================
// Health Check
// ==========================================

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Gym Platform API is running',
    timestamp: new Date().toISOString(),
    environment: config.env,
  });
});

// ==========================================
// API Routes
// ==========================================

app.use('/api/auth', authRoutes);
app.use('/api/gym', gymRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/workout-plans', workoutRoutes);
app.use('/api/diet-plans', dietPlanRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/marketing', marketingRoutes);
app.use('/api/trainers', trainerRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/bi', biRoutes);

// ==========================================
// Error Handling
// ==========================================

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
