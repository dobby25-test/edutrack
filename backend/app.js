const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const helmet = require('helmet');

require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const { sequelize, testConnection } = require('./config/database');
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/project');
const bulkRoutes = require('./routes/bulks');
const profileRoutes = require('./routes/profile');
const badgeRoutes = require('./routes/badges');
const analyticsRoutes = require('./routes/analytics');
const leaderboardRoutes = require('./routes/leaderboard');
const notificationRoutes = require('./routes/notification');
const { apiLimiter } = require('./middleware/rateLimiter');

const app = express();
let dbInitPromise;
app.disable('x-powered-by');
app.set('trust proxy', 1);

const allowedOrigins = (process.env.CLIENT_URL || 'https://edutrack-frontend-tan.vercel.app,http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    // ? SECURITY FIX: Enforce HTTPS behind proxy/load balancer in production.
    if (req.header('x-forwarded-proto') !== 'https') {
      return res.redirect(`https://${req.header('host')}${req.url}`);
    }
    return next();
  });
}

app.use(helmet({
  // ? SECURITY FIX: Harden default security headers.
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https://edutrack-steel.vercel.app']
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  frameguard: {
    action: 'deny'
  },
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

app.use(cors({
  // ? SECURITY FIX: Restrict CORS to explicit trusted frontends only.
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600
}));

app.use(express.json({ limit: '8mb' }));
app.use(express.urlencoded({ extended: true, limit: '8mb' }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'EduTrack API is running',
    timestamp: new Date(),
    environment: process.env.NODE_ENV
  });
});

// ? SECURITY FIX: General API rate limiter.
app.use('/api', apiLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/bulk', bulkRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/badges', badgeRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/notifications', notificationRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Resource not found'
  });
});

app.use((err, _req, res, _next) => {
  if (err?.message?.startsWith('CORS blocked for origin')) {
    return res.status(403).json({
      success: false,
      message: 'Origin is not allowed'
    });
  }

  if (err?.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      message: 'Request payload too large. Please upload an image smaller than 5MB.'
    });
  }

  console.error('Unhandled error:', err);
  // ? SECURITY FIX: Never expose stack traces or internal error messages to clients.
  return res.status(500).json({
    success: false,
    message: 'An error occurred. Please try again later.'
  });
});

const ensureDatabaseReady = async () => {
  if (!dbInitPromise) {
    dbInitPromise = (async () => {
      await testConnection();

      const shouldAlter = process.env.DB_SYNC_ALTER === 'true';
      const shouldSync = shouldAlter || process.env.DB_SYNC === 'true' || process.env.NODE_ENV !== 'production';

      if (shouldSync) {
        await sequelize.sync(shouldAlter ? { alter: true } : undefined);
        console.log('Database synced');
      } else {
        console.log('Database sync skipped');
      }
    })();
  }

  try {
    await dbInitPromise;
  } catch (error) {
    dbInitPromise = null;
    throw error;
  }
};

module.exports = { app, ensureDatabaseReady };

