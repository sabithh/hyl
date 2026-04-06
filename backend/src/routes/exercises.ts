import { Router } from 'express';
import prisma from '../config/database';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { createAuditLog } from '../services/auditLog';
import { NotFoundError } from '../utils/errors';
import { sendCreated, sendSuccess } from '../utils/response';
import { getAuthUser, getPagination, toBoolean } from '../utils/request';

const router = Router();

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const { page, limit, skip } = getPagination(req);
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const muscleGroup = typeof req.query.muscleGroup === 'string' ? req.query.muscleGroup : undefined;

    const where = {
      gymId: authUser.gymId,
      ...(muscleGroup ? { muscleGroup } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { muscleGroup: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [exercises, total] = await Promise.all([
      prisma.exercise.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      prisma.exercise.count({ where }),
    ]);

    sendSuccess(res, {
      exercises,
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

router.post('/', requireRole('owner', 'trainer'), async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const { name, muscleGroup, equipment, description, imageUrl, videoUrl, isCustom } = req.body;

    if (!name || !muscleGroup) {
      throw new NotFoundError('name and muscleGroup are required');
    }

    const exercise = await prisma.exercise.create({
      data: {
        gymId: authUser.gymId,
        name,
        muscleGroup,
        equipment,
        description,
        imageUrl,
        videoUrl,
        isCustom: isCustom === undefined ? true : toBoolean(isCustom),
      },
    });

    await createAuditLog({
      gymId: authUser.gymId,
      userId: authUser.userId,
      action: 'exercise.created',
      entityType: 'exercise',
      entityId: exercise.id,
      details: { name: exercise.name, muscleGroup: exercise.muscleGroup },
      ipAddress: req.ip,
    });

    sendCreated(res, exercise, 'Exercise created successfully');
  } catch (error) {
    next(error);
  }
});

router.put('/:id', requireRole('owner', 'trainer'), async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const exerciseId = String(req.params.id);

    const existing = await prisma.exercise.findFirst({
      where: { id: exerciseId, gymId: authUser.gymId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundError('Exercise not found');
    }

    const updated = await prisma.exercise.update({
      where: { id: exerciseId },
      data: {
        name: req.body.name,
        muscleGroup: req.body.muscleGroup,
        equipment: req.body.equipment,
        description: req.body.description,
        imageUrl: req.body.imageUrl,
        videoUrl: req.body.videoUrl,
        isCustom: req.body.isCustom === undefined ? undefined : toBoolean(req.body.isCustom),
      },
    });

    await createAuditLog({
      gymId: authUser.gymId,
      userId: authUser.userId,
      action: 'exercise.updated',
      entityType: 'exercise',
      entityId: exerciseId,
      details: { updatedFields: Object.keys(req.body ?? {}) },
      ipAddress: req.ip,
    });

    sendSuccess(res, updated, 'Exercise updated successfully');
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireRole('owner', 'trainer'), async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const exerciseId = String(req.params.id);

    const existing = await prisma.exercise.findFirst({
      where: { id: exerciseId, gymId: authUser.gymId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundError('Exercise not found');
    }

    await prisma.exercise.delete({ where: { id: exerciseId } });

    await createAuditLog({
      gymId: authUser.gymId,
      userId: authUser.userId,
      action: 'exercise.deleted',
      entityType: 'exercise',
      entityId: exerciseId,
      ipAddress: req.ip,
    });

    sendSuccess(res, null, 'Exercise deleted successfully');
  } catch (error) {
    next(error);
  }
});

export default router;

