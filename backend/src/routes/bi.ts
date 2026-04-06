import { PaymentStatus, SubscriptionStatus } from '@prisma/client';
import { Router } from 'express';
import prisma from '../config/database';
import { authenticate } from '../middleware/auth';
import { ownerOnly } from '../middleware/rbac';
import { sendSuccess } from '../utils/response';
import { getAuthUser, parseOptionalNumber } from '../utils/request';

const router = Router();

router.use(authenticate);
router.use(ownerOnly);

const monthKey = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

const dayKey = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;
};

const getStartOfMonth = (date = new Date()): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

const getStartOfYear = (date = new Date()): Date => {
  return new Date(date.getFullYear(), 0, 1);
};

const getMonthlyRevenueTrend = async (gymId: string, months = 12) => {
  const from = new Date();
  from.setMonth(from.getMonth() - months);

  const payments = await prisma.payment.findMany({
    where: {
      gymId,
      status: PaymentStatus.paid,
      paidAt: { gte: from },
    },
    select: {
      amount: true,
      paidAt: true,
    },
  });

  const buckets: Record<string, number> = {};
  for (const payment of payments) {
    if (!payment.paidAt) {
      continue;
    }

    const key = monthKey(payment.paidAt);
    buckets[key] = (buckets[key] ?? 0) + payment.amount;
  }

  return Object.entries(buckets)
    .map(([period, revenue]) => ({ period, revenue: Number(revenue.toFixed(2)) }))
    .sort((a, b) => a.period.localeCompare(b.period));
};

const getAttendanceWindow = async (gymId: string, days = 30) => {
  const from = new Date();
  from.setDate(from.getDate() - days);

  return prisma.attendance.findMany({
    where: {
      gymId,
      checkInTime: { gte: from },
    },
    select: {
      userId: true,
      checkInTime: true,
      durationMinutes: true,
    },
  });
};

router.get('/overview', async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const monthStart = getStartOfMonth();
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);

    const [activeSubs, monthlyRevenue, newMembers, allSubs, attendanceWindow, pendingPayments] = await Promise.all([
      prisma.subscription.count({ where: { gymId: authUser.gymId, status: SubscriptionStatus.active } }),
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
      }),
      prisma.user.count({
        where: {
          gymId: authUser.gymId,
          role: 'trainee',
          joinDate: {
            gte: monthStart,
            lt: monthEnd,
          },
        },
      }),
      prisma.subscription.findMany({
        where: { gymId: authUser.gymId },
        select: { status: true },
      }),
      getAttendanceWindow(authUser.gymId, 30),
      prisma.payment.aggregate({
        where: {
          gymId: authUser.gymId,
          status: PaymentStatus.pending,
        },
        _sum: { amount: true },
      }),
    ]);

    const churned = allSubs.filter((sub) => sub.status === 'expired' || sub.status === 'cancelled').length;
    const churnRate = allSubs.length ? (churned / allSubs.length) * 100 : 0;

    const visitsByDay: Record<string, number> = {};
    let totalDuration = 0;
    let totalDurationEntries = 0;

    for (const item of attendanceWindow) {
      const key = dayKey(item.checkInTime);
      visitsByDay[key] = (visitsByDay[key] ?? 0) + 1;

      if (item.durationMinutes) {
        totalDuration += item.durationMinutes;
        totalDurationEntries += 1;
      }
    }

    const avgAttendancePerDay = Object.keys(visitsByDay).length
      ? attendanceWindow.length / Object.keys(visitsByDay).length
      : 0;

    const avgSessionDuration = totalDurationEntries ? totalDuration / totalDurationEntries : 0;
    const revenuePerMember = activeSubs ? (monthlyRevenue._sum.amount ?? 0) / activeSubs : 0;

    sendSuccess(res, {
      totalActiveMembers: activeSubs,
      monthlyRevenue: Number((monthlyRevenue._sum.amount ?? 0).toFixed(2)),
      newMembersThisMonth: newMembers,
      churnRate: Number(churnRate.toFixed(2)),
      avgAttendancePerDay: Number(avgAttendancePerDay.toFixed(2)),
      avgSessionDuration: Number(avgSessionDuration.toFixed(2)),
      revenuePerMember: Number(revenuePerMember.toFixed(2)),
      pendingPayments: Number((pendingPayments._sum.amount ?? 0).toFixed(2)),
    });
  } catch (error) {
    next(error);
  }
});

