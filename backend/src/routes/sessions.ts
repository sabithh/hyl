import { SessionStatus } from '@prisma/client';
import { Router } from 'express';
import prisma from '../config/database';
import { authenticate } from '../middleware/auth';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/errors';
import { sendCreated, sendSuccess } from '../utils/response';
import { getAuthUser, getPagination, parseDateOrThrow } from '../utils/request';

const router = Router();

router.use(authenticate);

router.post('/book', async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);

    if (authUser.role !== 'trainee') {
      throw new ForbiddenError('Only trainees can book sessions');
    }

    const { trainerId, scheduleId, date, notes } = req.body;

    if (!trainerId || !scheduleId || !date) {
      throw new BadRequestError('trainerId, scheduleId and date are required');
    }

    const bookingDate = parseDateOrThrow(date, 'date');

    const schedule = await prisma.trainerSchedule.findFirst({
      where: {
        id: scheduleId,
        trainerId,
        gymId: authUser.gymId,
        isAvailable: true,
      },
      select: { id: true },
    });

    if (!schedule) {
      throw new NotFoundError('Schedule slot not found or unavailable');
    }

    const existing = await prisma.sessionBooking.findFirst({
      where: {
        scheduleId,
        date: bookingDate,
      },
      select: { id: true },
    });

    if (existing) {
      throw new BadRequestError('This slot is already booked for the selected date');
    }

    const booking = await prisma.sessionBooking.create({
      data: {
        gymId: authUser.gymId,
        traineeId: authUser.userId,
        trainerId,
        scheduleId,
        date: bookingDate,
        notes,
      },
      include: {
        trainer: { select: { id: true, name: true, email: true } },
        trainee: { select: { id: true, name: true, email: true } },
        schedule: true,
      },
    });

    sendCreated(res, booking, 'Session booked successfully');
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const { page, limit, skip } = getPagination(req);

    const status = typeof req.query.status === 'string' ? (req.query.status as SessionStatus) : undefined;

    const where: any = {
      gymId: authUser.gymId,
      ...(status ? { status } : {}),
    };

    if (authUser.role === 'trainer') {
      where.trainerId = authUser.userId;
    }

    if (authUser.role === 'trainee') {
      where.traineeId = authUser.userId;
    }

    const [sessions, total] = await Promise.all([
      prisma.sessionBooking.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ date: 'asc' }, { createdAt: 'desc' }],
        include: {
          trainer: { select: { id: true, name: true } },
          trainee: { select: { id: true, name: true } },
          schedule: true,
        },
      }),
      prisma.sessionBooking.count({ where }),
    ]);

    sendSuccess(res, {
      sessions,
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

router.put('/:id', async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const sessionId = String(req.params.id);
    const { status, notes } = req.body;

    if (!status && notes === undefined) {
      throw new BadRequestError('At least one field is required to update');
    }

    const session = await prisma.sessionBooking.findFirst({
      where: {
        id: sessionId,
        gymId: authUser.gymId,
      },
      select: {
        id: true,
        trainerId: true,
        traineeId: true,
      },
    });

    if (!session) {
      throw new NotFoundError('Session not found');
    }

    if (authUser.role === 'trainer' && session.trainerId !== authUser.userId) {
      throw new ForbiddenError('You can only update your own sessions');
    }

    if (authUser.role === 'trainee' && session.traineeId !== authUser.userId) {
      throw new ForbiddenError('You can only update your own sessions');
    }

    const updated = await prisma.sessionBooking.update({
      where: { id: sessionId },
      data: {
        status: status as SessionStatus | undefined,
        notes,
      },
    });

    sendSuccess(res, updated, 'Session updated successfully');
  } catch (error) {
    next(error);
  }
});

export default router;

