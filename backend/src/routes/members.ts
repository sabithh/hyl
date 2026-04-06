import { Router } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { authenticate } from '../middleware/auth';
import { ownerOnly } from '../middleware/rbac';
import { createAuditLog } from '../services/auditLog';
import { ConflictError, ForbiddenError, NotFoundError } from '../utils/errors';
import { sendCreated, sendSuccess } from '../utils/response';
import { getAuthUser, getPagination, parseOptionalNumber, toBoolean } from '../utils/request';

const router = Router();
const SALT_ROUNDS = 12;

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const { page, limit, skip } = getPagination(req);
    const role = typeof req.query.role === 'string' ? req.query.role : 'trainee';

    const where: any = {
      gymId: authUser.gymId,
      role,
    };

    if (authUser.role === 'trainer') {
      where.assignedTrainerId = authUser.userId;
      where.role = 'trainee';
    }

    if (authUser.role === 'trainee') {
      where.id = authUser.userId;
      delete where.role;
    }

    const [members, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          assignedTrainerId: true,
          joinDate: true,
          trainerProfile: true,
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

router.get('/:id', async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const userId = String(req.params.id);

    const member = await prisma.user.findFirst({
      where: {
        id: userId,
        gymId: authUser.gymId,
      },
      include: {
        assignedTrainer: {
          select: { id: true, name: true, email: true },
        },
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: { plan: true },
        },
        attendanceRecords: {
          orderBy: { checkInTime: 'desc' },
          take: 10,
        },
      },
    });

    if (!member) {
      throw new NotFoundError('Member not found');
    }

    if (authUser.role === 'trainer' && member.assignedTrainerId !== authUser.userId) {
      throw new ForbiddenError('You can only view your assigned trainees');
    }

    if (authUser.role === 'trainee' && member.id !== authUser.userId) {
      throw new ForbiddenError('You can only view your own profile');
    }

    sendSuccess(res, member);
  } catch (error) {
    next(error);
  }
});

router.post('/', ownerOnly, async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const { name, email, password, phone, assignedTrainerId } = req.body;

    if (!name || !email || !password) {
      throw new NotFoundError('name, email and password are required');
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictError('Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const member = await prisma.user.create({
      data: {
        gymId: authUser.gymId,
        name,
        email,
        phone,
        passwordHash,
        role: 'trainee',
        assignedTrainerId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        assignedTrainerId: true,
      },
    });

    await createAuditLog({
      gymId: authUser.gymId,
      userId: authUser.userId,
      action: 'member.created',
      entityType: 'user',
      entityId: member.id,
      details: { email: member.email },
      ipAddress: req.ip,
    });

    sendCreated(res, member, 'Member created successfully');
  } catch (error) {
    next(error);
  }
});

router.put('/:id', ownerOnly, async (req, res, next) => {
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
        dateOfBirth: req.body.dateOfBirth ? new Date(req.body.dateOfBirth) : undefined,
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
        role: true,
        isActive: true,
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

router.delete('/:id', ownerOnly, async (req, res, next) => {
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

export default router;

