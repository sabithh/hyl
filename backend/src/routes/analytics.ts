import { PaymentStatus, SubscriptionStatus } from '@prisma/client';
import { Router } from 'express';
import prisma from '../config/database';
import { authenticate } from '../middleware/auth';
import { ownerOnly } from '../middleware/rbac';
import { sendSuccess } from '../utils/response';
import { getAuthUser } from '../utils/request';

const router = Router();

router.use(authenticate);
router.use(ownerOnly);

const formatDateKey = (date: Date, period: 'daily' | 'weekly' | 'monthly'): string => {
  const d = new Date(date);

  if (period === 'monthly') {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  if (period === 'weekly') {
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    return `${weekStart.getFullYear()}-W${Math.ceil((weekStart.getDate() + 1) / 7)}`;
  }

  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

router.get('/revenue', async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const period = (req.query.period === 'daily' || req.query.period === 'weekly' || req.query.period === 'monthly'
      ? req.query.period
      : 'monthly') as 'daily' | 'weekly' | 'monthly';

    const from = new Date();
    from.setMonth(from.getMonth() - 12);

    const payments = await prisma.payment.findMany({
      where: {
        gymId: authUser.gymId,
        status: PaymentStatus.paid,
        paidAt: { gte: from },
      },
      select: {
        amount: true,
        paidAt: true,
        method: true,
      },
    });

    const buckets: Record<string, number> = {};
    const byMethod: Record<string, number> = {};

    for (const payment of payments) {
      if (!payment.paidAt) {
        continue;
      }

      const key = formatDateKey(payment.paidAt, period);
      buckets[key] = (buckets[key] ?? 0) + payment.amount;
      byMethod[payment.method] = (byMethod[payment.method] ?? 0) + payment.amount;
    }

    sendSuccess(res, {
      period,
      trend: Object.entries(buckets)
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => a.label.localeCompare(b.label)),
      paymentMethodSplit: Object.entries(byMethod).map(([method, amount]) => ({ method, amount })),
    });
  } catch (error) {
    next(error);
  }
});

router.get('/members', async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);

    const from = new Date();
    from.setMonth(from.getMonth() - 12);

    const users = await prisma.user.findMany({
      where: {
        gymId: authUser.gymId,
        role: 'trainee',
        createdAt: { gte: from },
      },
      select: {
        joinDate: true,
        isActive: true,
      },
    });

    const monthly: Record<string, { joined: number; active: number }> = {};

    for (const user of users) {
      const key = formatDateKey(user.joinDate, 'monthly');
      if (!monthly[key]) {
        monthly[key] = { joined: 0, active: 0 };
      }

      monthly[key].joined += 1;
      if (user.isActive) {
        monthly[key].active += 1;
      }
    }

    const list = Object.entries(monthly)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month));

    sendSuccess(res, list);
  } catch (error) {
    next(error);
  }
});

router.get('/demographics', async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const trainees = await prisma.user.findMany({
      where: {
        gymId: authUser.gymId,
        role: 'trainee',
      },
      select: {
        gender: true,
        dateOfBirth: true,
      },
    });

    const genderBuckets: Record<string, number> = {};
    const ageBuckets: Record<string, number> = {
      '<18': 0,
      '18-24': 0,
      '25-34': 0,
      '35-44': 0,
      '45+': 0,
      unknown: 0,
    };

    const now = new Date();

    for (const user of trainees) {
      const gender = user.gender ?? 'unknown';
      genderBuckets[gender] = (genderBuckets[gender] ?? 0) + 1;

      if (!user.dateOfBirth) {
        ageBuckets.unknown += 1;
        continue;
      }

      const age = now.getFullYear() - user.dateOfBirth.getFullYear();
      if (age < 18) ageBuckets['<18'] += 1;
      else if (age <= 24) ageBuckets['18-24'] += 1;
      else if (age <= 34) ageBuckets['25-34'] += 1;
      else if (age <= 44) ageBuckets['35-44'] += 1;
      else ageBuckets['45+'] += 1;
    }

    sendSuccess(res, {
      genders: Object.entries(genderBuckets).map(([gender, count]) => ({ gender, count })),
      ageGroups: Object.entries(ageBuckets).map(([range, count]) => ({ range, count })),
    });
  } catch (error) {
    next(error);
  }
});

router.get('/retention', async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);

    const [activeCount, expiredCount, cancelledCount, total] = await Promise.all([
      prisma.subscription.count({ where: { gymId: authUser.gymId, status: SubscriptionStatus.active } }),
      prisma.subscription.count({ where: { gymId: authUser.gymId, status: SubscriptionStatus.expired } }),
      prisma.subscription.count({ where: { gymId: authUser.gymId, status: SubscriptionStatus.cancelled } }),
      prisma.subscription.count({ where: { gymId: authUser.gymId } }),
    ]);

    const churned = expiredCount + cancelledCount;
    const churnRate = total ? (churned / total) * 100 : 0;
    const retentionRate = total ? (activeCount / total) * 100 : 0;

    sendSuccess(res, {
      totalSubscriptions: total,
      activeCount,
      churned,
      churnRate: Number(churnRate.toFixed(2)),
      retentionRate: Number(retentionRate.toFixed(2)),
    });
  } catch (error) {
    next(error);
  }
});

router.get('/attendance', async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const from = new Date();
    from.setDate(from.getDate() - 30);

    const attendance = await prisma.attendance.findMany({
      where: {
        gymId: authUser.gymId,
        checkInTime: { gte: from },
      },
      select: {
        checkInTime: true,
        durationMinutes: true,
      },
    });

    const byDay: Record<string, number> = {};
    const byHour: Record<string, number> = {};
    let totalDuration = 0;
    let durationEntries = 0;

    for (const item of attendance) {
      const day = formatDateKey(item.checkInTime, 'daily');
      const hour = String(item.checkInTime.getHours()).padStart(2, '0');

      byDay[day] = (byDay[day] ?? 0) + 1;
      byHour[hour] = (byHour[hour] ?? 0) + 1;

      if (item.durationMinutes) {
        totalDuration += item.durationMinutes;
        durationEntries += 1;
      }
    }

    sendSuccess(res, {
      dailyTrend: Object.entries(byDay)
        .map(([day, count]) => ({ day, count }))
        .sort((a, b) => a.day.localeCompare(b.day)),
      peakHours: Object.entries(byHour)
        .map(([hour, count]) => ({ hour: `${hour}:00`, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      averageSessionDuration: durationEntries ? Number((totalDuration / durationEntries).toFixed(2)) : 0,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/plans', async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);

    const popularity = await prisma.subscription.groupBy({
      by: ['planId'],
      where: {
        gymId: authUser.gymId,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    const plans = await prisma.membershipPlan.findMany({
      where: {
        id: { in: popularity.map((item) => item.planId) },
      },
      select: {
        id: true,
        name: true,
        price: true,
        durationDays: true,
      },
    });

    sendSuccess(
      res,
      popularity.map((item) => ({
        planId: item.planId,
        count: item._count.id,
        plan: plans.find((plan) => plan.id === item.planId) ?? null,
      }))
    );
  } catch (error) {
    next(error);
  }
});

export default router;
