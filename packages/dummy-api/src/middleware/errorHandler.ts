// packages/dummy-api/src/middleware/errorHandler.ts

import { Request, Response, NextFunction } from 'express';

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Global error handling middleware
 */
export function errorHandler(error: Error, req: Request, res: Response, next: NextFunction): void {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let code = 'INTERNAL_ERROR';

  if (error instanceof ApiError) {
    statusCode = error.statusCode;
    message = error.message;
    code = error.code ?? 'API_ERROR';
  } else if (error.name === 'ValidationError') {
    statusCode = 400;
    message = error.message;
    code = 'VALIDATION_ERROR';
  }

  console.error('Error:', {
    statusCode,
    message,
    code,
    stack: error.stack,
    url: req.url,
    method: req.method,
  });

  res.status(statusCode).json({
    success: false,
    error: message,
    code,
    timestamp: new Date().toISOString(),
  });
}
