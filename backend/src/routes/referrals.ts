import { ReferralRewardStatus, ReferralRewardType } from '@prisma/client';
import { Router } from 'express';
import prisma from '../config/database';
import { authenticate } from '../middleware/auth';
import { ownerOnly } from '../middleware/rbac';
import { createAuditLog } from '../services/auditLog';
import { BadRequestError, ConflictError, NotFoundError } from '../utils/errors';
import { sendCreated, sendSuccess } from '../utils/response';
import { getAuthUser } from '../utils/request';

const router = Router();

router.use(authenticate);

router.get('/my-code', async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);

    const user = await prisma.user.findFirst({
      where: {
        id: authUser.userId,
        gymId: authUser.gymId,
      },
      select: {
        id: true,
        referralCode: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    sendSuccess(res, user);
  } catch (error) {
    next(error);
  }
});

router.post('/apply', async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const referralCode = req.body.referralCode as string | undefined;

    if (!referralCode) {
      throw new BadRequestError('referralCode is required');
    }

    const currentUser = await prisma.user.findFirst({
      where: {
        id: authUser.userId,
        gymId: authUser.gymId,
      },
      select: {
        id: true,
        referredBy: true,
      },
    });

    if (!currentUser) {
      throw new NotFoundError('User not found');
    }

    if (currentUser.referredBy) {
      throw new ConflictError('Referral code already applied');
    }

    const referrer = await prisma.user.findFirst({
      where: {
        gymId: authUser.gymId,
        referralCode,
        id: {
          not: authUser.userId,
        },
      },
      select: {
        id: true,
      },
    });

    if (!referrer) {
      throw new NotFoundError('Invalid referral code');
    }

    const reward = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: authUser.userId },
        data: {
          referredBy: referrer.id,
        },
      });

      return tx.referralReward.create({
        data: {
          gymId: authUser.gymId,
          referrerId: referrer.id,
          referredId: authUser.userId,
          rewardType: ReferralRewardType.free_days,
          rewardValue: '7 free days',
          status: ReferralRewardStatus.pending,
        },
      });
    });

    await createAuditLog({
      gymId: authUser.gymId,
      userId: authUser.userId,
      action: 'referral.applied',
      entityType: 'referral_reward',
      entityId: reward.id,
      details: {
        referralCode,
        referrerId: referrer.id,
      },
      ipAddress: req.ip,
    });

    sendCreated(res, reward, 'Referral code applied successfully');
  } catch (error) {
    next(error);
  }
});

router.get('/history', async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);

    const where =
      authUser.role === 'owner'
        ? { gymId: authUser.gymId }
        : {
            gymId: authUser.gymId,
            OR: [{ referrerId: authUser.userId }, { referredId: authUser.userId }],
          };

    const rewards = await prisma.referralReward.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        referrer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        referred: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    sendSuccess(res, rewards);
  } catch (error) {
    next(error);
  }
});

router.get('/stats', ownerOnly, async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);

    const [totalsByStatus, totalsByType, topReferrers] = await Promise.all([
      prisma.referralReward.groupBy({
        by: ['status'],
        where: { gymId: authUser.gymId },
        _count: { id: true },
      }),
      prisma.referralReward.groupBy({
        by: ['rewardType'],
        where: { gymId: authUser.gymId },
        _count: { id: true },
      }),
      prisma.referralReward.groupBy({
        by: ['referrerId'],
        where: { gymId: authUser.gymId },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
    ]);

    const referrerProfiles = await prisma.user.findMany({
      where: {
        id: { in: topReferrers.map((item) => item.referrerId) },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    sendSuccess(res, {
      totalsByStatus,
      totalsByType,
      topReferrers: topReferrers.map((item) => ({
        referrerId: item.referrerId,
        referrals: item._count.id,
        user: referrerProfiles.find((profile) => profile.id === item.referrerId) ?? null,
      })),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