router.get('/revenue/trend', async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const months = parseOptionalNumber(req.query.months, 'months') ?? 12;
    const trend = await getMonthlyRevenueTrend(authUser.gymId, months);
    sendSuccess(res, trend);
  } catch (error) {
    next(error);
  }
});

router.get('/revenue/by-plan', async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);

    const grouped = await prisma.subscription.groupBy({
      by: ['planId'],
      where: {
        gymId: authUser.gymId,
      },
      _count: { id: true },
    });

    const planIds = grouped.map((item) => item.planId);
    const plans = await prisma.membershipPlan.findMany({
      where: {
        id: { in: planIds },
      },
      select: {
        id: true,
        name: true,
        price: true,
      },
    });

    sendSuccess(
      res,
      grouped
        .map((item) => {
          const plan = plans.find((p) => p.id === item.planId);
          return {
            planId: item.planId,
            planName: plan?.name ?? 'Unknown',
            subscriptions: item._count.id,
            estimatedRevenue: Number(((plan?.price ?? 0) * item._count.id).toFixed(2)),
          };
        })
        .sort((a, b) => b.estimatedRevenue - a.estimatedRevenue)
    );
  } catch (error) {
    next(error);
  }
});

router.get('/revenue/forecast', async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const trend = await getMonthlyRevenueTrend(authUser.gymId, 6);

    const avg = trend.length ? trend.reduce((acc, item) => acc + item.revenue, 0) / trend.length : 0;
    const growthRate = trend.length >= 2 ? (trend[trend.length - 1].revenue - trend[0].revenue) / trend.length : 0;

    const baseDate = new Date();
    const forecast = Array.from({ length: 3 }).map((_, index) => {
      const month = new Date(baseDate.getFullYear(), baseDate.getMonth() + index + 1, 1);
      const projection = avg + growthRate * (index + 1);
      return {
        period: monthKey(month),
        projectedRevenue: Number(Math.max(projection, 0).toFixed(2)),
      };
    });

    sendSuccess(res, {
      baselineAverage: Number(avg.toFixed(2)),
      growthRatePerMonth: Number(growthRate.toFixed(2)),
      forecast,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/members/growth', async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const from = new Date();
    from.setMonth(from.getMonth() - 12);

    const members = await prisma.user.findMany({
      where: {
        gymId: authUser.gymId,
        role: 'trainee',
        joinDate: { gte: from },
      },
      select: {
        joinDate: true,
        isActive: true,
      },
    });

    const grouped: Record<string, { joined: number; active: number }> = {};
    for (const member of members) {
      const key = monthKey(member.joinDate);
      if (!grouped[key]) {
        grouped[key] = { joined: 0, active: 0 };
      }

      grouped[key].joined += 1;
      if (member.isActive) {
        grouped[key].active += 1;
      }
    }

    sendSuccess(
      res,
      Object.entries(grouped)
        .map(([period, value]) => ({ period, ...value }))
        .sort((a, b) => a.period.localeCompare(b.period))
    );
  } catch (error) {
    next(error);
  }
});

