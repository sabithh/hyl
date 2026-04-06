import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import prisma from '../config/database';
import config from '../config';
import logger from '../config/logger';
import { JwtPayload } from '../middleware/auth';

interface SendMessagePayload {
  receiverId: string;
  message: string;
}

interface MarkReadPayload {
  withUserId: string;
}

type Ack = (response: { success: boolean; message?: string; data?: unknown }) => void;

const getToken = (rawAuth?: string): string | null => {
  if (!rawAuth) {
    return null;
  }

  if (rawAuth.startsWith('Bearer ')) {
    return rawAuth.slice('Bearer '.length).trim();
  }

  return rawAuth.trim();
};

export const setupChatSocket = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: config.corsOrigin,
      credentials: true,
    },
  });

  const chatNamespace = io.of('/ws/chat');

  chatNamespace.use((socket, next) => {
    try {
      const token = getToken(socket.handshake.auth?.token as string | undefined);
      if (!token) {
        return next(new Error('Unauthorized: token missing'));
      }

      const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
      socket.data.user = decoded;
      return next();
    } catch {
      return next(new Error('Unauthorized: invalid token'));
    }
  });

  chatNamespace.on('connection', (socket) => {
    const user = socket.data.user as JwtPayload;
    const ownRoom = `user:${user.userId}`;

    socket.join(ownRoom);
    logger.info('Socket connected', {
      namespace: '/ws/chat',
      socketId: socket.id,
      userId: user.userId,
      gymId: user.gymId,
    });

    socket.on('chat:send', async (payload: SendMessagePayload, ack?: Ack) => {
      try {
        if (!payload?.receiverId || !payload?.message?.trim()) {
          ack?.({ success: false, message: 'receiverId and message are required' });
          return;
        }

        if (payload.receiverId === user.userId) {
          ack?.({ success: false, message: 'Cannot send message to yourself' });
          return;
        }

        const receiver = await prisma.user.findFirst({
          where: {
            id: payload.receiverId,
            gymId: user.gymId,
          },
          select: {
            id: true,
            role: true,
          },
        });

        if (!receiver) {
          ack?.({ success: false, message: 'Receiver not found' });
          return;
        }

        if (user.role === 'trainer' && receiver.role !== 'trainee') {
          ack?.({ success: false, message: 'Trainer can only message trainees' });
          return;
        }

        if (user.role === 'trainee' && receiver.role !== 'trainer') {
          ack?.({ success: false, message: 'Trainee can only message trainers' });
          return;
        }

        const chatMessage = await prisma.chatMessage.create({
          data: {
            gymId: user.gymId,
            senderId: user.userId,
            receiverId: payload.receiverId,
            message: payload.message.trim(),
          },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
            receiver: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        });

        chatNamespace.to(`user:${user.userId}`).to(`user:${payload.receiverId}`).emit('chat:message', chatMessage);
        ack?.({ success: true, data: chatMessage });
      } catch (error) {
        logger.error('Socket chat:send failed', {
          socketId: socket.id,
          userId: user.userId,
          error: (error as Error).message,
        });
        ack?.({ success: false, message: 'Failed to send message' });
      }
    });

    socket.on('chat:mark-read', async (payload: MarkReadPayload, ack?: Ack) => {
      try {
        if (!payload?.withUserId) {
          ack?.({ success: false, message: 'withUserId is required' });
          return;
        }

        const result = await prisma.chatMessage.updateMany({
          where: {
            gymId: user.gymId,
            senderId: payload.withUserId,
            receiverId: user.userId,
            isRead: false,
          },
          data: { isRead: true },
        });

        chatNamespace.to(`user:${payload.withUserId}`).emit('chat:read', {
          byUserId: user.userId,
          withUserId: payload.withUserId,
          count: result.count,
        });

        ack?.({ success: true, data: { updatedCount: result.count } });
      } catch (error) {
        logger.error('Socket chat:mark-read failed', {
          socketId: socket.id,
          userId: user.userId,
          error: (error as Error).message,
        });
        ack?.({ success: false, message: 'Failed to mark messages as read' });
      }
    });

    socket.on('disconnect', (reason) => {
      logger.info('Socket disconnected', {
        namespace: '/ws/chat',
        socketId: socket.id,
        userId: user.userId,
        reason,
      });
    });
  });

  return io;
};
