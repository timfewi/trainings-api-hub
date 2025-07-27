// packages/main-backend/src/middleware/auth.ts

import { Request, Response, NextFunction } from 'express';
import { ApiError } from './errorHandler';
import { verifyAccessToken, extractTokenFromHeader, validateAccessTokenStatus } from '../utils/jwt';
import { logger } from '../utils/logger';
import { prisma } from '../utils/database';
import { User } from '@trainings-api-hub/shared';

/**
 * Extended Request interface to include user information
 */
export interface AuthenticatedRequest extends Request {
  user?: User;
}

/**
 * Authentication middleware using JWT tokens
 */
export const authenticateToken = async (
  req: Request,
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

    // Get detailed token status for better error messages
    const tokenStatus = validateAccessTokenStatus(token);

    if (!tokenStatus.isValid) {
      if (tokenStatus.isExpired) {
        throw new ApiError('Token has expired', 401);
      }
      throw new ApiError(tokenStatus.error || 'Invalid token', 401);
    }

    const payload = tokenStatus.payload!;

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      throw new ApiError('User not found', 401);
    }

    // Attach user info to request (use type assertion to add user property)
    (req as AuthenticatedRequest).user = {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      githubId: user.githubId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      ...(user.avatarUrl && { avatarUrl: user.avatarUrl }),
      ...(user.githubUrl && { githubUrl: user.githubUrl }),
    };

    // Add token expiry warning headers for frontend
    if (tokenStatus.timeUntilExpiry && tokenStatus.timeUntilExpiry < 300) {
      // 5 minutes
      res.setHeader('X-Token-Expiry-Warning', 'true');
      res.setHeader('X-Token-Expires-In', tokenStatus.timeUntilExpiry.toString());

      if (tokenStatus.expiresAt) {
        res.setHeader('X-Token-Expires-At', tokenStatus.expiresAt.toISOString());
      }
    }

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
  req: Request,
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
  return (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.user) {
      return next(new ApiError('Authentication required', 401));
    }

    // TODO: Implement role checking when user roles are added to the schema
    // For now, allow all authenticated users
    next();
  };
};
