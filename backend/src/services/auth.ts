import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/database';
import config from '../config';
import { BadRequestError, ConflictError, UnauthorizedError, NotFoundError } from '../utils/errors';
import { JwtPayload } from '../middleware/auth';
import { CreateGymOwnerInput, RegisterInput } from '../validators/auth';

const SALT_ROUNDS = 12;

const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn } as jwt.SignOptions);
};

const generateRefreshToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshExpiresIn } as jwt.SignOptions);
};

const generateQrCode = (): string => `QR-${uuidv4().slice(0, 8).toUpperCase()}`;
const generateReferralCode = (name: string): string => {
  const prefix = name.replace(/\s/g, '').slice(0, 4).toUpperCase();
  return `${prefix}-${uuidv4().slice(0, 6).toUpperCase()}`;
};

export const authService = {
  async createGymOwner(data: CreateGymOwnerInput) {
    const existingGym = await prisma.gym.findUnique({ where: { email: data.gymEmail } });
    if (existingGym) {
      throw new ConflictError('A gym with this email already exists');
    }

    const existingOwner = await prisma.user.findUnique({ where: { email: data.ownerEmail } });
    if (existingOwner) {
      throw new ConflictError('Owner email already registered');
    }

    const passwordHash = await bcrypt.hash(data.ownerPassword, SALT_ROUNDS);

    const result = await prisma.$transaction(async (tx) => {
      const gym = await tx.gym.create({
        data: {
          name: data.gymName,
          email: data.gymEmail,
          phone: data.gymPhone,
          address: data.gymAddress,
          city: data.gymCity,
          state: data.gymState,
          country: data.gymCountry,
          pincode: data.gymPincode,
          isActive: true,
        },
      });

      const owner = await tx.user.create({
        data: {
          gymId: gym.id,
          name: data.ownerName,
          email: data.ownerEmail,
          phone: data.ownerPhone,
          passwordHash,
          role: 'owner',
          qrCode: generateQrCode(),
          referralCode: generateReferralCode(data.ownerName),
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          gymId: true,
          qrCode: true,
          referralCode: true,
          createdAt: true,
        },
      });

      return { gym, owner };
    });

    const tokenPayload: JwtPayload = {
      userId: result.owner.id,
      gymId: result.owner.gymId,
      role: result.owner.role,
    };

    return {
      gym: result.gym,
      user: result.owner,
      accessToken: generateToken(tokenPayload),
      refreshToken: generateRefreshToken(tokenPayload),
    };
  },

  async resolveGymIdForRegistration(input: {
    requesterGymId?: string;
    gymId?: string;
    gymEmail?: string;
  }) {
    if (input.requesterGymId) {
      return input.requesterGymId;
    }

    if (input.gymId) {
      const gym = await prisma.gym.findFirst({
        where: { id: input.gymId, isActive: true },
        select: { id: true },
      });

      if (!gym) {
        throw new NotFoundError('Gym not found or inactive');
      }

      return gym.id;
    }

    if (input.gymEmail) {
      const gym = await prisma.gym.findFirst({
        where: { email: input.gymEmail, isActive: true },
        select: { id: true },
      });

      if (!gym) {
        throw new NotFoundError('Gym not found or inactive');
      }

      return gym.id;
    }

    throw new BadRequestError('gymId or gymEmail is required');
  },

  async register(data: RegisterInput, gymId: string) {
    const gym = await prisma.gym.findFirst({
      where: { id: gymId, isActive: true },
      select: { id: true },
    });

    if (!gym) {
      throw new NotFoundError('Gym not found or inactive');
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new ConflictError('Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

    // Create user
    const user = await prisma.user.create({
      data: {
        gymId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        passwordHash,
        role: data.role || 'trainee',
        gender: data.gender as any,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        address: data.address,
        qrCode: generateQrCode(),
        referralCode: generateReferralCode(data.name),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        gymId: true,
        qrCode: true,
        referralCode: true,
        createdAt: true,
      },
    });

    // Handle referral if provided
    if (data.referralCode) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode: data.referralCode },
      });
      if (referrer && referrer.gymId === gymId) {
        await prisma.user.update({
          where: { id: user.id },
          data: { referredBy: referrer.id },
        });
        await prisma.referralReward.create({
          data: {
            gymId,
            referrerId: referrer.id,
            referredId: user.id,
            rewardType: 'free_days',
            rewardValue: '7 free days',
            status: 'pending',
          },
        });
      }
    }

    // Generate tokens
    const tokenPayload: JwtPayload = {
      userId: user.id,
      gymId: user.gymId,
      role: user.role,
    };
    const accessToken = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    return { user, accessToken, refreshToken };
  },

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        gymId: true,
        passwordHash: true,
        isActive: true,
        profilePicUrl: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is deactivated');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const tokenPayload: JwtPayload = {
      userId: user.id,
      gymId: user.gymId,
      role: user.role,
    };
    const accessToken = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Remove passwordHash from response
    const { passwordHash: _, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, accessToken, refreshToken };
  },

  async refreshToken(token: string) {
    try {
      const decoded = jwt.verify(token, config.jwt.refreshSecret) as JwtPayload;
      
      // Verify user still exists and is active
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, gymId: true, role: true, isActive: true },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedError('User not found or inactive');
      }

      const tokenPayload: JwtPayload = {
        userId: user.id,
        gymId: user.gymId,
        role: user.role,
      };

      return { accessToken: generateToken(tokenPayload) };
    } catch {
      throw new UnauthorizedError('Invalid refresh token');
    }
  },

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        gender: true,
        dateOfBirth: true,
        profilePicUrl: true,
        address: true,
        heightCm: true,
        bloodGroup: true,
        emergencyContactName: true,
        emergencyContactPhone: true,
        medicalConditions: true,
        qrCode: true,
        referralCode: true,
        joinDate: true,
        gymId: true,
        assignedTrainerId: true,
        assignedTrainer: { select: { id: true, name: true, profilePicUrl: true } },
      },
    });

    if (!user) throw new NotFoundError('User not found');
    return user;
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true },
    });

    if (!user) throw new NotFoundError('User not found');

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) throw new UnauthorizedError('Current password is incorrect');

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { message: 'Password changed successfully' };
  },
};
