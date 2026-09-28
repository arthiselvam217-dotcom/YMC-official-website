const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config();

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB Atlas (via MONGO_URI in .env)
connectDB();

// Core Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static uploads directory (for media / file uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'YMC Website Backend API',
    club: 'YMC (Youth Media Club / YMC GCT)',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API Root summary
app.get('/api', (req, res) => {
  res.status(200).json({
    message: 'Welcome to the YMC Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      members: '/api/members',
      bloodshare: '/api/bloodshare',
      events: '/api/events',
      library: '/api/library',
      media: '/api/media',
      contact: '/api/contact',
    },
  });
});

// API Routes (Phase 1: Auth routes; Phase 2 will mount remaining core routes)
app.use('/api/auth', authRoutes);

// 404 handler for unknown routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Centralized error handler
app.use(errorHandler);

// Start server only when run directly (not when required as a module in tests)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(
      '\x1b[36m%s\x1b[0m',
      `🚀 [YMC Backend Server] running on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode`
    );
  });
}

module.exports = app;
