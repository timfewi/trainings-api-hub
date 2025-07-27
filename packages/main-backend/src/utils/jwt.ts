// packages/main-backend/src/utils/jwt.ts

import jwt from 'jsonwebtoken';
import { logger } from './logger';

/**
 * JWT token payload interface
 */
export interface JwtPayload {
  userId: string;
  email: string;
  username: string;
  iat?: number;
  exp?: number;
}

/**
 * Token pair interface
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * JWT configuration
 */
const isProduction = process.env.NODE_ENV === 'production';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-development';
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ||
  (process.env.NODE_ENV === 'production'
    ? (() => {
        throw new Error('JWT_REFRESH_SECRET must be set in production environment');
      })()
    : 'your-refresh-secret-key-change-in-development');

const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 days

if (isProduction && !process.env.JWT_REFRESH_SECRET) {
  throw new Error('JWT_REFRESH_SECRET environment variable must be set in production');
}

/**
 * Generate access token
 */
export function generateAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  try {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRY,
      issuer: 'trainings-api-hub',
      audience: 'trainings-api-hub-users',
    });
  } catch (error) {
    logger.error('Failed to generate access token:', error);
    throw new Error('Token generation failed');
  }
}

/**
 * Generate refresh token
 */
export function generateRefreshToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  try {
    return jwt.sign(payload, JWT_REFRESH_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRY,
      issuer: 'trainings-api-hub',
      audience: 'trainings-api-hub-users',
    });
  } catch (error) {
    logger.error('Failed to generate refresh token:', error);
    throw new Error('Refresh token generation failed');
  }
}

/**
 * Generate token pair
 */
export function generateTokenPair(payload: Omit<JwtPayload, 'iat' | 'exp'>): TokenPair {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  return {
    accessToken,
    refreshToken,
    expiresIn: 15 * 60, // 15 minutes in seconds
  };
}

/**
 * Verify access token
 */
export function verifyAccessToken(token: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'trainings-api-hub',
      audience: 'trainings-api-hub-users',
    }) as JwtPayload;

    return decoded;
  } catch (error) {
    logger.error('Access token verification failed:', error);
    throw new Error('Invalid access token');
  }
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: 'trainings-api-hub',
      audience: 'trainings-api-hub-users',
    }) as JwtPayload;

    return decoded;
  } catch (error) {
    logger.error('Refresh token verification failed:', error);
    throw new Error('Invalid refresh token');
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string): string {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Invalid authorization header format');
  }

  return authHeader.substring(7); // Remove 'Bearer ' prefix
}

/**
 * Check if token is expired (without verifying signature)
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as JwtPayload;
    if (!decoded || !decoded.exp) {
      return true;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    return true;
  }
}