router.get('/members/demographics', async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const users = await prisma.user.findMany({
      where: { gymId: authUser.gymId, role: 'trainee' },
      select: {
        gender: true,
        dateOfBirth: true,
      },
    });

    const genders: Record<string, number> = {};
    const ageGroups: Record<string, number> = {
      '<18': 0,
      '18-24': 0,
      '25-34': 0,
      '35-44': 0,
      '45+': 0,
      unknown: 0,
    };

    const now = new Date();
    for (const user of users) {
      const gender = user.gender ?? 'unknown';
      genders[gender] = (genders[gender] ?? 0) + 1;

      if (!user.dateOfBirth) {
        ageGroups.unknown += 1;
        continue;
      }

      const age = now.getFullYear() - user.dateOfBirth.getFullYear();
      if (age < 18) ageGroups['<18'] += 1;
      else if (age <= 24) ageGroups['18-24'] += 1;
      else if (age <= 34) ageGroups['25-34'] += 1;
      else if (age <= 44) ageGroups['35-44'] += 1;
      else ageGroups['45+'] += 1;
    }

    sendSuccess(res, {
      genders: Object.entries(genders).map(([group, count]) => ({ group, count })),
      ageGroups: Object.entries(ageGroups).map(([group, count]) => ({ group, count })),
    });
  } catch (error) {
    next(error);
  }
});

router.get('/members/lifecycle', async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);

    const [joined, active, renewed, churned] = await Promise.all([
      prisma.user.count({ where: { gymId: authUser.gymId, role: 'trainee' } }),
      prisma.subscription.count({ where: { gymId: authUser.gymId, status: SubscriptionStatus.active } }),
      prisma.subscription.count({
        where: {
          gymId: authUser.gymId,
          status: SubscriptionStatus.active,
          createdAt: { lte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.subscription.count({
        where: {
          gymId: authUser.gymId,
          status: { in: [SubscriptionStatus.cancelled, SubscriptionStatus.expired] },
        },
      }),
    ]);

    sendSuccess(res, {
      joined,
      active,
      renewed,
      churned,
      conversionToActive: joined ? Number(((active / joined) * 100).toFixed(2)) : 0,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/attendance/heatmap', async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const records = await getAttendanceWindow(authUser.gymId, 60);

    const heatmap: Record<string, Record<number, number>> = {};

    for (const record of records) {
      const day = record.checkInTime.toLocaleDateString('en-US', { weekday: 'long' });
      const hour = record.checkInTime.getHours();

      if (!heatmap[day]) {
        heatmap[day] = {};
      }

      heatmap[day][hour] = (heatmap[day][hour] ?? 0) + 1;
    }

    const flattened = Object.entries(heatmap).flatMap(([day, hours]) =>
      Object.entries(hours).map(([hour, count]) => ({ day, hour: Number(hour), count }))
    );

    sendSuccess(res, flattened);
  } catch (error) {
    next(error);
  }
});

router.get('/attendance/trend', async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const records = await getAttendanceWindow(authUser.gymId, 60);

    const trend: Record<string, number> = {};
    for (const record of records) {
      const key = dayKey(record.checkInTime);
      trend[key] = (trend[key] ?? 0) + 1;
    }

    sendSuccess(
      res,
      Object.entries(trend)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date))
    );
  } catch (error) {
    next(error);
  }
});

router.get('/attendance/ghosts', async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const days = parseOptionalNumber(req.query.days, 'days') ?? 30;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const activeSubs = await prisma.subscription.findMany({
      where: {
        gymId: authUser.gymId,
        status: SubscriptionStatus.active,
      },
      select: { userId: true },
    });

    const userIds = Array.from(new Set(activeSubs.map((item) => item.userId)));

    const recentAttendance = await prisma.attendance.findMany({
      where: {
        gymId: authUser.gymId,
        userId: { in: userIds },
        checkInTime: { gte: cutoff },
      },
      select: { userId: true },
      distinct: ['userId'],
    });

    const recentSet = new Set(recentAttendance.map((item) => item.userId));
    const ghostIds = userIds.filter((id) => !recentSet.has(id));

    const ghosts = await prisma.user.findMany({
      where: { id: { in: ghostIds } },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        joinDate: true,
      },
    });

    sendSuccess(res, ghosts);
  } catch (error) {
    next(error);
  }
});

