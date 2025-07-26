// packages/main-backend/src/middleware/auth.ts

import { Request, Response, NextFunction } from 'express';
import { ApiError } from './errorHandler';
import { logger } from '../utils/logger';
import { prisma } from '../utils/database';

/**
 * Extended Request interface to include user information
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
  };
}

/**
 * Authentication middleware - placeholder implementation
 * TODO: Replace with proper JWT authentication in Issue #3
 */
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // For now, we'll create a mock user for testing purposes
    // This allows us to test the Docker service without implementing full auth

    const authHeader = req.headers.authorization;

    if (!authHeader) {
      // For development/testing, create a mock user
      if (process.env.NODE_ENV === 'development') {
        logger.warn('No authorization header provided - using mock user for development');

        // Ensure the mock user exists in the database
        const mockUser = await prisma.user.upsert({
          where: { id: 'test-user-123' },
          update: {},
          create: {
            id: 'test-user-123',
            email: 'test@example.com',
            username: 'testuser',
            password: 'mock-password', // Not used in development
            firstName: 'Test',
            lastName: 'User',
          },
        });

        req.user = {
          id: mockUser.id,
          email: mockUser.email,
          username: mockUser.username,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
        };
        return next();
      }

      throw new ApiError('Authorization header required', 401);
    }

    // Basic token validation (placeholder)
    const token = authHeader.split(' ')[1]; // Bearer <token>

    if (!token) {
      throw new ApiError('Token not provided', 401);
    }

    // TODO: Implement proper JWT verification
    // For now, accept any token and create a mock user
    if (process.env.NODE_ENV === 'development') {
      logger.info(`Authentication token received: ${token.substring(0, 10)}...`);

      // Ensure the authenticated mock user exists in the database
      const mockUser = await prisma.user.upsert({
        where: { id: 'authenticated-user-456' },
        update: {},
        create: {
          id: 'authenticated-user-456',
          email: 'user@example.com',
          username: 'authenticateduser',
          password: 'mock-password', // Not used in development
          firstName: 'Authenticated',
          lastName: 'User',
        },
      });

      req.user = {
        id: mockUser.id,
        email: mockUser.email,
        username: mockUser.username,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
      };
      return next();
    }

    // In production, this should validate the JWT
    throw new ApiError('Invalid token', 401);
  } catch (error) {
    if (error instanceof ApiError) {
      return next(error);
    }

    logger.error('Authentication error:', error);
    return next(new ApiError('Authentication failed', 401));
  }
};

/**
 * Optional authentication middleware - allows both authenticated and unauthenticated requests
 */
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader) {
      // Try to authenticate, but don't fail if it doesn't work
      await authenticateToken(req, res, next);
    } else {
      // No auth header, continue without user
      next();
    }
  } catch (error) {
    // Continue without authentication
    next();
  }
};

/**
 * Role-based authorization middleware (placeholder for future use)
 */
export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError('Authentication required', 401));
    }

    // TODO: Implement role checking when user roles are added to the schema
    // For now, allow all authenticated users
    next();
  };
};
