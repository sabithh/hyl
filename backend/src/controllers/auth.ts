import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth';
import { sendSuccess, sendCreated } from '../utils/response';

export const authController = {
  async createGymOwner(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.createGymOwner(req.body);
      sendCreated(res, result, 'Gym and owner created successfully');
    } catch (error) {
      next(error);
    }
  },

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const gymId = await authService.resolveGymIdForRegistration({
        requesterGymId: req.user?.gymId,
        gymId: req.body.gymId,
        gymEmail: req.body.gymEmail,
      });

      if (!gymId) {
        return res.status(400).json({ success: false, message: 'Gym ID is required' });
      }

      const result = await authService.register(req.body, gymId);
      sendCreated(res, result, 'User registered successfully');
    } catch (error) {
      next(error);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      sendSuccess(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshToken(refreshToken);
      sendSuccess(res, result, 'Token refreshed');
    } catch (error) {
      next(error);
    }
  },

  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await authService.getProfile(req.user!.userId);
      sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  },

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { currentPassword, newPassword } = req.body;
      const result = await authService.changePassword(req.user!.userId, currentPassword, newPassword);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  },

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      // TODO: Implement email sending for password reset
      sendSuccess(res, null, 'If an account with that email exists, a reset link has been sent');
    } catch (error) {
      next(error);
    }
  },
};
