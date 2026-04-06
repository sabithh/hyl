import { DayOfWeek } from '@prisma/client';
import { Router } from 'express';
import prisma from '../config/database';
import { authenticate } from '../middleware/auth';
import { ownerOnly } from '../middleware/rbac';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/errors';
import { sendCreated, sendSuccess } from '../utils/response';
import { getAuthUser, getPagination, parseDateOrThrow, parseNumber, toBoolean } from '../utils/request';

const router = Router();

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const { page, limit, skip } = getPagination(req);

    const where = {
      gymId: authUser.gymId,
      ...(req.query.includeInactive === 'true' ? {} : { isActive: true }),
    };

    const [classes, total] = await Promise.all([
      prisma.groupClass.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        include: {
          trainer: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              enrollments: true,
            },
          },
        },
      }),
      prisma.groupClass.count({ where }),
    ]);

    sendSuccess(res, {
      classes,
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
      trainerId,
      name,
      description,
      dayOfWeek,
      startTime,
      endTime,
      maxParticipants,
      isRecurring,
      isActive,
    } = req.body;

    if (!trainerId || !name || !dayOfWeek || !startTime || !endTime || maxParticipants === undefined) {
      throw new BadRequestError('trainerId, name, dayOfWeek, startTime, endTime and maxParticipants are required');
    }

    const trainer = await prisma.user.findFirst({
      where: {
        id: trainerId,
        gymId: authUser.gymId,
        role: 'trainer',
      },
      select: { id: true },
    });

    if (!trainer) {
      throw new NotFoundError('Trainer not found');
    }

    const newClass = await prisma.groupClass.create({
      data: {
        gymId: authUser.gymId,
        trainerId,
        name,
        description,
        dayOfWeek: dayOfWeek as DayOfWeek,
        startTime,
        endTime,
        maxParticipants: parseNumber(maxParticipants, 'maxParticipants'),
        isRecurring: isRecurring === undefined ? true : toBoolean(isRecurring),
        isActive: isActive === undefined ? true : toBoolean(isActive),
      },
    });

    sendCreated(res, newClass, 'Group class created successfully');
  } catch (error) {
    next(error);
  }
});

router.put('/:id', ownerOnly, async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const classId = String(req.params.id);

    const existing = await prisma.groupClass.findFirst({
      where: {
        id: classId,
        gymId: authUser.gymId,
      },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundError('Class not found');
    }

    const updated = await prisma.groupClass.update({
      where: { id: classId },
      data: {
        trainerId: req.body.trainerId,
        name: req.body.name,
        description: req.body.description,
        dayOfWeek: req.body.dayOfWeek as DayOfWeek | undefined,
        startTime: req.body.startTime,
        endTime: req.body.endTime,
        maxParticipants:
          req.body.maxParticipants === undefined
            ? undefined
            : parseNumber(req.body.maxParticipants, 'maxParticipants'),
        isRecurring: req.body.isRecurring === undefined ? undefined : toBoolean(req.body.isRecurring),
        isActive: req.body.isActive === undefined ? undefined : toBoolean(req.body.isActive),
      },
    });

    sendSuccess(res, updated, 'Class updated successfully');
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', ownerOnly, async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const classId = String(req.params.id);

    const existing = await prisma.groupClass.findFirst({
      where: {
        id: classId,
        gymId: authUser.gymId,
      },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundError('Class not found');
    }

    await prisma.groupClass.update({
      where: { id: classId },
      data: { isActive: false },
    });

    sendSuccess(res, null, 'Class deactivated successfully');
  } catch (error) {
    next(error);
  }
});

router.post('/:id/enroll', async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);

    if (authUser.role !== 'trainee') {
      throw new ForbiddenError('Only trainees can enroll in classes');
    }

    const classId = String(req.params.id);
    const date = parseDateOrThrow(req.body.date, 'date');

    const classData = await prisma.groupClass.findFirst({
      where: {
        id: classId,
        gymId: authUser.gymId,
        isActive: true,
      },
      include: {
        _count: {
          select: {
            enrollments: {
              where: {
                date,
                attendanceStatus: 'enrolled',
              },
            },
          },
        },
      },
    });

    if (!classData) {
      throw new NotFoundError('Class not found');
    }

    if (classData._count.enrollments >= classData.maxParticipants) {
      throw new BadRequestError('Class is full for selected date');
    }

    const enrollment = await prisma.classEnrollment.upsert({
      where: {
        classId_userId_date: {
          classId,
          userId: authUser.userId,
          date,
        },
      },
      update: {
        attendanceStatus: 'enrolled',
      },
      create: {
        classId,
        userId: authUser.userId,
        date,
        attendanceStatus: 'enrolled',
      },
    });

    sendCreated(res, enrollment, 'Enrolled in class successfully');
  } catch (error) {
    next(error);
  }
});

router.delete('/:id/enroll', async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);

    if (authUser.role !== 'trainee') {
      throw new ForbiddenError('Only trainees can cancel enrollment');
    }

    const classId = String(req.params.id);
    const date = parseDateOrThrow(req.body.date, 'date');

    const enrollment = await prisma.classEnrollment.findFirst({
      where: {
        classId,
        userId: authUser.userId,
        date,
      },
      select: { id: true },
    });

    if (!enrollment) {
      throw new NotFoundError('Enrollment not found');
    }

    await prisma.classEnrollment.update({
      where: { id: enrollment.id },
      data: {
        attendanceStatus: 'cancelled',
      },
    });

    sendSuccess(res, null, 'Enrollment cancelled');
  } catch (error) {
    next(error);
  }
});

router.get('/:id/participants', async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const classId = String(req.params.id);
    const date = parseDateOrThrow(req.query.date, 'date');

    const classData = await prisma.groupClass.findFirst({
      where: {
        id: classId,
        gymId: authUser.gymId,
      },
      select: {
        id: true,
        trainerId: true,
      },
    });

    if (!classData) {
      throw new NotFoundError('Class not found');
    }

    if (authUser.role === 'trainer' && classData.trainerId !== authUser.userId) {
      throw new ForbiddenError('You can only view participants for your classes');
    }

    if (authUser.role === 'trainee') {
      throw new ForbiddenError('Trainees cannot view participant list');
    }

    const participants = await prisma.classEnrollment.findMany({
      where: {
        classId,
        date,
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
    });

    sendSuccess(res, participants);
  } catch (error) {
    next(error);
  }
});

export default router;

