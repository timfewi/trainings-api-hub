// packages/main-backend/src/config/passport.ts

import passport from 'passport';
import { Strategy as GitHubStrategy, Profile as GitHubProfile } from 'passport-github2';
import { VerifyCallback } from 'passport-oauth2';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import { User } from '@trainings-api-hub/shared';
import { randomUUID } from 'crypto';

/**
 * GitHub profile data interface
 */
interface GitHubProfileData {
  githubId: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null | undefined;
  githubUrl?: string | null | undefined;
}

/**
 * User creation data interface (excluding auto-generated fields)
 */
interface CreateUserData {
  githubId: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null | undefined;
  githubUrl?: string | null | undefined;
}

/**
 * User update data interface
 */
interface UpdateUserData {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null | undefined;
  githubUrl?: string | null | undefined;
  updatedAt: Date;
}

/**
 * Convert Prisma User to shared User type
 */
import type { User as PrismaUser } from '@prisma/client';
import { map } from 'rxjs';

function convertToUser(prismaUser: PrismaUser): User {
  const user: User = {
    id: prismaUser.id,
    email: prismaUser.email,
    username: prismaUser.username,
    firstName: prismaUser.firstName,
    lastName: prismaUser.lastName,
    githubId: prismaUser.githubId,
    createdAt: prismaUser.createdAt,
    updatedAt: prismaUser.updatedAt,
  };

  // Handle optional fields with proper type conversion
  if (prismaUser.avatarUrl) {
    user.avatarUrl = prismaUser.avatarUrl;
  }

  if (prismaUser.githubUrl) {
    user.githubUrl = prismaUser.githubUrl;
  }

  return user;
}

/**
 * Extract and validate user data from GitHub profile
 */
function extractGitHubProfileData(profile: GitHubProfile): GitHubProfileData {
  const githubId = profile.id;
  const username = profile.username || 'unknown';
  const email = profile.emails?.[0]?.value || `${username}@github.local`;
  const displayNameParts = profile.displayName?.split(' ') || [username];
  const firstName = displayNameParts[0] || username;
  const lastName = displayNameParts.slice(1).join(' ') || '';
  const avatarUrl = profile.photos?.[0]?.value || null;
  const githubUrl = profile.profileUrl || null;

  return {
    githubId,
    username,
    email,
    firstName,
    lastName,
    avatarUrl,
    githubUrl,
  };
}

/**
 * Find user by GitHub ID
 */
async function findUserByGitHubId(githubId: string): Promise<User | null> {
  try {
    const prismaUser = await prisma.user.findUnique({
      where: { githubId },
    });

    return prismaUser ? convertToUser(prismaUser) : null;
  } catch (error) {
    logger.error('Error finding user by GitHub ID:', error);
    throw new Error('Database query failed');
  }
}

/**
 * Update existing user with GitHub data
 */
async function updateExistingUser(userId: string, userData: UpdateUserData): Promise<User> {
  try {
    const updatePayload = {
      email: userData.email,
      username: userData.username,
      firstName: userData.firstName,
      lastName: userData.lastName,
      avatarUrl: userData.avatarUrl ?? null,
      githubUrl: userData.githubUrl ?? null,
      updatedAt: userData.updatedAt,
    };

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updatePayload,
    });

    return convertToUser(updatedUser);
  } catch (error) {
    logger.error('Error updating user:', error);
    throw new Error('Failed to update user');
  }
}

/**
 * Create new user with conflict resolution
 */
