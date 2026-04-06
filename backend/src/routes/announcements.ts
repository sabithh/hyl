import { Router } from 'express';
import prisma from '../config/database';
import { authenticate } from '../middleware/auth';
import { ownerOnly } from '../middleware/rbac';
import { createAuditLog } from '../services/auditLog';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { sendCreated, sendSuccess } from '../utils/response';
import { getAuthUser, getPagination } from '../utils/request';

const router = Router();

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const { page, limit, skip } = getPagination(req);

    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        where: {
          gymId: authUser.gymId,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.announcement.count({ where: { gymId: authUser.gymId } }),
    ]);

    sendSuccess(res, {
      announcements,
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
    const { title, body, message } = req.body;

    if (!title || (!body && !message)) {
      throw new BadRequestError('title and body are required');
    }

    const announcement = await prisma.announcement.create({
      data: {
        gymId: authUser.gymId,
        title,
        message: body ?? message,
      },
    });

    await createAuditLog({
      gymId: authUser.gymId,
      userId: authUser.userId,
      action: 'announcement.created',
      entityType: 'announcement',
      entityId: announcement.id,
      details: { title: announcement.title },
      ipAddress: req.ip,
    });

    sendCreated(res, announcement, 'Announcement created successfully');
  } catch (error) {
    next(error);
  }
});

router.put('/:id', ownerOnly, async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const announcementId = String(req.params.id);

    const existing = await prisma.announcement.findFirst({
      where: {
        id: announcementId,
        gymId: authUser.gymId,
      },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundError('Announcement not found');
    }

    const updated = await prisma.announcement.update({
      where: { id: announcementId },
      data: {
        title: req.body.title,
        message: req.body.body ?? req.body.message,
      },
    });

    await createAuditLog({
      gymId: authUser.gymId,
      userId: authUser.userId,
      action: 'announcement.updated',
      entityType: 'announcement',
      entityId: announcementId,
      details: { updatedFields: Object.keys(req.body ?? {}) },
      ipAddress: req.ip,
    });

    sendSuccess(res, updated, 'Announcement updated successfully');
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', ownerOnly, async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const announcementId = String(req.params.id);

    const existing = await prisma.announcement.findFirst({
      where: {
        id: announcementId,
        gymId: authUser.gymId,
      },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundError('Announcement not found');
    }

    await prisma.announcement.delete({ where: { id: announcementId } });

    await createAuditLog({
      gymId: authUser.gymId,
      userId: authUser.userId,
      action: 'announcement.deleted',
      entityType: 'announcement',
      entityId: announcementId,
      ipAddress: req.ip,
    });

    sendSuccess(res, null, 'Announcement deleted successfully');
  } catch (error) {
    next(error);
  }
});

export default router;

