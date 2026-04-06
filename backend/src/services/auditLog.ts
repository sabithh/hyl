import prisma from '../config/database';

interface AuditData {
  gymId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
}

export const createAuditLog = async (data: AuditData) => {
  try {
    await prisma.auditLog.create({
      data: {
        gymId: data.gymId,
        userId: data.userId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        details: data.details,
        ipAddress: data.ipAddress,
      },
    });
  } catch (error) {
    // Don't let audit logging failures crash the app
    console.error('Audit log failed:', error);
  }
};
