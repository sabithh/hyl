import { Router } from 'express';
import prisma from '../config/database';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { createAuditLog } from '../services/auditLog';
import { ForbiddenError, NotFoundError } from '../utils/errors';
import { sendCreated, sendSuccess } from '../utils/response';
import { getAuthUser, getPagination, optionalDate, parseOptionalNumber, toBoolean } from '../utils/request';

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

    const [dietPlans, total] = await Promise.all([
      prisma.dietPlan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          trainer: {
            select: {
              id: true,
              name: true,
            },
          },
          trainee: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.dietPlan.count({ where }),
    ]);

    sendSuccess(res, {
      dietPlans,
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
    const {
      traineeId,
      title,
      description,
      meals,
      dailyCaloriesTarget,
      dailyProteinTargetG,
      startDate,
      endDate,
      isActive,
    } = req.body;

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
      throw new ForbiddenError('You can only create diet plans for your assigned trainees');
    }

    const dietPlan = await prisma.dietPlan.create({
      data: {
        gymId: authUser.gymId,
        trainerId,
        traineeId,
        title,
        description,
        meals,
        dailyCaloriesTarget: parseOptionalNumber(dailyCaloriesTarget, 'dailyCaloriesTarget'),
        dailyProteinTargetG: parseOptionalNumber(dailyProteinTargetG, 'dailyProteinTargetG'),
        startDate: optionalDate(startDate, 'startDate'),
        endDate: optionalDate(endDate, 'endDate'),
        isActive: isActive === undefined ? true : toBoolean(isActive),
      },
    });

    await createAuditLog({
      gymId: authUser.gymId,
      userId: authUser.userId,
      action: 'diet_plan.created',
      entityType: 'diet_plan',
      entityId: dietPlan.id,
      details: { trainerId, traineeId, title },
      ipAddress: req.ip,
    });

    sendCreated(res, dietPlan, 'Diet plan created successfully');
  } catch (error) {
    next(error);
  }
});

router.put('/:id', requireRole('trainer', 'owner'), async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const planId = String(req.params.id);

    const existing = await prisma.dietPlan.findFirst({
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
      throw new NotFoundError('Diet plan not found');
    }

    if (authUser.role === 'trainer' && existing.trainerId !== authUser.userId) {
      throw new ForbiddenError('You can only update your own diet plans');
    }

    const updated = await prisma.dietPlan.update({
      where: { id: planId },
      data: {
        title: req.body.title,
        description: req.body.description,
        meals: req.body.meals,
        dailyCaloriesTarget:
          req.body.dailyCaloriesTarget === undefined
            ? undefined
            : parseOptionalNumber(req.body.dailyCaloriesTarget, 'dailyCaloriesTarget'),
        dailyProteinTargetG:
          req.body.dailyProteinTargetG === undefined
            ? undefined
            : parseOptionalNumber(req.body.dailyProteinTargetG, 'dailyProteinTargetG'),
        startDate: req.body.startDate === undefined ? undefined : optionalDate(req.body.startDate, 'startDate'),
        endDate: req.body.endDate === undefined ? undefined : optionalDate(req.body.endDate, 'endDate'),
        isActive: req.body.isActive === undefined ? undefined : toBoolean(req.body.isActive),
      },
    });

    await createAuditLog({
      gymId: authUser.gymId,
      userId: authUser.userId,
      action: 'diet_plan.updated',
      entityType: 'diet_plan',
      entityId: planId,
      details: { updatedFields: Object.keys(req.body ?? {}) },
      ipAddress: req.ip,
    });

    sendSuccess(res, updated, 'Diet plan updated successfully');
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireRole('trainer', 'owner'), async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const planId = String(req.params.id);

    const existing = await prisma.dietPlan.findFirst({
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
      throw new NotFoundError('Diet plan not found');
    }

    if (authUser.role === 'trainer' && existing.trainerId !== authUser.userId) {
      throw new ForbiddenError('You can only delete your own diet plans');
    }

    await prisma.dietPlan.update({
      where: { id: planId },
      data: { isActive: false },
    });

    await createAuditLog({
      gymId: authUser.gymId,
      userId: authUser.userId,
      action: 'diet_plan.deactivated',
      entityType: 'diet_plan',
      entityId: planId,
      ipAddress: req.ip,
    });

    sendSuccess(res, null, 'Diet plan deactivated successfully');
  } catch (error) {
    next(error);
  }
});

export default router;

