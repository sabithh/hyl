import { createServer, Server as HttpServer } from 'http';
import app from './app';
import config from './config';
import logger from './config/logger';
import prisma from './config/database';
import { setupChatSocket } from './socket/chat';

let httpServer: HttpServer | null = null;

const startServer = async () => {
  try {
    if (config.skipDbConnect) {
      logger.warn('⚠️ SKIP_DB_CONNECT=true, starting API without database connection');
    } else {
      await prisma.$connect();
      logger.info('✅ Database connected successfully');
    }

    // Start server
    httpServer = createServer(app);
    setupChatSocket(httpServer);

    httpServer.listen(config.port, () => {
      logger.info(`🚀 Server running on port ${config.port} in ${config.env} mode`);
      logger.info(`📋 Health check: http://localhost:${config.port}/api/health`);
      logger.info(`💬 WebSocket chat namespace: /ws/chat`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  if (httpServer) {
    httpServer.close();
  }
  if (!config.skipDbConnect) {
    await prisma.$disconnect();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  if (httpServer) {
    httpServer.close();
  }
  if (!config.skipDbConnect) {
    await prisma.$disconnect();
  }
  process.exit(0);
});

startServer();
