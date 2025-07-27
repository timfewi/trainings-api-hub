// packages/main-backend/src/middleware/auth.ts

import { Request, Response, NextFunction } from 'express';
import { ApiError } from './errorHandler';
import { verifyAccessToken, extractTokenFromHeader } from '../utils/jwt';
import { logger } from '../utils/logger';
import { prisma } from '../utils/database';

/**
 * Extended Request interface to include user information
 */
export interface AuthenticatedRequest extends Request {
  user?:
    | {
        id: string;
        email: string;
        username: string;
        firstName: string;
        lastName: string;
      }
    | undefined;
}

/**
 * Authentication middleware using JWT tokens
 */
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new ApiError('Authorization header required', 401);
    }

    // Extract and verify the JWT token
    const token = extractTokenFromHeader(authHeader);
    const payload = verifyAccessToken(token);

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      throw new ApiError('User not found', 401);
    }

    // Attach user info to request
    req.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      return next(error);
    }

    logger.error('Authentication error:', error);

    // Handle JWT specific errors
    if (error instanceof Error) {
      if (error.message.includes('jwt expired')) {
        return next(new ApiError('Token expired', 401));
      }
      if (error.message.includes('invalid token') || error.message.includes('jwt malformed')) {
        return next(new ApiError('Invalid token', 401));
      }
    }

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
