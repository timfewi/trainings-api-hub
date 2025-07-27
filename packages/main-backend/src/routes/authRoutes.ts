// packages/main-backend/src/routes/authRoutes.ts

import { Router, Request, Response } from 'express';
import passport from '../config/passport';
import { asyncHandler, ApiError } from '../middleware/errorHandler';
import { generateTokenPair, verifyRefreshToken, verifyAccessToken } from '../utils/jwt';
import { logger } from '../utils/logger';
import { prisma } from '../utils/database';

const router = Router();

/**
 * GET /api/auth/github - Initiate GitHub OAuth
 */
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

/**
 * GET /api/auth/github/callback - GitHub OAuth callback
 */
router.get(
  '/github/callback',
  passport.authenticate('github', { failureRedirect: '/login?error=oauth_failed' }),
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as any;

    if (!user) {
      throw new ApiError('Authentication failed', 401);
    }

    logger.info(`GitHub OAuth successful for user: ${user.username}`);

    // Generate JWT tokens
    const tokens = generateTokenPair({
      userId: user.id,
      email: user.email,
      username: user.username,
    });

    // Save refresh token to database
    await prisma.userSession.create({
      data: {
        userId: user.id,
        refreshToken: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Redirect to frontend with tokens
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    const redirectUrl = `${frontendUrl}/auth/callback?token=${tokens.accessToken}&refresh=${tokens.refreshToken}`;

    res.redirect(redirectUrl);
  })
);

/**
 * GET /api/auth/me - Get current user profile
 */
router.get(
  '/me',
  asyncHandler(async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError('Authorization token required', 401);
    }

    const token = authHeader.substring(7);

    try {
      const payload = verifyAccessToken(token);
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      });

      if (!user) {
        throw new ApiError('User not found', 404);
      }

      res.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          githubId: user.githubId,
          avatarUrl: user.avatarUrl,
          githubUrl: user.githubUrl,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      throw new ApiError('Invalid token', 401);
    }
  })
);

/**
 * POST /api/auth/refresh - Refresh access token
 */
router.post(
  '/refresh',
  asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new ApiError('Refresh token required', 400);
    }

    try {
      // Verify refresh token
      const payload = verifyRefreshToken(refreshToken);

      // Check if refresh token exists in database and is not expired
      const session = await prisma.userSession.findUnique({
        where: { refreshToken },
        include: { user: true },
      });

      if (!session || session.expiresAt < new Date()) {
        throw new ApiError('Invalid or expired refresh token', 401);
      }

      // Generate new tokens
      const newTokens = generateTokenPair({
        userId: session.user.id,
        email: session.user.email,
        username: session.user.username,
      });

      // Update session with new refresh token
      await prisma.userSession.update({
        where: { id: session.id },
        data: {
          refreshToken: newTokens.refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      res.json({
        success: true,
        data: {
          accessToken: newTokens.accessToken,
          refreshToken: newTokens.refreshToken,
          expiresIn: newTokens.expiresIn,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Token refresh failed:', error);
      throw new ApiError('Invalid refresh token', 401);
    }
  })
);

/**
 * POST /api/auth/logout - User logout
 */
router.post(
  '/logout',
  asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Remove refresh token from database
      try {
        await prisma.userSession.delete({
          where: { refreshToken },
        });
        logger.info('User session invalidated');
      } catch (error) {
        logger.warn('Failed to invalidate session:', error);
      }
    }

    res.json({
      success: true,
      message: 'Logout successful',
      timestamp: new Date().toISOString(),
    });
  })
);

export { router as authRoutes };
