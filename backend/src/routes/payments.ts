import { PaymentMethod, PaymentStatus } from '@prisma/client';
import { Router } from 'express';
import prisma from '../config/database';
import { authenticate } from '../middleware/auth';
import { ownerOnly } from '../middleware/rbac';
import { createAuditLog } from '../services/auditLog';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/errors';
import { sendCreated, sendSuccess } from '../utils/response';
import { getAuthUser, getPagination, parseDateOrThrow, parseNumber } from '../utils/request';

const router = Router();

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const { page, limit, skip } = getPagination(req);

    const status = typeof req.query.status === 'string' ? (req.query.status as PaymentStatus) : undefined;
    const method = typeof req.query.method === 'string' ? (req.query.method as PaymentMethod) : undefined;
    const fromDate = typeof req.query.fromDate === 'string' ? parseDateOrThrow(req.query.fromDate, 'fromDate') : undefined;
    const toDate = typeof req.query.toDate === 'string' ? parseDateOrThrow(req.query.toDate, 'toDate') : undefined;

    const where: any = {
      gymId: authUser.gymId,
      ...(status ? { status } : {}),
      ...(method ? { method } : {}),
      ...(fromDate || toDate
        ? {
            createdAt: {
              ...(fromDate ? { gte: fromDate } : {}),
              ...(toDate ? { lte: toDate } : {}),
            },
          }
        : {}),
    };

    if (authUser.role === 'trainee') {
      where.userId = authUser.userId;
    }

    if (authUser.role === 'trainer') {
      where.user = { assignedTrainerId: authUser.userId };
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
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
            },
          },
          subscription: {
            select: {
              id: true,
              startDate: true,
              endDate: true,
            },
          },
        },
      }),
      prisma.payment.count({ where }),
    ]);

    sendSuccess(res, {
      payments,
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
    const {
      userId,
      subscriptionId,
      amount,
      method,
      status = PaymentStatus.paid,
      transactionId,
      notes,
      paidAt,
    } = req.body;

    if (!userId || amount === undefined || !method) {
      throw new BadRequestError('userId, amount and method are required');
    }

    const user = await prisma.user.findFirst({
      where: { id: userId, gymId: authUser.gymId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (subscriptionId) {
      const subscription = await prisma.subscription.findFirst({
        where: { id: subscriptionId, gymId: authUser.gymId, userId },
        select: { id: true },
      });

      if (!subscription) {
        throw new BadRequestError('subscriptionId is invalid for this user');
      }
    }

    const payment = await prisma.payment.create({
      data: {
        gymId: authUser.gymId,
        userId,
        subscriptionId,
        amount: parseNumber(amount, 'amount'),
        method: method as PaymentMethod,
        status: status as PaymentStatus,
        transactionId,
        notes,
        paidAt: paidAt ? parseDateOrThrow(paidAt, 'paidAt') : new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    await createAuditLog({
      gymId: authUser.gymId,
      userId: authUser.userId,
      action: 'payment.recorded',
      entityType: 'payment',
      entityId: payment.id,
      details: {
        userId,
        subscriptionId,
        amount: payment.amount,
        method: payment.method,
        status: payment.status,
      },
      ipAddress: req.ip,
    });

    sendCreated(res, payment, 'Payment recorded successfully');
  } catch (error) {
    next(error);
  }
});

router.get('/summary', ownerOnly, async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [allTime, monthly, pending, byMethod] = await Promise.all([
      prisma.payment.aggregate({
        where: { gymId: authUser.gymId, status: PaymentStatus.paid },
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.payment.aggregate({
        where: {
          gymId: authUser.gymId,
          status: PaymentStatus.paid,
          paidAt: {
            gte: monthStart,
            lt: monthEnd,
          },
        },
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.payment.aggregate({
        where: {
          gymId: authUser.gymId,
          status: PaymentStatus.pending,
        },
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.payment.groupBy({
        by: ['method'],
        where: {
          gymId: authUser.gymId,
          status: PaymentStatus.paid,
        },
        _sum: { amount: true },
        _count: { id: true },
      }),
    ]);

    sendSuccess(res, {
      monthlyRevenue: monthly._sum.amount ?? 0,
      monthlyTransactions: monthly._count.id,
      totalRevenue: allTime._sum.amount ?? 0,
      totalTransactions: allTime._count.id,
      pendingAmount: pending._sum.amount ?? 0,
      pendingCount: pending._count.id,
      byMethod,
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id/status', ownerOnly, async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const paymentId = String(req.params.id);
    const status = req.body.status as PaymentStatus | undefined;

    if (!status) {
      throw new BadRequestError('status is required');
    }

    const existing = await prisma.payment.findFirst({
      where: { id: paymentId, gymId: authUser.gymId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundError('Payment not found');
    }

    const updated = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status,
        paidAt: status === PaymentStatus.paid ? new Date() : undefined,
      },
    });

    await createAuditLog({
      gymId: authUser.gymId,
      userId: authUser.userId,
      action: 'payment.status_updated',
      entityType: 'payment',
      entityId: paymentId,
      details: { status },
      ipAddress: req.ip,
    });

    sendSuccess(res, updated, 'Payment status updated');
  } catch (error) {
    next(error);
  }
});

router.get('/my', async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);

    if (authUser.role !== 'trainee') {
      throw new ForbiddenError('This endpoint is only for trainees');
    }

    const payments = await prisma.payment.findMany({
      where: {
        gymId: authUser.gymId,
        userId: authUser.userId,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
      },
    });

    sendSuccess(res, payments);
  } catch (error) {
    next(error);
  }
});

export default router;

