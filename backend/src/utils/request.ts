import { Request } from 'express';
import { JwtPayload } from '../middleware/auth';
import { BadRequestError, UnauthorizedError } from './errors';

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export const getAuthUser = (req: Request): JwtPayload => {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  return req.user;
};

export const getPagination = (
  req: Request,
  defaults: { page?: number; limit?: number; maxLimit?: number } = {}
): PaginationParams => {
  const page = Number(req.query.page ?? defaults.page ?? 1);
  const limit = Number(req.query.limit ?? defaults.limit ?? 20);
  const maxLimit = defaults.maxLimit ?? 100;

  if (Number.isNaN(page) || page < 1) {
    throw new BadRequestError('page must be a positive number');
  }

  if (Number.isNaN(limit) || limit < 1) {
    throw new BadRequestError('limit must be a positive number');
  }

  const safeLimit = Math.min(limit, maxLimit);

  return {
    page,
    limit: safeLimit,
    skip: (page - 1) * safeLimit,
  };
};

export const parseDateOrThrow = (value: unknown, fieldName: string): Date => {
  if (typeof value !== 'string' || !value.trim()) {
    throw new BadRequestError(`${fieldName} is required`);
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestError(`${fieldName} must be a valid date string`);
  }

  return parsed;
};

export const optionalDate = (value: unknown, fieldName: string): Date | undefined => {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }

  return parseDateOrThrow(value, fieldName);
};

export const parseNumber = (value: unknown, fieldName: string): number => {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new BadRequestError(`${fieldName} must be a valid number`);
  }

  return parsed;
};

export const parseOptionalNumber = (value: unknown, fieldName: string): number | undefined => {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }

  return parseNumber(value, fieldName);
};

export const toBoolean = (value: unknown, defaultValue = false): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') {
      return true;
    }
    if (normalized === 'false') {
      return false;
    }
  }

  return defaultValue;
};
