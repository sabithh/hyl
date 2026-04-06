import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import logger from '../config/logger';

export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    logger.warn(`${err.statusCode} - ${err.message} - ${req.method} ${req.originalUrl}`);
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Prisma known errors
  if (err.name === 'PrismaClientKnownRequestError') {
    logger.error(`Prisma error: ${err.message}`);
    return res.status(400).json({
      success: false,
      message: 'Database operation failed',
    });
  }

  // Unexpected errors
  logger.error(`Unexpected error: ${err.message}`, { stack: err.stack });
  return res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};
