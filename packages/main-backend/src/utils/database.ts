// packages/main-backend/src/utils/database.ts

import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

/**
 * Prisma client instance for database operations
 */
export const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'event',
      level: 'info',
    },
    {
      emit: 'event',
      level: 'warn',
    },
  ],
});

// Log database queries in development
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', e => {
    logger.debug('Query:', e.query);
    logger.debug('Params:', e.params);
    logger.debug('Duration:', `${e.duration}ms`);
  });
}

prisma.$on('error', e => {
  logger.error('Database error:', e);
});

prisma.$on('info', e => {
  logger.info('Database info:', e);
});

prisma.$on('warn', e => {
  logger.warn('Database warning:', e);
});
