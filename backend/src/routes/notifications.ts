import { Router } from 'express';
import prisma from '../config/database';
import { authenticate } from '../middleware/auth';
import { ownerOnly, requireRole } from '../middleware/rbac';
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

    const userIdFilter = typeof req.query.userId === 'string' ? req.query.userId : undefined;
    const isReadFilter = typeof req.query.isRead === 'string' ? req.query.isRead : undefined;

    const where: any = {
      gymId: authUser.gymId,
    };

    if (authUser.role === 'owner' && userIdFilter) {
      where.userId = userIdFilter;
    } else {
      where.userId = authUser.userId;
    }

    if (isReadFilter === 'true') {
      where.isRead = true;
    }

    if (isReadFilter === 'false') {
      where.isRead = false;
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
    ]);

    sendSuccess(res, {
      notifications,
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

router.put('/:id/read', async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const notificationId = String(req.params.id);

    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        gymId: authUser.gymId,
      },
      select: {
        id: true,
        userId: true,
        isRead: true,
      },
    });

    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    if (authUser.role !== 'owner' && notification.userId !== authUser.userId) {
      throw new NotFoundError('Notification not found');
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    sendSuccess(res, updated, 'Notification marked as read');
  } catch (error) {
    next(error);
  }
});

router.post('/', requireRole('owner', 'trainer'), async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const { userId, title, body, type, data, targetRole } = req.body;

    if (!title || !body || !type) {
      throw new BadRequestError('title, body and type are required');
    }

    if (userId) {
      const user = await prisma.user.findFirst({
        where: {
          id: userId,
          gymId: authUser.gymId,
        },
        select: { id: true },
      });

      if (!user) {
        throw new NotFoundError('Recipient not found');
      }

      const notification = await prisma.notification.create({
        data: {
          gymId: authUser.gymId,
          userId,
          title,
          body,
          type,
          data,
        },
      });

      await createAuditLog({
        gymId: authUser.gymId,
        userId: authUser.userId,
        action: 'notification.sent',
        entityType: 'notification',
        entityId: notification.id,
        details: { recipientId: userId, type },
        ipAddress: req.ip,
      });

      sendCreated(res, notification, 'Notification sent');
      return;
    }

    if (!targetRole || !['owner', 'trainer', 'trainee'].includes(targetRole)) {
      throw new BadRequestError('userId or valid targetRole is required');
    }

    const recipients = await prisma.user.findMany({
      where: {
        gymId: authUser.gymId,
        role: targetRole,
        isActive: true,
      },
      select: { id: true },
    });

    if (!recipients.length) {
      sendSuccess(res, { sentCount: 0 }, 'No recipients found');
      return;
    }

    await prisma.notification.createMany({
      data: recipients.map((recipient) => ({
        gymId: authUser.gymId,
        userId: recipient.id,
        title,
        body,
        type,
        data,
      })),
    });

    await createAuditLog({
      gymId: authUser.gymId,
      userId: authUser.userId,
      action: 'notification.broadcast',
      entityType: 'notification',
      details: { targetRole, sentCount: recipients.length, type },
      ipAddress: req.ip,
    });

    sendSuccess(res, { sentCount: recipients.length }, 'Notifications broadcasted');
  } catch (error) {
    next(error);
  }
});

router.put('/read-all', async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);

    const result = await prisma.notification.updateMany({
      where: {
        gymId: authUser.gymId,
        userId: authUser.userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    sendSuccess(res, { updatedCount: result.count }, 'All notifications marked as read');
  } catch (error) {
    next(error);
  }
});

export default router;