router.get('/churn/rate', async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const from = new Date();
    from.setMonth(from.getMonth() - 12);

    const subscriptions = await prisma.subscription.findMany({
      where: {
        gymId: authUser.gymId,
        createdAt: { gte: from },
      },
      select: {
        createdAt: true,
        status: true,
      },
    });

    const grouped: Record<string, { total: number; churned: number }> = {};

    for (const sub of subscriptions) {
      const key = monthKey(sub.createdAt);
      if (!grouped[key]) {
        grouped[key] = { total: 0, churned: 0 };
      }

      grouped[key].total += 1;
      if (sub.status === SubscriptionStatus.expired || sub.status === SubscriptionStatus.cancelled) {
        grouped[key].churned += 1;
      }
    }

    sendSuccess(
      res,
      Object.entries(grouped)
        .map(([period, value]) => ({
          period,
          total: value.total,
          churned: value.churned,
          churnRate: value.total ? Number(((value.churned / value.total) * 100).toFixed(2)) : 0,
        }))
        .sort((a, b) => a.period.localeCompare(b.period))
    );
  } catch (error) {
    next(error);
  }
});

router.get('/churn/risk', async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);

    const activeSubs = await prisma.subscription.findMany({
      where: {
        gymId: authUser.gymId,
        status: SubscriptionStatus.active,
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

    const userIds = activeSubs.map((sub) => sub.userId);

    const lastAttendance = await prisma.attendance.groupBy({
      by: ['userId'],
      where: {
        gymId: authUser.gymId,
        userId: { in: userIds },
      },
      _max: { checkInTime: true },
    });

    const attendanceMap = new Map(lastAttendance.map((item) => [item.userId, item._max.checkInTime]));
    const now = new Date();

    const scored = activeSubs
      .map((sub) => {
        const lastSeen = attendanceMap.get(sub.userId);
        const daysSinceLastVisit = lastSeen
          ? Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 60 * 60 * 24))
          : 999;

        const daysToExpiry = Math.floor((sub.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const riskScore = Math.max(0, Math.min(100, daysSinceLastVisit * 2 + (30 - Math.max(daysToExpiry, 0))));

        return {
          userId: sub.userId,
          user: sub.user,
          subscriptionId: sub.id,
          daysSinceLastVisit,
          daysToExpiry,
          riskScore: Number(riskScore.toFixed(2)),
        };
      })
      .sort((a, b) => b.riskScore - a.riskScore);

    sendSuccess(res, scored);
  } catch (error) {
    next(error);
  }
});

router.get('/churn/cohorts', async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const users = await prisma.user.findMany({
      where: {
        gymId: authUser.gymId,
        role: 'trainee',
      },
      select: {
        id: true,
        joinDate: true,
      },
    });

    const userIds = users.map((user) => user.id);
    const activeSubs = await prisma.subscription.findMany({
      where: {
        gymId: authUser.gymId,
        userId: { in: userIds },
        status: SubscriptionStatus.active,
      },
      select: { userId: true },
      distinct: ['userId'],
    });

    const activeSet = new Set(activeSubs.map((sub) => sub.userId));
    const cohorts: Record<string, { total: number; retained: number }> = {};

    for (const user of users) {
      const cohort = monthKey(user.joinDate);
      if (!cohorts[cohort]) {
        cohorts[cohort] = { total: 0, retained: 0 };
      }

      cohorts[cohort].total += 1;
      if (activeSet.has(user.id)) {
        cohorts[cohort].retained += 1;
      }
    }

    sendSuccess(
      res,
      Object.entries(cohorts)
        .map(([cohort, values]) => ({
          cohort,
          total: values.total,
          retained: values.retained,
          retentionRate: values.total ? Number(((values.retained / values.total) * 100).toFixed(2)) : 0,
        }))
        .sort((a, b) => a.cohort.localeCompare(b.cohort))
    );
  } catch (error) {
    next(error);
  }
});

router.get('/subscriptions/expiring', async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const days = parseOptionalNumber(req.query.days, 'days') ?? 7;

    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + days);

    const expiring = await prisma.subscription.findMany({
      where: {
        gymId: authUser.gymId,
        status: SubscriptionStatus.active,
        endDate: {
          gte: from,
          lte: to,
        },
      },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        plan: { select: { id: true, name: true, price: true } },
      },
      orderBy: { endDate: 'asc' },
    });

    sendSuccess(res, expiring);
  } catch (error) {
    next(error);
  }
});

