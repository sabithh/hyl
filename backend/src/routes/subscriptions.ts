import { FreezeStatus, SubscriptionStatus } from '@prisma/client';
import { Router } from 'express';
import prisma from '../config/database';
import { authenticate } from '../middleware/auth';
import { ownerOnly } from '../middleware/rbac';
import { createAuditLog } from '../services/auditLog';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/errors';
import { sendCreated, sendSuccess } from '../utils/response';
import { getAuthUser, getPagination, parseDateOrThrow, parseOptionalNumber } from '../utils/request';

const router = Router();

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const { page, limit, skip } = getPagination(req);
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const requestedUserId = typeof req.query.userId === 'string' ? req.query.userId : undefined;

    const where: any = {
      gymId: authUser.gymId,
      ...(status ? { status: status as SubscriptionStatus } : {}),
    };

    if (authUser.role === 'trainee') {
      where.userId = authUser.userId;
    } else if (authUser.role === 'trainer') {
      where.user = { assignedTrainerId: authUser.userId };
    } else if (requestedUserId) {
      where.userId = requestedUserId;
    }

    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          plan: true,
          payments: {
            orderBy: { createdAt: 'desc' },
            take: 3,
          },
        },
      }),
      prisma.subscription.count({ where }),
    ]);

    sendSuccess(res, {
      subscriptions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', ownerOnly, async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const { userId, planId, startDate, endDate, status } = req.body;

    if (!userId || !planId) {
      throw new BadRequestError('userId and planId are required');
    }

    const [user, plan] = await Promise.all([
      prisma.user.findFirst({ where: { id: userId, gymId: authUser.gymId, role: 'trainee' } }),
      prisma.membershipPlan.findFirst({ where: { id: planId, gymId: authUser.gymId, isActive: true } }),
    ]);

    if (!user) {
      throw new NotFoundError('Trainee not found');
    }

    if (!plan) {
      throw new NotFoundError('Membership plan not found');
    }

    const start = startDate ? parseDateOrThrow(startDate, 'startDate') : new Date();
    const computedEndDate = endDate
      ? parseDateOrThrow(endDate, 'endDate')
      : new Date(start.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

    const subscription = await prisma.subscription.create({
      data: {
        gymId: authUser.gymId,
        userId,
        planId,
        startDate: start,
        endDate: computedEndDate,
        status: (status as SubscriptionStatus | undefined) ?? SubscriptionStatus.active,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        plan: true,
      },
    });

    await createAuditLog({
      gymId: authUser.gymId,
      userId: authUser.userId,
      action: 'subscription.created',
      entityType: 'subscription',
      entityId: subscription.id,
      details: { userId, planId, startDate: subscription.startDate, endDate: subscription.endDate },
      ipAddress: req.ip,
    });

    sendCreated(res, subscription, 'Subscription created successfully');
  } catch (error) {
    next(error);
  }
});

router.get('/expiring', ownerOnly, async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const nextDays = parseOptionalNumber(req.query.days, 'days') ?? 7;

    const from = new Date();
    const to = new Date(from.getTime() + nextDays * 24 * 60 * 60 * 1000);

    const expiring = await prisma.subscription.findMany({
      where: {
        gymId: authUser.gymId,
        status: SubscriptionStatus.active,
        endDate: {
          gte: from,
          lte: to,
        },
      },
      orderBy: { endDate: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        plan: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
      },
    });

    sendSuccess(res, expiring);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/freeze', async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const subscriptionId = String(req.params.id);
    const freezeStart = parseDateOrThrow(req.body.freezeStart, 'freezeStart');
    const freezeEnd = req.body.freezeEnd ? parseDateOrThrow(req.body.freezeEnd, 'freezeEnd') : undefined;

    const subscription = await prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        gymId: authUser.gymId,
      },
      select: {
        id: true,
        userId: true,
        status: true,
      },
    });

    if (!subscription) {
      throw new NotFoundError('Subscription not found');
    }

    if (authUser.role === 'trainee' && subscription.userId !== authUser.userId) {
      throw new ForbiddenError('You can only freeze your own subscription');
    }

    const freeze = await prisma.subscriptionFreeze.create({
      data: {
        subscriptionId,
        userId: subscription.userId,
        freezeStart,
        freezeEnd,
        reason: req.body.reason,
        approvedBy: authUser.role === 'owner' ? authUser.userId : undefined,
        status: authUser.role === 'owner' ? FreezeStatus.approved : FreezeStatus.pending,
      },
    });

    if (authUser.role === 'owner') {
      await prisma.subscription.update({
        where: { id: subscriptionId },
        data: { status: SubscriptionStatus.frozen },
      });
    }

    await createAuditLog({
      gymId: authUser.gymId,
      userId: authUser.userId,
      action: 'subscription.freeze_requested',
      entityType: 'subscription_freeze',
      entityId: freeze.id,
      details: { subscriptionId, status: freeze.status },
      ipAddress: req.ip,
    });

    sendCreated(res, freeze, 'Freeze request submitted');
  } catch (error) {
    next(error);
  }
});

router.post('/:id/unfreeze', async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const subscriptionId = String(req.params.id);

    const subscription = await prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        gymId: authUser.gymId,
      },
      select: { id: true, userId: true },
    });

    if (!subscription) {
      throw new NotFoundError('Subscription not found');
    }

    if (authUser.role === 'trainee' && subscription.userId !== authUser.userId) {
      throw new ForbiddenError('You can only unfreeze your own subscription');
    }

    await prisma.$transaction([
      prisma.subscription.update({
        where: { id: subscriptionId },
        data: { status: SubscriptionStatus.active },
      }),
      prisma.subscriptionFreeze.updateMany({
        where: {
          subscriptionId,
          status: FreezeStatus.approved,
          freezeEnd: null,
        },
        data: {
          freezeEnd: new Date(),
          approvedBy: authUser.role === 'owner' ? authUser.userId : undefined,
        },
      }),
    ]);

    await createAuditLog({
      gymId: authUser.gymId,
      userId: authUser.userId,
      action: 'subscription.unfrozen',
      entityType: 'subscription',
      entityId: subscriptionId,
      ipAddress: req.ip,
    });

    sendSuccess(res, null, 'Subscription unfrozen successfully');
  } catch (error) {
    next(error);
  }
});

router.get('/:id/freeze-history', async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const subscriptionId = String(req.params.id);

    const subscription = await prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        gymId: authUser.gymId,
      },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!subscription) {
      throw new NotFoundError('Subscription not found');
    }

    if (authUser.role === 'trainee' && subscription.userId !== authUser.userId) {
      throw new ForbiddenError('You can only view your own freeze history');
    }

    const freezes = await prisma.subscriptionFreeze.findMany({
      where: { subscriptionId },
      orderBy: { createdAt: 'desc' },
    });

    sendSuccess(res, freezes);
  } catch (error) {
    next(error);
  }
});

export default router;

