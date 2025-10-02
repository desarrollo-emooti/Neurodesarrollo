import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  code?: string;
  details?: any;
}

export class CustomError extends Error implements AppError {
  public statusCode: number;
  public isOperational: boolean;
  public code: string;
  public details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true,
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let { statusCode = 500, message, code = 'INTERNAL_ERROR', details } = error;

  // Log error
  logger.error('Error occurred:', {
    error: {
      message,
      statusCode,
      code,
      details,
      stack: error.stack,
    },
    request: {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
      params: req.params,
      query: req.query,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    },
  });

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
    details = error.details || { message: error.message };
  } else if (error.name === 'CastError') {
    statusCode = 400;
    code = 'INVALID_ID';
    message = 'Invalid ID format';
  } else if (error.name === 'MongoError' && (error as any).code === 11000) {
    statusCode = 409;
    code = 'DUPLICATE_KEY';
    message = 'Duplicate field value';
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'INVALID_TOKEN';
    message = 'Invalid token';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Token expired';
  } else if (error.name === 'MulterError') {
    statusCode = 400;
    code = 'FILE_UPLOAD_ERROR';
    message = 'File upload error';
  }

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production' && !error.isOperational) {
    message = 'Something went wrong';
    details = undefined;
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new CustomError(
    `Route ${req.originalUrl} not found`,
    404,
    'NOT_FOUND'
  );
  next(error);
};

// Validation error handler
export const validationErrorHandler = (message: string, details?: any) => {
  return new CustomError(message, 400, 'VALIDATION_ERROR', true, details);
};

// Authentication error handler
export const authErrorHandler = (message: string = 'Authentication required') => {
  return new CustomError(message, 401, 'AUTHENTICATION_ERROR');
};

// Authorization error handler
export const authorizationErrorHandler = (message: string = 'Insufficient permissions') => {
  return new CustomError(message, 403, 'AUTHORIZATION_ERROR');
};

// Not found error handler
export const notFoundErrorHandler = (resource: string = 'Resource') => {
  return new CustomError(`${resource} not found`, 404, 'NOT_FOUND');
};

// Conflict error handler
export const conflictErrorHandler = (message: string) => {
  return new CustomError(message, 409, 'CONFLICT');
};

// Rate limit error handler
export const rateLimitErrorHandler = (message: string = 'Too many requests') => {
  return new CustomError(message, 429, 'RATE_LIMIT_EXCEEDED');
};

// Server error handler
export const serverErrorHandler = (message: string = 'Internal server error') => {
  return new CustomError(message, 500, 'INTERNAL_ERROR');
};
