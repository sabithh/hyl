import { Router } from 'express';
import prisma from '../config/database';
import { authenticate } from '../middleware/auth';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/errors';
import { sendCreated, sendSuccess } from '../utils/response';
import { getAuthUser, getPagination, parseNumber } from '../utils/request';

const router = Router();

router.use(authenticate);

router.post('/', async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);

    if (authUser.role !== 'trainee') {
      throw new ForbiddenError('Only trainees can submit feedback');
    }

    const { trainerId, rating, review } = req.body;

    if (!trainerId || rating === undefined) {
      throw new BadRequestError('trainerId and rating are required');
    }

    const parsedRating = parseNumber(rating, 'rating');
    if (parsedRating < 1 || parsedRating > 5) {
      throw new BadRequestError('rating must be between 1 and 5');
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

    const feedback = await prisma.feedbackRating.create({
      data: {
        gymId: authUser.gymId,
        traineeId: authUser.userId,
        trainerId,
        rating: parsedRating,
        review,
      },
      include: {
        trainee: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const stats = await prisma.feedbackRating.aggregate({
      where: {
        trainerId,
      },
      _avg: { rating: true },
      _count: { id: true },
    });

    await prisma.trainerProfile.upsert({
      where: { userId: trainerId },
      update: {
        ratingAvg: stats._avg.rating ?? 0,
        totalReviews: stats._count.id,
      },
      create: {
        userId: trainerId,
        ratingAvg: stats._avg.rating ?? 0,
        totalReviews: stats._count.id,
      },
    });

    sendCreated(res, feedback, 'Feedback submitted successfully');
  } catch (error) {
    next(error);
  }
});

router.get('/trainer/:id', async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const trainerId = String(req.params.id);
    const { page, limit, skip } = getPagination(req);

    const trainer = await prisma.user.findFirst({
      where: {
        id: trainerId,
        gymId: authUser.gymId,
        role: 'trainer',
      },
      select: {
        id: true,
        name: true,
        trainerProfile: true,
      },
    });

    if (!trainer) {
      throw new NotFoundError('Trainer not found');
    }

    const where = {
      gymId: authUser.gymId,
      trainerId,
    };

    const [reviews, total] = await Promise.all([
      prisma.feedbackRating.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          trainee: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.feedbackRating.count({ where }),
    ]);

    sendSuccess(res, {
      trainer,
      reviews,
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

router.get('/my-reviews', async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);

    if (authUser.role !== 'trainee') {
      throw new ForbiddenError('Only trainees can access this endpoint');
    }

    const reviews = await prisma.feedbackRating.findMany({
      where: {
        gymId: authUser.gymId,
        traineeId: authUser.userId,
      },
      include: {
        trainer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    sendSuccess(res, reviews);
  } catch (error) {
    next(error);
  }
});

export default router;

