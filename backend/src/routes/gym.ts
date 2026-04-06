import { Router } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { authenticate } from '../middleware/auth';
import { ownerOnly } from '../middleware/rbac';
import { createAuditLog } from '../services/auditLog';
import { ConflictError, NotFoundError } from '../utils/errors';
import { sendCreated, sendSuccess } from '../utils/response';
import { getAuthUser, getPagination, parseOptionalNumber, toBoolean } from '../utils/request';

const router = Router();
const SALT_ROUNDS = 12;

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const gym = await prisma.gym.findUnique({
      where: { id: authUser.gymId },
      include: {
        _count: {
          select: {
            users: true,
            subscriptions: true,
            payments: true,
            attendance: true,
          },
        },
      },
    });

    if (!gym) {
      throw new NotFoundError('Gym not found');
    }

    sendSuccess(res, gym);
  } catch (error) {
    next(error);
  }
});

router.put('/', ownerOnly, async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);

    const gym = await prisma.gym.update({
      where: { id: authUser.gymId },
      data: {
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        address: req.body.address,
        city: req.body.city,
        state: req.body.state,
        country: req.body.country,
        pincode: req.body.pincode,
        latitude: parseOptionalNumber(req.body.latitude, 'latitude'),
        longitude: parseOptionalNumber(req.body.longitude, 'longitude'),
        website: req.body.website,
        logoUrl: req.body.logoUrl,
        coverPhotoUrl: req.body.coverPhotoUrl,
        openingTime: req.body.openingTime,
        closingTime: req.body.closingTime,
        maxCapacity: parseOptionalNumber(req.body.maxCapacity, 'maxCapacity'),
        gstNumber: req.body.gstNumber,
        isActive: req.body.isActive === undefined ? undefined : toBoolean(req.body.isActive),
      },
    });

    await createAuditLog({
      gymId: authUser.gymId,
      userId: authUser.userId,
      action: 'gym.updated',
      entityType: 'gym',
      entityId: gym.id,
      details: { updatedFields: Object.keys(req.body ?? {}) },
      ipAddress: req.ip,
    });

    sendSuccess(res, gym, 'Gym updated successfully');
  } catch (error) {
    next(error);
  }
});

