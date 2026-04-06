import { Router } from 'express';
import prisma from '../config/database';
import { authenticate } from '../middleware/auth';
import { BadRequestError, ForbiddenError } from '../utils/errors';
import { sendCreated, sendSuccess } from '../utils/response';
import { getAuthUser, getPagination, parseOptionalNumber } from '../utils/request';

const router = Router();

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const { page, limit, skip } = getPagination(req);

    const requestedUserId = typeof req.query.userId === 'string' ? req.query.userId : undefined;
    const userId = authUser.role === 'trainee' ? authUser.userId : (requestedUserId ?? authUser.userId);

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
        throw new ForbiddenError('You can only view progress for your assigned trainees');
      }
    }

    const where = { userId };

    const [logs, total] = await Promise.all([
      prisma.progressLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      }),
      prisma.progressLog.count({ where }),
    ]);

    sendSuccess(res, {
      logs,
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

router.post('/', async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);

    if (authUser.role !== 'trainee') {
      throw new ForbiddenError('Only trainees can log progress');
    }

    const { date, weightKg, bodyFatPct, chestCm, waistCm, hipsCm, bicepsCm, thighsCm, photoUrl, notes } = req.body;

    if (!date) {
      throw new BadRequestError('date is required');
    }

    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) {
      throw new BadRequestError('date must be valid');
    }

    const log = await prisma.progressLog.create({
      data: {
        userId: authUser.userId,
        date: parsedDate,
        weightKg: parseOptionalNumber(weightKg, 'weightKg'),
        bodyFatPct: parseOptionalNumber(bodyFatPct, 'bodyFatPct'),
        chestCm: parseOptionalNumber(chestCm, 'chestCm'),
        waistCm: parseOptionalNumber(waistCm, 'waistCm'),
        hipsCm: parseOptionalNumber(hipsCm, 'hipsCm'),
        bicepsCm: parseOptionalNumber(bicepsCm, 'bicepsCm'),
        thighsCm: parseOptionalNumber(thighsCm, 'thighsCm'),
        photoUrl,
        notes,
      },
    });

    sendCreated(res, log, 'Progress log added successfully');
  } catch (error) {
    next(error);
  }
});

router.get('/chart', async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const requestedUserId = typeof req.query.userId === 'string' ? req.query.userId : undefined;
    const userId = authUser.role === 'trainee' ? authUser.userId : (requestedUserId ?? authUser.userId);

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
        throw new ForbiddenError('You can only view chart data for your assigned trainees');
      }
    }

    const logs = await prisma.progressLog.findMany({
      where: { userId },
      orderBy: { date: 'asc' },
      select: {
        date: true,
        weightKg: true,
        bodyFatPct: true,
        waistCm: true,
        chestCm: true,
        thighsCm: true,
      },
    });

    sendSuccess(res, logs);
  } catch (error) {
    next(error);
  }
});

export default router;