async function createNewUser(userData: CreateUserData): Promise<User> {
  const createPayload = {
    githubId: userData.githubId,
    email: userData.email,
    username: userData.username,
    firstName: userData.firstName,
    lastName: userData.lastName,
    avatarUrl: userData.avatarUrl ?? null,
    githubUrl: userData.githubUrl ?? null,
  };

  try {
    const newUser = await prisma.user.create({
      data: createPayload,
    });

    return convertToUser(newUser);
  } catch (error: unknown) {
    // Handle unique constraint violations
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === 'P2002'
    ) {
      const conflictField = (error as { meta?: { target?: string[] } }).meta?.target?.[0];

      if (conflictField === 'username') {
        const existingUsernames = await prisma.user.findMany({
          where: {
            username: {
              startsWith: `${userData.username}_`,
            },
          },
          select: {
            username: true,
          },
        });

        // Extract numeric counters from usernames
        const counters = existingUsernames
          .map(user => {
            const match = user.username.match(/_(\d+)$/);
            return match && match[1] ? parseInt(match[1], 10) : 0;
          })
          .filter(counter => !isNaN(counter));

        // Determine the next available counter
        const maxCounter = counters.length > 0 ? Math.max(...counters) : 0;
        const modifiedUsername = `${userData.username}_${maxCounter + 1}`;

        logger.info(`Username conflict resolved with: ${modifiedUsername}`);

        const newUser = await prisma.user.create({
          data: { ...createPayload, username: modifiedUsername },
        });

        return convertToUser(newUser);
      }

      if (conflictField === 'email') {
        const modifiedEmail = `${userData.githubId}@github.trainings-api-hub.local`;
        logger.info(`Email conflict resolved with: ${modifiedEmail}`);

        const newUser = await prisma.user.create({
          data: { ...createPayload, email: modifiedEmail },
        });

        return convertToUser(newUser);
      }
    }

    logger.error('Error creating user:', error);
    throw new Error('Failed to create user');
  }
}

/**
 * Handle GitHub OAuth user creation or update
 */
async function handleGitHubUser(profileData: GitHubProfileData): Promise<User> {
  const existingUser = await findUserByGitHubId(profileData.githubId);

  if (existingUser) {
    logger.info(`Updating existing user: ${existingUser.id}`);

    const updateData: UpdateUserData = {
      email: profileData.email,
      username: profileData.username,
      firstName: profileData.firstName,
      lastName: profileData.lastName,
      avatarUrl: profileData.avatarUrl,
      githubUrl: profileData.githubUrl,
      updatedAt: new Date(),
    };

    return await updateExistingUser(existingUser.id, updateData);
  } else {
    logger.info(`Creating new user for GitHub ID: ${profileData.githubId}`);

    const createData: CreateUserData = {
      githubId: profileData.githubId,
      email: profileData.email,
      username: profileData.username,
      firstName: profileData.firstName,
      lastName: profileData.lastName,
      avatarUrl: profileData.avatarUrl,
      githubUrl: profileData.githubUrl,
    };

    return await createNewUser(createData);
  }
}

/**
 * GitHub OAuth configuration
 */
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const CALLBACK_URL =
  process.env.GITHUB_CALLBACK_URL || 'http://localhost:3000/api/auth/github/callback';

if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
  logger.error(
    'GitHub OAuth credentials not configured. Please set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET environment variables.'
  );
  // Throw error to allow application-level error handling
  throw new Error(
    'GitHub OAuth credentials not configured. Please set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET environment variables.'
  );
}

/**
 * Configure GitHub OAuth strategy with type safety
 */
passport.use(
  new GitHubStrategy(
    {
      clientID: GITHUB_CLIENT_ID!,
      clientSecret: GITHUB_CLIENT_SECRET!,
      callbackURL: CALLBACK_URL,
      scope: ['user:email'], // Request access to user email
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: GitHubProfile,
      done: VerifyCallback
    ) => {
      try {
        logger.info(`GitHub OAuth callback for user: ${profile.username}`);

        // Extract and validate profile data
        const profileData = extractGitHubProfileData(profile);

        // Handle user creation or update
        const user = await handleGitHubUser(profileData);

        logger.info(`OAuth successful for user ID: ${user.id}`);
        return done(null, user);
      } catch (error) {
        logger.error('GitHub OAuth strategy error:', error);
        return done(error, false);
      }
    }
  )
);

/**
 * Serialize user for session storage
 */
passport.serializeUser((user: Express.User, done) => {
  const typedUser = user as User;
  done(null, typedUser.id);
});

/**
 * Deserialize user from session storage
 */
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (user) {
      done(null, convertToUser(user));
    } else {
      done(new Error('User not found'), false);
    }
  } catch (error) {
    logger.error('Error deserializing user:', error);
    done(error, false);
  }
});

export default passport;
