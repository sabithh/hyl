import { Router } from 'express';
import prisma from '../config/database';
import { authenticate } from '../middleware/auth';
import { BadRequestError, ForbiddenError } from '../utils/errors';
import { sendCreated, sendSuccess } from '../utils/response';
import { getAuthUser, getPagination } from '../utils/request';

const router = Router();

router.use(authenticate);

router.get('/conversations', async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);

    const messages = await prisma.chatMessage.findMany({
      where: {
        gymId: authUser.gymId,
        OR: [{ senderId: authUser.userId }, { receiverId: authUser.userId }],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: { id: true, name: true, role: true } },
        receiver: { select: { id: true, name: true, role: true } },
      },
    });

    const map = new Map<string, any>();

    for (const message of messages) {
      const otherUser = message.senderId === authUser.userId ? message.receiver : message.sender;
      if (!map.has(otherUser.id)) {
        map.set(otherUser.id, {
          user: otherUser,
          lastMessage: message,
        });
      }
    }

    sendSuccess(res, Array.from(map.values()));
  } catch (error) {
    next(error);
  }
});

router.get('/:userId/messages', async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const otherUserId = req.params.userId;
    const { page, limit, skip } = getPagination(req);

    const otherUser = await prisma.user.findFirst({
      where: {
        id: otherUserId,
        gymId: authUser.gymId,
      },
      select: {
        id: true,
        role: true,
      },
    });

    if (!otherUser) {
      throw new BadRequestError('Recipient not found');
    }

    if (authUser.role === 'trainer' && otherUser.role !== 'trainee') {
      throw new ForbiddenError('Trainer can only chat with trainees');
    }

    if (authUser.role === 'trainee' && otherUser.role !== 'trainer') {
      throw new ForbiddenError('Trainee can only chat with trainers');
    }

    const where = {
      gymId: authUser.gymId,
      OR: [
        {
          senderId: authUser.userId,
          receiverId: otherUserId,
        },
        {
          senderId: otherUserId,
          receiverId: authUser.userId,
        },
      ],
    };

    const [messages, total] = await Promise.all([
      prisma.chatMessage.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.chatMessage.count({ where }),
    ]);

    await prisma.chatMessage.updateMany({
      where: {
        gymId: authUser.gymId,
        senderId: otherUserId,
        receiverId: authUser.userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    sendSuccess(res, {
      messages: messages.reverse(),
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

router.post('/:userId/messages', async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const receiverId = req.params.userId;
    const { message } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      throw new BadRequestError('message is required');
    }

    if (receiverId === authUser.userId) {
      throw new BadRequestError('Cannot send messages to yourself');
    }

    const receiver = await prisma.user.findFirst({
      where: {
        id: receiverId,
        gymId: authUser.gymId,
      },
      select: {
        id: true,
        role: true,
      },
    });

    if (!receiver) {
      throw new BadRequestError('Recipient not found');
    }

    if (authUser.role === 'trainer' && receiver.role !== 'trainee') {
      throw new ForbiddenError('Trainer can only chat with trainees');
    }

    if (authUser.role === 'trainee' && receiver.role !== 'trainer') {
      throw new ForbiddenError('Trainee can only chat with trainers');
    }

    const newMessage = await prisma.chatMessage.create({
      data: {
        gymId: authUser.gymId,
        senderId: authUser.userId,
        receiverId,
        message: message.trim(),
      },
      include: {
        sender: { select: { id: true, name: true, role: true } },
        receiver: { select: { id: true, name: true, role: true } },
      },
    });

    sendCreated(res, newMessage, 'Message sent successfully');
  } catch (error) {
    next(error);
  }
});

export default router;