router.get('/members', ownerOnly, async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const { page, limit, skip } = getPagination(req);
    const role = typeof req.query.role === 'string' ? req.query.role : undefined;
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;

    const where = {
      gymId: authUser.gymId,
      ...(role ? { role: role as any } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
              { phone: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [members, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          assignedTrainerId: true,
          joinDate: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    sendSuccess(res, {
      members,
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

router.post('/members', ownerOnly, async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const { name, email, password, phone, role = 'trainee', assignedTrainerId } = req.body;

    if (!name || !email || !password) {
      throw new NotFoundError('name, email and password are required');
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictError('Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await prisma.user.create({
      data: {
        gymId: authUser.gymId,
        name,
        email,
        phone,
        role,
        passwordHash,
        assignedTrainerId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        assignedTrainerId: true,
        joinDate: true,
      },
    });

    await createAuditLog({
      gymId: authUser.gymId,
      userId: authUser.userId,
      action: 'member.created',
      entityType: 'user',
      entityId: user.id,
      details: { role: user.role, email: user.email },
      ipAddress: req.ip,
    });

    sendCreated(res, user, 'Member created successfully');
  } catch (error) {
    next(error);
  }
});

router.put('/members/:id', ownerOnly, async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const memberId = String(req.params.id);

    const existing = await prisma.user.findFirst({
      where: { id: memberId, gymId: authUser.gymId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundError('Member not found');
    }

    const updated = await prisma.user.update({
      where: { id: memberId },
      data: {
        name: req.body.name,
        phone: req.body.phone,
        gender: req.body.gender,
        address: req.body.address,
        heightCm: parseOptionalNumber(req.body.heightCm, 'heightCm'),
        bloodGroup: req.body.bloodGroup,
        emergencyContactName: req.body.emergencyContactName,
        emergencyContactPhone: req.body.emergencyContactPhone,
        medicalConditions: req.body.medicalConditions,
        assignedTrainerId: req.body.assignedTrainerId,
        isActive: req.body.isActive === undefined ? undefined : toBoolean(req.body.isActive),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        assignedTrainerId: true,
      },
    });

    await createAuditLog({
      gymId: authUser.gymId,
      userId: authUser.userId,
      action: 'member.updated',
      entityType: 'user',
      entityId: memberId,
      details: { updatedFields: Object.keys(req.body ?? {}) },
      ipAddress: req.ip,
    });

    sendSuccess(res, updated, 'Member updated successfully');
  } catch (error) {
    next(error);
  }
});

router.delete('/members/:id', ownerOnly, async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const memberId = String(req.params.id);

    const existing = await prisma.user.findFirst({
      where: { id: memberId, gymId: authUser.gymId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundError('Member not found');
    }

    await prisma.user.update({
      where: { id: memberId },
      data: { isActive: false },
    });

    await createAuditLog({
      gymId: authUser.gymId,
      userId: authUser.userId,
      action: 'member.deactivated',
      entityType: 'user',
      entityId: memberId,
      ipAddress: req.ip,
    });

    sendSuccess(res, null, 'Member deactivated successfully');
  } catch (error) {
    next(error);
  }
});

router.get('/trainers', ownerOnly, async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const trainers = await prisma.user.findMany({
      where: { gymId: authUser.gymId, role: 'trainer' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
        _count: {
          select: { trainees: true },
        },
      },
    });

    sendSuccess(res, trainers);
  } catch (error) {
    next(error);
  }
});

router.post('/trainers', ownerOnly, async (req, res, next) => {
  try {
    req.body.role = 'trainer';
    const authUser = getAuthUser(req);
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      throw new NotFoundError('name, email and password are required');
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictError('Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const trainer = await prisma.user.create({
      data: {
        gymId: authUser.gymId,
        name,
        email,
        phone,
        role: 'trainer',
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
      },
    });

    await createAuditLog({
      gymId: authUser.gymId,
      userId: authUser.userId,
      action: 'trainer.created',
      entityType: 'user',
      entityId: trainer.id,
      details: { email: trainer.email },
      ipAddress: req.ip,
    });

    sendCreated(res, trainer, 'Trainer created successfully');
  } catch (error) {
    next(error);
  }
});

router.post('/assign-trainer', ownerOnly, async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const { traineeId, trainerId } = req.body;

    if (!traineeId || !trainerId) {
      throw new NotFoundError('traineeId and trainerId are required');
    }

    const [trainee, trainer] = await Promise.all([
      prisma.user.findFirst({
        where: { id: traineeId, gymId: authUser.gymId, role: 'trainee' },
        select: { id: true, assignedTrainerId: true },
      }),
      prisma.user.findFirst({
        where: { id: trainerId, gymId: authUser.gymId, role: 'trainer' },
        select: { id: true },
      }),
    ]);

    if (!trainee) {
      throw new NotFoundError('Trainee not found');
    }

    if (!trainer) {
      throw new NotFoundError('Trainer not found');
    }

    await prisma.user.update({
      where: { id: traineeId },
      data: { assignedTrainerId: trainerId },
    });

    await createAuditLog({
      gymId: authUser.gymId,
      userId: authUser.userId,
      action: 'trainer.assigned',
      entityType: 'user',
      entityId: traineeId,
      details: {
        previousTrainerId: trainee.assignedTrainerId,
        newTrainerId: trainerId,
      },
      ipAddress: req.ip,
    });

    sendSuccess(res, { traineeId, trainerId }, 'Trainer assigned successfully');
  } catch (error) {
    next(error);
  }
});

export default router;

