import { AttendanceSource } from '@prisma/client';
import { Router } from 'express';
import prisma from '../config/database';
import { authenticate } from '../middleware/auth';
import { ownerOnly } from '../middleware/rbac';
import { createAuditLog } from '../services/auditLog';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/errors';
import { sendCreated, sendSuccess } from '../utils/response';
import { getAuthUser, getPagination } from '../utils/request';

const router = Router();

router.use(authenticate);

router.post('/check-in', async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const requestedUserId = req.body.userId as string | undefined;

    const userId = authUser.role === 'trainee' ? authUser.userId : (requestedUserId ?? authUser.userId);

    if (!userId) {
      throw new BadRequestError('userId is required');
    }

    if (authUser.role === 'trainer' && userId !== authUser.userId) {
      const trainee = await prisma.user.findFirst({
        where: {
          id: userId,
          gymId: authUser.gymId,
          assignedTrainerId: authUser.userId,
        },
        select: { id: true },
      });

      if (!trainee) {
        throw new ForbiddenError('You can only check-in your assigned trainees');
      }
    }

    const user = await prisma.user.findFirst({
      where: { id: userId, gymId: authUser.gymId },
      select: { id: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new NotFoundError('Member not found or inactive');
    }

    const openAttendance = await prisma.attendance.findFirst({
      where: {
        gymId: authUser.gymId,
        userId,
        checkOutTime: null,
      },
      orderBy: { checkInTime: 'desc' },
      select: { id: true },
    });

    if (openAttendance) {
      throw new BadRequestError('Member is already checked in');
    }

    const attendance = await prisma.attendance.create({
      data: {
        gymId: authUser.gymId,
        userId,
        source: (req.body.source as AttendanceSource | undefined) ?? AttendanceSource.app_qr,
        checkInTime: new Date(),
      },
    });

    await createAuditLog({
      gymId: authUser.gymId,
      userId: authUser.userId,
      action: 'attendance.check_in',
      entityType: 'attendance',
      entityId: attendance.id,
      details: { memberId: userId, source: attendance.source },
      ipAddress: req.ip,
    });

    sendCreated(res, attendance, 'Check-in recorded successfully');
  } catch (error) {
    next(error);
  }
});

router.post('/check-out', async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const requestedUserId = req.body.userId as string | undefined;

    const userId = authUser.role === 'trainee' ? authUser.userId : (requestedUserId ?? authUser.userId);

    if (!userId) {
      throw new BadRequestError('userId is required');
    }

    const openAttendance = await prisma.attendance.findFirst({
      where: {
        gymId: authUser.gymId,
        userId,
        checkOutTime: null,
      },
      orderBy: { checkInTime: 'desc' },
    });

    if (!openAttendance) {
      throw new NotFoundError('No active check-in found for this member');
    }

    if (authUser.role === 'trainee' && openAttendance.userId !== authUser.userId) {
      throw new ForbiddenError('You can only check-out yourself');
    }

    if (authUser.role === 'trainer' && openAttendance.userId !== authUser.userId) {
      const trainee = await prisma.user.findFirst({
        where: {
          id: openAttendance.userId,
          gymId: authUser.gymId,
          assignedTrainerId: authUser.userId,
        },
        select: { id: true },
      });

      if (!trainee) {
        throw new ForbiddenError('You can only check-out your assigned trainees');
      }
    }

    const checkOutTime = new Date();
    const durationMinutes = Math.max(
      1,
      Math.floor((checkOutTime.getTime() - openAttendance.checkInTime.getTime()) / (1000 * 60))
    );

    const attendance = await prisma.attendance.update({
      where: { id: openAttendance.id },
      data: {
        checkOutTime,
        durationMinutes,
      },
    });

    await createAuditLog({
      gymId: authUser.gymId,
      userId: authUser.userId,
      action: 'attendance.check_out',
      entityType: 'attendance',
      entityId: attendance.id,
      details: { memberId: userId, durationMinutes },
      ipAddress: req.ip,
    });

    sendSuccess(res, attendance, 'Check-out recorded successfully');
  } catch (error) {
    next(error);
  }
});

router.get('/member/:id', async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const memberId = String(req.params.id);
    const { page, limit, skip } = getPagination(req);

    if (authUser.role === 'trainee' && memberId !== authUser.userId) {
      throw new ForbiddenError('You can only view your own attendance');
    }

    if (authUser.role === 'trainer' && memberId !== authUser.userId) {
      const trainee = await prisma.user.findFirst({
        where: {
          id: memberId,
          gymId: authUser.gymId,
          assignedTrainerId: authUser.userId,
        },
        select: { id: true },
      });

      if (!trainee) {
        throw new ForbiddenError('You can only view attendance of your assigned trainees');
      }
    }

    const where = {
      gymId: authUser.gymId,
      userId: memberId,
    };

    const [records, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        skip,
        take: limit,
        orderBy: { checkInTime: 'desc' },
      }),
      prisma.attendance.count({ where }),
    ]);

    sendSuccess(res, {
      records,
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

router.get('/today', ownerOnly, async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const [totalCheckIns, currentlyInside, todayRecords] = await Promise.all([
      prisma.attendance.count({
        where: {
          gymId: authUser.gymId,
          checkInTime: {
            gte: startOfDay,
            lt: endOfDay,
          },
        },
      }),
      prisma.attendance.count({
        where: {
          gymId: authUser.gymId,
          checkInTime: { gte: startOfDay, lt: endOfDay },
          checkOutTime: null,
        },
      }),
      prisma.attendance.findMany({
        where: {
          gymId: authUser.gymId,
          checkInTime: {
            gte: startOfDay,
            lt: endOfDay,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: { checkInTime: 'desc' },
      }),
    ]);

    sendSuccess(res, {
      totalCheckIns,
      currentlyInside,
      records: todayRecords,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/analytics', ownerOnly, async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const records = await prisma.attendance.findMany({
      where: {
        gymId: authUser.gymId,
        checkInTime: { gte: last30Days },
      },
      select: {
        checkInTime: true,
        durationMinutes: true,
      },
    });

    const byHour: Record<string, number> = {};
    const byWeekday: Record<string, number> = {};
    let totalDuration = 0;
    let durationCount = 0;

    for (const record of records) {
      const hour = record.checkInTime.getHours();
      const weekday = record.checkInTime.toLocaleDateString('en-US', { weekday: 'long' });
      const hourKey = `${hour.toString().padStart(2, '0')}:00`;

      byHour[hourKey] = (byHour[hourKey] ?? 0) + 1;
      byWeekday[weekday] = (byWeekday[weekday] ?? 0) + 1;

      if (record.durationMinutes) {
        totalDuration += record.durationMinutes;
        durationCount += 1;
      }
    }

    sendSuccess(res, {
      totalRecords: records.length,
      averageSessionDuration: durationCount ? Number((totalDuration / durationCount).toFixed(2)) : 0,
      peakHours: Object.entries(byHour)
        .map(([hour, count]) => ({ hour, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8),
      weekdayTrend: Object.entries(byWeekday).map(([day, count]) => ({ day, count })),
    });
  } catch (error) {
    next(error);
  }
});

export default router;

