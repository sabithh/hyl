import { z } from 'zod';

export const registerSchema = z.object({
  gymId: z.string().uuid('Invalid gym ID').optional(),
  gymEmail: z.string().email('Invalid gym email').optional(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['trainer', 'trainee']).default('trainee'),
  gender: z.enum(['male', 'female', 'other']).optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  referralCode: z.string().optional(),
}).refine((value) => Boolean(value.gymId || value.gymEmail), {
  message: 'gymId or gymEmail is required',
  path: ['gymId'],
});

export const createGymOwnerSchema = z.object({
  gymName: z.string().min(2, 'Gym name must be at least 2 characters'),
  gymEmail: z.string().email('Invalid gym email'),
  gymPhone: z.string().optional(),
  gymAddress: z.string().optional(),
  gymCity: z.string().optional(),
  gymState: z.string().optional(),
  gymCountry: z.string().optional(),
  gymPincode: z.string().optional(),
  ownerName: z.string().min(2, 'Owner name must be at least 2 characters'),
  ownerEmail: z.string().email('Invalid owner email'),
  ownerPhone: z.string().optional(),
  ownerPassword: z.string().min(6, 'Owner password must be at least 6 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateGymOwnerInput = z.infer<typeof createGymOwnerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
