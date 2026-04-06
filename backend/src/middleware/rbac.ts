import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../utils/errors';

type Role = 'owner' | 'trainer' | 'trainee';

export const requireRole = (...roles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ForbiddenError('Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError(`Access denied. Required role: ${roles.join(' or ')}`));
    }

    next();
  };
};

// Owner-only shorthand
export const ownerOnly = requireRole('owner');

// Trainer or owner
export const trainerOrOwner = requireRole('owner', 'trainer');

// Any authenticated user
export const anyRole = requireRole('owner', 'trainer', 'trainee');
