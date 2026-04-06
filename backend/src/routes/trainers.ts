import { DayOfWeek } from '@prisma/client';
import { Router } from 'express';
import prisma from '../config/database';
import { authenticate } from '../middleware/auth';
import { ownerOnly } from '../middleware/rbac';
import { createAuditLog } from '../services/auditLog';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/errors';
import { sendSuccess } from '../utils/response';
import { getAuthUser, toBoolean } from '../utils/request';

const router = Router();

router.use(authenticate);

const ensureTrainerAccess = async (authUser: { userId: string; gymId: string; role: string }, trainerId: string) => {
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

  if (authUser.role === 'trainer' && authUser.userId !== trainerId) {
    throw new ForbiddenError('You can only access your own trainer profile');
  }
};

router.get('/:id/profile', async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const trainerId = String(req.params.id);

    await ensureTrainerAccess(authUser, trainerId);

    const profile = await prisma.trainerProfile.findFirst({
      where: { userId: trainerId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            profilePicUrl: true,
          },
        },
      },
    });

    sendSuccess(res, profile);
  } catch (error) {
    next(error);
  }
});

router.put('/:id/profile', async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const trainerId = String(req.params.id);

    await ensureTrainerAccess(authUser, trainerId);

    const profile = await prisma.trainerProfile.upsert({
      where: {
        userId: trainerId,
      },
      update: {
        specializations: req.body.specializations,
        certifications: req.body.certifications,
        experienceYears: req.body.experienceYears,
        bio: req.body.bio,
        maxTrainees: req.body.maxTrainees,
        commissionPct: req.body.commissionPct,
      },
      create: {
        userId: trainerId,
        specializations: req.body.specializations,
        certifications: req.body.certifications,
        experienceYears: req.body.experienceYears,
        bio: req.body.bio,
        maxTrainees: req.body.maxTrainees,
        commissionPct: req.body.commissionPct,
      },
    });

    await createAuditLog({
      gymId: authUser.gymId,
      userId: authUser.userId,
      action: 'trainer.profile_updated',
      entityType: 'trainer_profile',
      entityId: profile.id,
      details: { trainerId },
      ipAddress: req.ip,
    });

    sendSuccess(res, profile, 'Trainer profile updated successfully');
  } catch (error) {
    next(error);
  }
});

router.get('/:id/schedule', async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const trainerId = String(req.params.id);

    await ensureTrainerAccess(authUser, trainerId);

    const schedule = await prisma.trainerSchedule.findMany({
      where: {
        trainerId,
        gymId: authUser.gymId,
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    sendSuccess(res, schedule);
  } catch (error) {
    next(error);
  }
});

router.put('/:id/schedule', async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const trainerId = String(req.params.id);
    const slots = req.body.slots as
      | Array<{
          dayOfWeek: DayOfWeek;
          startTime: string;
          endTime: string;
          isAvailable?: boolean;
        }>
      | undefined;

    await ensureTrainerAccess(authUser, trainerId);

    if (!slots || !Array.isArray(slots) || !slots.length) {
      throw new BadRequestError('slots array is required');
    }

    await prisma.$transaction(async (tx) => {
      await tx.trainerSchedule.deleteMany({
        where: {
          trainerId,
          gymId: authUser.gymId,
        },
      });

      await tx.trainerSchedule.createMany({
        data: slots.map((slot) => ({
          trainerId,
          gymId: authUser.gymId,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          isAvailable: slot.isAvailable === undefined ? true : toBoolean(slot.isAvailable, true),
        })),
      });
    });

    await createAuditLog({
      gymId: authUser.gymId,
      userId: authUser.userId,
      action: 'trainer.schedule_updated',
      entityType: 'trainer_schedule',
      entityId: trainerId,
      details: { slotCount: slots.length },
      ipAddress: req.ip,
    });

    const schedule = await prisma.trainerSchedule.findMany({
      where: {
        trainerId,
        gymId: authUser.gymId,
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    sendSuccess(res, schedule, 'Trainer schedule updated successfully');
  } catch (error) {
    next(error);
  }
});

router.get('/', ownerOnly, async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);

    const trainers = await prisma.user.findMany({
      where: {
        gymId: authUser.gymId,
        role: 'trainer',
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        trainerProfile: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    sendSuccess(res, trainers);
  } catch (error) {
    next(error);
  }
});

export default router;

