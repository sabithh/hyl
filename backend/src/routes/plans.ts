import { Router } from 'express';
import prisma from '../config/database';
import { authenticate } from '../middleware/auth';
import { ownerOnly } from '../middleware/rbac';
import { createAuditLog } from '../services/auditLog';
import { NotFoundError } from '../utils/errors';
import { sendCreated, sendSuccess } from '../utils/response';
import { getAuthUser, getPagination, parseNumber, toBoolean } from '../utils/request';

const router = Router();

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const { page, limit, skip } = getPagination(req);
    const includeInactive = req.query.includeInactive === 'true';

    const where = {
      gymId: authUser.gymId,
      ...(includeInactive ? {} : { isActive: true }),
    };

    const [plans, total] = await Promise.all([
      prisma.membershipPlan.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.membershipPlan.count({ where }),
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

router.post('/', ownerOnly, async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const { name, durationDays, price, description, features, isActive } = req.body;

    if (!name || durationDays === undefined || price === undefined) {
      throw new NotFoundError('name, durationDays and price are required');
    }

    const plan = await prisma.membershipPlan.create({
      data: {
        gymId: authUser.gymId,
        name,
        durationDays: parseNumber(durationDays, 'durationDays'),
        price: parseNumber(price, 'price'),
        description,
        features,
        isActive: isActive === undefined ? true : toBoolean(isActive),
      },
    });

    await createAuditLog({
      gymId: authUser.gymId,
      userId: authUser.userId,
      action: 'plan.created',
      entityType: 'membership_plan',
      entityId: plan.id,
      details: { name: plan.name, price: plan.price },
      ipAddress: req.ip,
    });

    sendCreated(res, plan, 'Membership plan created successfully');
  } catch (error) {
    next(error);
  }
});

router.put('/:id', ownerOnly, async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const planId = String(req.params.id);

    const existing = await prisma.membershipPlan.findFirst({
      where: { id: planId, gymId: authUser.gymId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundError('Plan not found');
    }

    const updated = await prisma.membershipPlan.update({
      where: { id: planId },
      data: {
        name: req.body.name,
        durationDays: req.body.durationDays === undefined ? undefined : parseNumber(req.body.durationDays, 'durationDays'),
        price: req.body.price === undefined ? undefined : parseNumber(req.body.price, 'price'),
        description: req.body.description,
        features: req.body.features,
        isActive: req.body.isActive === undefined ? undefined : toBoolean(req.body.isActive),
      },
    });

    await createAuditLog({
      gymId: authUser.gymId,
      userId: authUser.userId,
      action: 'plan.updated',
      entityType: 'membership_plan',
      entityId: planId,
      details: { updatedFields: Object.keys(req.body ?? {}) },
      ipAddress: req.ip,
    });

    sendSuccess(res, updated, 'Plan updated successfully');
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', ownerOnly, async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const planId = String(req.params.id);

    const existing = await prisma.membershipPlan.findFirst({
      where: { id: planId, gymId: authUser.gymId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundError('Plan not found');
    }

    await prisma.membershipPlan.update({
      where: { id: planId },
      data: { isActive: false },
    });

    await createAuditLog({
      gymId: authUser.gymId,
      userId: authUser.userId,
      action: 'plan.deactivated',
      entityType: 'membership_plan',
      entityId: planId,
      ipAddress: req.ip,
    });

    sendSuccess(res, null, 'Plan deactivated successfully');
  } catch (error) {
    next(error);
  }
});

export default router;

