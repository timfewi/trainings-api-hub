// packages/main-backend/src/index.ts

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import dotenv from 'dotenv';
import passport from './config/passport';
import { authRoutes } from './routes/authRoutes';
import { instanceRoutes } from './routes/instanceRoutes';
import { userRoutes } from './routes/userRoutes';
import { errorHandler } from './middleware/errorHandler';
import { authenticateToken } from './middleware/auth';
import { logger } from './utils/logger';
import { prisma } from './utils/database';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT ?? 3000;
const API_VERSION = 'v1';

/**
 * Initialize the main backend API server
 */
async function startServer(): Promise<void> {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(
    cors({
      origin: process.env.FRONTEND_URL ?? 'http://localhost:4200',
      credentials: true,
    })
  );

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
  });
  app.use(limiter);

  // Logging middleware
  app.use(
    morgan('combined', {
      stream: { write: (message: string) => logger.info(message.trim()) },
    })
  );

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Session middleware for passport
  const sessionSecret = process.env.SESSION_SECRET;
  if (process.env.NODE_ENV === 'production' && !sessionSecret) {
    throw new Error('SESSION_SECRET must be set in production environment for security reasons.');
  }
  app.use(
    session({
      secret: sessionSecret || 'your-session-secret-change-in-production',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    })
  );

  // Passport middleware
  app.use(passport.initialize());
  app.use(passport.session());

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      version: API_VERSION,
      services: {
        database: 'connected',
        docker: 'available',
      },
    });
  });

  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/instances', authenticateToken as express.RequestHandler, instanceRoutes);
  app.use('/api/user', authenticateToken as express.RequestHandler, userRoutes);

  // Error handling
  app.use(errorHandler);

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      error: 'Endpoint not found',
      timestamp: new Date().toISOString(),
    });
  });

  // Test database connection
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error('Database connection failed:', error);
    process.exit(1);
  }

  app.listen(PORT, () => {
    logger.info(`🚀 Main backend server running on port ${PORT}`);
    logger.info(`📖 Health check: http://localhost:${PORT}/health`);
    logger.info(`🔐 GitHub OAuth: http://localhost:${PORT}/api/auth/github`);
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    logger.info('Shutting down gracefully...');
    await prisma.$disconnect();
    process.exit(0);
  });
}

// Start the server
startServer().catch(error => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});
