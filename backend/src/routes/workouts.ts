import { DayOfWeek } from '@prisma/client';
import { Router } from 'express';
import prisma from '../config/database';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { createAuditLog } from '../services/auditLog';
import { ForbiddenError, NotFoundError } from '../utils/errors';
import { sendCreated, sendSuccess } from '../utils/response';
import { getAuthUser, getPagination, optionalDate, parseNumber, toBoolean } from '../utils/request';

const router = Router();

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const { page, limit, skip } = getPagination(req);

    const where: any = {
      gymId: authUser.gymId,
    };

    if (authUser.role === 'trainer') {
      where.trainerId = authUser.userId;
    }

    if (authUser.role === 'trainee') {
      where.traineeId = authUser.userId;
    }

    const [plans, total] = await Promise.all([
      prisma.workoutPlan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          trainer: {
            select: { id: true, name: true },
          },
          trainee: {
            select: { id: true, name: true },
          },
          exercises: {
            include: {
              exercise: true,
            },
            orderBy: [{ dayOfWeek: 'asc' }, { orderIndex: 'asc' }],
          },
        },
      }),
      prisma.workoutPlan.count({ where }),
    ]);

    sendSuccess(res, {
      plans,
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

router.post('/', requireRole('trainer', 'owner'), async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const trainerId = authUser.role === 'trainer' ? authUser.userId : req.body.trainerId;
    const { traineeId, title, description, startDate, endDate, isActive } = req.body;

    if (!trainerId || !traineeId || !title) {
      throw new NotFoundError('trainerId, traineeId and title are required');
    }

    const [trainer, trainee] = await Promise.all([
      prisma.user.findFirst({ where: { id: trainerId, gymId: authUser.gymId, role: 'trainer' } }),
      prisma.user.findFirst({ where: { id: traineeId, gymId: authUser.gymId, role: 'trainee' } }),
    ]);

    if (!trainer) {
      throw new NotFoundError('Trainer not found');
    }

    if (!trainee) {
      throw new NotFoundError('Trainee not found');
    }

    if (authUser.role === 'trainer' && trainee.assignedTrainerId !== authUser.userId) {
      throw new ForbiddenError('You can only create workout plans for your assigned trainees');
    }

    const plan = await prisma.workoutPlan.create({
      data: {
        gymId: authUser.gymId,
        trainerId,
        traineeId,
        title,
        description,
        startDate: optionalDate(startDate, 'startDate'),
        endDate: optionalDate(endDate, 'endDate'),
        isActive: isActive === undefined ? true : toBoolean(isActive),
      },
      include: {
        trainer: { select: { id: true, name: true } },
        trainee: { select: { id: true, name: true } },
      },
    });

    await createAuditLog({
      gymId: authUser.gymId,
      userId: authUser.userId,
      action: 'workout_plan.created',
      entityType: 'workout_plan',
      entityId: plan.id,
      details: { traineeId, trainerId, title },
      ipAddress: req.ip,
    });

    sendCreated(res, plan, 'Workout plan created successfully');
  } catch (error) {
    next(error);
  }
});

router.put('/:id', requireRole('trainer', 'owner'), async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const planId = String(req.params.id);

    const existing = await prisma.workoutPlan.findFirst({
      where: {
        id: planId,
        gymId: authUser.gymId,
      },
      select: {
        id: true,
        trainerId: true,
      },
    });

    if (!existing) {
      throw new NotFoundError('Workout plan not found');
    }

    if (authUser.role === 'trainer' && existing.trainerId !== authUser.userId) {
      throw new ForbiddenError('You can only update your own workout plans');
    }

    const updated = await prisma.workoutPlan.update({
      where: { id: planId },
      data: {
        title: req.body.title,
        description: req.body.description,
        startDate: req.body.startDate === undefined ? undefined : optionalDate(req.body.startDate, 'startDate'),
        endDate: req.body.endDate === undefined ? undefined : optionalDate(req.body.endDate, 'endDate'),
        isActive: req.body.isActive === undefined ? undefined : toBoolean(req.body.isActive),
      },
    });

    await createAuditLog({
      gymId: authUser.gymId,
      userId: authUser.userId,
      action: 'workout_plan.updated',
      entityType: 'workout_plan',
      entityId: planId,
      details: { updatedFields: Object.keys(req.body ?? {}) },
      ipAddress: req.ip,
    });

    sendSuccess(res, updated, 'Workout plan updated successfully');
  } catch (error) {
    next(error);
  }
});

router.get('/:id/exercises', async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const planId = String(req.params.id);

    const plan = await prisma.workoutPlan.findFirst({
      where: { id: planId, gymId: authUser.gymId },
      select: {
        id: true,
        trainerId: true,
        traineeId: true,
      },
    });

    if (!plan) {
      throw new NotFoundError('Workout plan not found');
    }

    if (authUser.role === 'trainer' && plan.trainerId !== authUser.userId) {
      throw new ForbiddenError('You can only view your own workout plans');
    }

    if (authUser.role === 'trainee' && plan.traineeId !== authUser.userId) {
      throw new ForbiddenError('You can only view your assigned workout plans');
    }

    const exercises = await prisma.workoutExercise.findMany({
      where: { workoutPlanId: planId },
      include: {
        exercise: true,
      },
      orderBy: [{ dayOfWeek: 'asc' }, { orderIndex: 'asc' }],
    });

    sendSuccess(res, exercises);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/exercises', requireRole('trainer', 'owner'), async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const planId = String(req.params.id);
    const { exerciseId, dayOfWeek, sets, reps, weight, restSeconds, notes, orderIndex } = req.body;

    if (!exerciseId || !dayOfWeek || sets === undefined || reps === undefined) {
      throw new NotFoundError('exerciseId, dayOfWeek, sets and reps are required');
    }

    const [plan, exercise] = await Promise.all([
      prisma.workoutPlan.findFirst({
        where: { id: planId, gymId: authUser.gymId },
        select: { id: true, trainerId: true },
      }),
      prisma.exercise.findFirst({
        where: { id: exerciseId, gymId: authUser.gymId },
        select: { id: true },
      }),
    ]);

    if (!plan) {
      throw new NotFoundError('Workout plan not found');
    }

    if (!exercise) {
      throw new NotFoundError('Exercise not found');
    }

    if (authUser.role === 'trainer' && plan.trainerId !== authUser.userId) {
      throw new ForbiddenError('You can only add exercises to your own workout plans');
    }

    const workoutExercise = await prisma.workoutExercise.create({
      data: {
        workoutPlanId: planId,
        exerciseId,
        dayOfWeek: dayOfWeek as DayOfWeek,
        sets: parseNumber(sets, 'sets'),
        reps: parseNumber(reps, 'reps'),
        weight: weight === undefined ? undefined : parseNumber(weight, 'weight'),
        restSeconds: restSeconds === undefined ? undefined : parseNumber(restSeconds, 'restSeconds'),
        notes,
        orderIndex: orderIndex === undefined ? 0 : parseNumber(orderIndex, 'orderIndex'),
      },
      include: {
        exercise: true,
      },
    });

    await createAuditLog({
      gymId: authUser.gymId,
      userId: authUser.userId,
      action: 'workout_exercise.added',
      entityType: 'workout_exercise',
      entityId: workoutExercise.id,
      details: {
        planId,
        exerciseId,
        dayOfWeek,
        sets: workoutExercise.sets,
        reps: workoutExercise.reps,
      },
      ipAddress: req.ip,
    });

    sendCreated(res, workoutExercise, 'Exercise added to workout plan');
  } catch (error) {
    next(error);
  }
});

export default router;