router.get('/subscriptions/popularity', async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);

    const grouped = await prisma.subscription.groupBy({
      by: ['planId'],
      where: { gymId: authUser.gymId },
      _count: { id: true },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    const plans = await prisma.membershipPlan.findMany({
      where: { id: { in: grouped.map((group) => group.planId) } },
      select: { id: true, name: true, price: true, durationDays: true },
    });

    sendSuccess(
      res,
      grouped.map((group) => ({
        planId: group.planId,
        subscriptions: group._count.id,
        plan: plans.find((plan) => plan.id === group.planId) ?? null,
      }))
    );
  } catch (error) {
    next(error);
  }
});

router.get('/compare/monthly', async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const now = new Date();

    const currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevEnd = currentStart;

    const [currentRevenue, prevRevenue, currentMembers, prevMembers] = await Promise.all([
      prisma.payment.aggregate({
        where: {
          gymId: authUser.gymId,
          status: PaymentStatus.paid,
          paidAt: { gte: currentStart, lt: currentEnd },
        },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: {
          gymId: authUser.gymId,
          status: PaymentStatus.paid,
          paidAt: { gte: prevStart, lt: prevEnd },
        },
        _sum: { amount: true },
      }),
      prisma.user.count({
        where: {
          gymId: authUser.gymId,
          role: 'trainee',
          joinDate: { gte: currentStart, lt: currentEnd },
        },
      }),
      prisma.user.count({
        where: {
          gymId: authUser.gymId,
          role: 'trainee',
          joinDate: { gte: prevStart, lt: prevEnd },
        },
      }),
    ]);

    const currentRevenueValue = currentRevenue._sum.amount ?? 0;
    const previousRevenueValue = prevRevenue._sum.amount ?? 0;

    sendSuccess(res, {
      revenue: {
        current: Number(currentRevenueValue.toFixed(2)),
        previous: Number(previousRevenueValue.toFixed(2)),
        changePct: previousRevenueValue
          ? Number((((currentRevenueValue - previousRevenueValue) / previousRevenueValue) * 100).toFixed(2))
          : 0,
      },
      newMembers: {
        current: currentMembers,
        previous: prevMembers,
        changePct: prevMembers ? Number((((currentMembers - prevMembers) / prevMembers) * 100).toFixed(2)) : 0,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/compare/yearly', async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const now = new Date();

    const currentStart = getStartOfYear(now);
    const currentEnd = new Date(now.getFullYear() + 1, 0, 1);
    const prevStart = new Date(now.getFullYear() - 1, 0, 1);
    const prevEnd = currentStart;

    const [currentRevenue, prevRevenue, currentMembers, prevMembers] = await Promise.all([
      prisma.payment.aggregate({
        where: {
          gymId: authUser.gymId,
          status: PaymentStatus.paid,
          paidAt: { gte: currentStart, lt: currentEnd },
        },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: {
          gymId: authUser.gymId,
          status: PaymentStatus.paid,
          paidAt: { gte: prevStart, lt: prevEnd },
        },
        _sum: { amount: true },
      }),
      prisma.user.count({
        where: {
          gymId: authUser.gymId,
          role: 'trainee',
          joinDate: { gte: currentStart, lt: currentEnd },
        },
      }),
      prisma.user.count({
        where: {
          gymId: authUser.gymId,
          role: 'trainee',
          joinDate: { gte: prevStart, lt: prevEnd },
        },
      }),
    ]);

    const currentRevenueValue = currentRevenue._sum.amount ?? 0;
    const previousRevenueValue = prevRevenue._sum.amount ?? 0;

    sendSuccess(res, {
      revenue: {
        current: Number(currentRevenueValue.toFixed(2)),
        previous: Number(previousRevenueValue.toFixed(2)),
        changePct: previousRevenueValue
          ? Number((((currentRevenueValue - previousRevenueValue) / previousRevenueValue) * 100).toFixed(2))
          : 0,
      },
      newMembers: {
        current: currentMembers,
        previous: prevMembers,
        changePct: prevMembers ? Number((((currentMembers - prevMembers) / prevMembers) * 100).toFixed(2)) : 0,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/alerts', async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);

    const [monthlyCompare, ghosts, expiringSoon, activeSubs, gym] = await Promise.all([
      (async () => {
        const now = new Date();
        const currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const prevEnd = currentStart;

        const [current, previous] = await Promise.all([
          prisma.payment.aggregate({
            where: {
              gymId: authUser.gymId,
              status: PaymentStatus.paid,
              paidAt: { gte: currentStart, lt: currentEnd },
            },
            _sum: { amount: true },
          }),
          prisma.payment.aggregate({
            where: {
              gymId: authUser.gymId,
              status: PaymentStatus.paid,
              paidAt: { gte: prevStart, lt: prevEnd },
            },
            _sum: { amount: true },
          }),
        ]);

        return {
          current: current._sum.amount ?? 0,
          previous: previous._sum.amount ?? 0,
        };
      })(),
      (async () => {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 14);

        const active = await prisma.subscription.findMany({
          where: { gymId: authUser.gymId, status: SubscriptionStatus.active },
          select: { userId: true },
        });

        const userIds = Array.from(new Set(active.map((item) => item.userId)));
        const recent = await prisma.attendance.findMany({
          where: {
            gymId: authUser.gymId,
            userId: { in: userIds },
            checkInTime: { gte: cutoff },
          },
          select: { userId: true },
          distinct: ['userId'],
        });

        return userIds.length - recent.length;
      })(),
      prisma.subscription.count({
        where: {
          gymId: authUser.gymId,
          status: SubscriptionStatus.active,
          endDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.subscription.count({ where: { gymId: authUser.gymId, status: SubscriptionStatus.active } }),
      prisma.gym.findUnique({ where: { id: authUser.gymId }, select: { maxCapacity: true } }),
    ]);

    const alerts: Array<{ type: string; severity: 'info' | 'warning' | 'critical'; message: string }> = [];

    if (monthlyCompare.previous > 0) {
      const dropPct = ((monthlyCompare.previous - monthlyCompare.current) / monthlyCompare.previous) * 100;
      if (dropPct > 15) {
        alerts.push({
          type: 'revenue_dip',
          severity: 'warning',
          message: `Revenue dropped by ${dropPct.toFixed(1)}% vs last month`,
        });
      }
    }

    if (ghosts >= 10) {
      alerts.push({
        type: 'ghost_members',
        severity: 'warning',
        message: `${ghosts} active members have not visited in 14+ days`,
      });
    }

    if (expiringSoon >= 20) {
      alerts.push({
        type: 'expiry_wave',
        severity: 'critical',
        message: `${expiringSoon} memberships are expiring in the next 7 days`,
      });
    }

    if (gym?.maxCapacity) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(todayStart);
      todayEnd.setDate(todayEnd.getDate() + 1);

      const currentInside = await prisma.attendance.count({
        where: {
          gymId: authUser.gymId,
          checkInTime: { gte: todayStart, lt: todayEnd },
          checkOutTime: null,
        },
      });

      if (currentInside >= Math.ceil(gym.maxCapacity * 0.9)) {
        alerts.push({
          type: 'capacity_warning',
          severity: 'critical',
          message: `Current attendance is at ${Math.round((currentInside / gym.maxCapacity) * 100)}% of max capacity`,
        });
      }
    }

    if (activeSubs > 0 && activeSubs % 100 === 0) {
      alerts.push({
        type: 'growth_milestone',
        severity: 'info',
        message: `Congratulations, you reached ${activeSubs} active members`,
      });
    }

    sendSuccess(res, alerts);
  } catch (error) {
    next(error);
  }
});

export default router;
