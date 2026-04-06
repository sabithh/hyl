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
    const date = typeof req.query.date === 'string' ? req.query.date : undefined;

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
        throw new ForbiddenError('You can only view nutrition logs for your assigned trainees');
      }
    }

    const where: any = {
      userId,
    };

    if (date) {
      const dayStart = new Date(date);
      if (Number.isNaN(dayStart.getTime())) {
        throw new BadRequestError('date must be a valid date');
      }

      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      where.date = { gte: dayStart, lt: dayEnd };
    }

    const [logs, total] = await Promise.all([
      prisma.nutritionLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      }),
      prisma.nutritionLog.count({ where }),
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
      throw new ForbiddenError('Only trainees can log nutrition');
    }

    const { date, mealType, foodName, calories, proteinG, carbsG, fatG, quantity } = req.body;

    if (!date || !mealType || !foodName) {
      throw new BadRequestError('date, mealType and foodName are required');
    }

    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) {
      throw new BadRequestError('date must be valid');
    }

    const log = await prisma.nutritionLog.create({
      data: {
        userId: authUser.userId,
        date: parsedDate,
        mealType,
        foodName,
        calories: calories === undefined ? undefined : parseOptionalNumber(calories, 'calories'),
        proteinG: proteinG === undefined ? undefined : parseOptionalNumber(proteinG, 'proteinG'),
        carbsG: carbsG === undefined ? undefined : parseOptionalNumber(carbsG, 'carbsG'),
        fatG: fatG === undefined ? undefined : parseOptionalNumber(fatG, 'fatG'),
        quantity,
      },
    });

    sendCreated(res, log, 'Nutrition log added successfully');
  } catch (error) {
    next(error);
  }
});

router.get('/summary', async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const requestedUserId = typeof req.query.userId === 'string' ? req.query.userId : undefined;
    const days = Number(req.query.days ?? 7);

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
        throw new ForbiddenError('You can only view summary for your assigned trainees');
      }
    }

    const from = new Date();
    from.setDate(from.getDate() - (Number.isNaN(days) ? 7 : days));

    const logs = await prisma.nutritionLog.findMany({
      where: {
        userId,
        date: { gte: from },
      },
      select: {
        date: true,
        calories: true,
        proteinG: true,
        carbsG: true,
        fatG: true,
      },
    });

    const summary = logs.reduce(
      (acc, log) => {
        acc.totalEntries += 1;
        acc.totalCalories += log.calories ?? 0;
        acc.totalProtein += log.proteinG ?? 0;
        acc.totalCarbs += log.carbsG ?? 0;
        acc.totalFat += log.fatG ?? 0;
        return acc;
      },
      {
        totalEntries: 0,
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
      }
    );

    const divisor = summary.totalEntries || 1;

    sendSuccess(res, {
      periodDays: Number.isNaN(days) ? 7 : days,
      totals: summary,
      averages: {
        dailyCalories: Number((summary.totalCalories / divisor).toFixed(2)),
        dailyProtein: Number((summary.totalProtein / divisor).toFixed(2)),
        dailyCarbs: Number((summary.totalCarbs / divisor).toFixed(2)),
        dailyFat: Number((summary.totalFat / divisor).toFixed(2)),
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
