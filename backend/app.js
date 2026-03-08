const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

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

const app = express();
let dbInitPromise;
app.disable('x-powered-by');
app.set('trust proxy', 1);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication requests. Try again later.' }
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please slow down.' }
});

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400
}));

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

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

app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter, authRoutes);
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
    message: `Route ${req.originalUrl} not found`
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

  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
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
