// packages/main-backend/src/config/passport.ts

import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';

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
}

/**
 * Configure GitHub OAuth strategy
 */
passport.use(
  new GitHubStrategy(
    {
      clientID: GITHUB_CLIENT_ID!,
      clientSecret: GITHUB_CLIENT_SECRET!,
      callbackURL: CALLBACK_URL,
      scope: ['user:email'], // Request access to user email
    },
    async (accessToken: string, refreshToken: string, profile: any, done: any) => {
      try {
        logger.info(`GitHub OAuth callback for user: ${profile.username}`);

        // Extract user information from GitHub profile
        const githubId = profile.id;
        const username = profile.username;
        const email = profile.emails?.[0]?.value || `${username}@github.local`;
        const firstName = profile.displayName?.split(' ')[0] || username;
        const lastName = profile.displayName?.split(' ').slice(1).join(' ') || '';
        const avatarUrl = profile.photos?.[0]?.value;
        const githubUrl = profile.profileUrl;

        // Check if user already exists by githubId
        // Using findFirst as a workaround for TypeScript issues
        let user = await prisma.user.findFirst({
          where: { githubId: githubId } as any,
        });

        if (user) {
          // Update existing user with latest GitHub info
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              email,
              username,
              firstName,
              lastName,
              avatarUrl,
              githubUrl,
              updatedAt: new Date(),
            } as any,
          });
          logger.info(`Updated existing user: ${user.id}`);
        } else {
          // Create new user
          try {
            user = await prisma.user.create({
              data: {
                githubId,
                email,
                username,
                firstName,
                lastName,
                avatarUrl,
                githubUrl,
              } as any,
            });
            logger.info(`Created new user: ${user.id}`);
          } catch (error: any) {
            // Handle unique constraint violations (username or email already exists)
            if (error.code === 'P2002') {
              const field = error.meta?.target?.[0];
              if (field === 'username') {
                // Try with a modified username
                const modifiedUsername = `${username}_${Math.random().toString(36).substring(7)}`;
                user = await prisma.user.create({
                  data: {
                    githubId,
                    email,
                    username: modifiedUsername,
                    firstName,
                    lastName,
                    avatarUrl,
                    githubUrl,
                  } as any,
                });
                logger.info(`Created new user with modified username: ${user.id}`);
              } else if (field === 'email') {
                // Use GitHub ID based email if email already exists
                const modifiedEmail = `${githubId}@github.trainings-api-hub.local`;
                user = await prisma.user.create({
                  data: {
                    githubId,
                    email: modifiedEmail,
                    username,
                    firstName,
                    lastName,
                    avatarUrl,
                    githubUrl,
                  } as any,
                });
                logger.info(`Created new user with modified email: ${user.id}`);
              } else {
                throw error;
              }
            } else {
              throw error;
            }
          }
        }

        return done(null, user);
      } catch (error) {
        logger.error('GitHub OAuth strategy error:', error);
        return done(error, null);
      }
    }
  )
);

/**
 * Serialize user for session
 */
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

/**
 * Deserialize user from session
 */
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
