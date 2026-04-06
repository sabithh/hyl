import { CampaignChannel, CampaignStatus } from '@prisma/client';
import { Router } from 'express';
import prisma from '../config/database';
import { authenticate } from '../middleware/auth';
import { ownerOnly } from '../middleware/rbac';
import { createAuditLog } from '../services/auditLog';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { sendCreated, sendSuccess } from '../utils/response';
import { getAuthUser, getPagination, parseOptionalNumber } from '../utils/request';

const router = Router();

router.use(authenticate);
router.use(ownerOnly);

router.get('/campaigns', async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const { page, limit, skip } = getPagination(req);

    const [campaigns, total] = await Promise.all([
      prisma.marketingCampaign.findMany({
        where: { gymId: authUser.gymId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.marketingCampaign.count({ where: { gymId: authUser.gymId } }),
    ]);

    sendSuccess(res, {
      campaigns,
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

router.post('/campaigns', async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const { name, targetCriteria, messageTemplate, channel, discountPct, scheduledAt, status } = req.body;

    if (!name || !messageTemplate || !channel) {
      throw new BadRequestError('name, messageTemplate and channel are required');
    }

    const campaign = await prisma.marketingCampaign.create({
      data: {
        gymId: authUser.gymId,
        name,
        targetCriteria,
        messageTemplate,
        channel: channel as CampaignChannel,
        discountPct: parseOptionalNumber(discountPct, 'discountPct'),
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        status: (status as CampaignStatus | undefined) ?? CampaignStatus.draft,
      },
    });

    await createAuditLog({
      gymId: authUser.gymId,
      userId: authUser.userId,
      action: 'campaign.created',
      entityType: 'marketing_campaign',
      entityId: campaign.id,
      details: { channel: campaign.channel, name: campaign.name },
      ipAddress: req.ip,
    });

    sendCreated(res, campaign, 'Campaign created successfully');
  } catch (error) {
    next(error);
  }
});

router.put('/campaigns/:id', async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const campaignId = String(req.params.id);

    const existing = await prisma.marketingCampaign.findFirst({
      where: {
        id: campaignId,
        gymId: authUser.gymId,
      },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundError('Campaign not found');
    }

    const updated = await prisma.marketingCampaign.update({
      where: { id: campaignId },
      data: {
        name: req.body.name,
        targetCriteria: req.body.targetCriteria,
        messageTemplate: req.body.messageTemplate,
        channel: req.body.channel as CampaignChannel | undefined,
        discountPct:
          req.body.discountPct === undefined
            ? undefined
            : parseOptionalNumber(req.body.discountPct, 'discountPct'),
        scheduledAt: req.body.scheduledAt ? new Date(req.body.scheduledAt) : undefined,
        status: req.body.status as CampaignStatus | undefined,
      },
    });

    await createAuditLog({
      gymId: authUser.gymId,
      userId: authUser.userId,
      action: 'campaign.updated',
      entityType: 'marketing_campaign',
      entityId: campaignId,
      details: { updatedFields: Object.keys(req.body ?? {}) },
      ipAddress: req.ip,
    });

    sendSuccess(res, updated, 'Campaign updated successfully');
  } catch (error) {
    next(error);
  }
});

router.post('/campaigns/:id/send', async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const campaignId = String(req.params.id);

    const campaign = await prisma.marketingCampaign.findFirst({
      where: {
        id: campaignId,
        gymId: authUser.gymId,
      },
    });

    if (!campaign) {
      throw new NotFoundError('Campaign not found');
    }

    const criteria = (campaign.targetCriteria ?? {}) as Record<string, any>;
    const inactiveDays = Number(criteria.inactiveDays ?? 30);

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - inactiveDays);

    const activeSubscriptionUsers = await prisma.subscription.findMany({
      where: {
        gymId: authUser.gymId,
        status: 'active',
      },
      select: {
        userId: true,
      },
    });

    const activeUserIds = Array.from(new Set(activeSubscriptionUsers.map((item) => item.userId)));

    const recentAttendance = await prisma.attendance.findMany({
      where: {
        gymId: authUser.gymId,
        userId: { in: activeUserIds },
        checkInTime: { gte: cutoff },
      },
      select: { userId: true },
      distinct: ['userId'],
    });

    const recentlySeen = new Set(recentAttendance.map((item) => item.userId));
    const targetUserIds = activeUserIds.filter((id) => !recentlySeen.has(id));

    if (!targetUserIds.length) {
      await prisma.marketingCampaign.update({
        where: { id: campaign.id },
        data: {
          status: CampaignStatus.completed,
          sentCount: campaign.sentCount,
        },
      });

      sendSuccess(res, { sentCount: 0 }, 'No target members matched the criteria');
      return;
    }

    await prisma.notification.createMany({
      data: targetUserIds.map((userId) => ({
        gymId: authUser.gymId,
        userId,
        title: `Offer from your gym: ${campaign.name}`,
        body: campaign.messageTemplate,
        type: 'marketing',
        data: {
          campaignId: campaign.id,
          channel: campaign.channel,
          discountPct: campaign.discountPct,
        },
      })),
    });

    const updatedCampaign = await prisma.marketingCampaign.update({
      where: { id: campaign.id },
      data: {
        status: CampaignStatus.completed,
        sentCount: campaign.sentCount + targetUserIds.length,
      },
    });

    await createAuditLog({
      gymId: authUser.gymId,
      userId: authUser.userId,
      action: 'campaign.executed',
      entityType: 'marketing_campaign',
      entityId: campaign.id,
      details: { sentCount: targetUserIds.length, criteria },
      ipAddress: req.ip,
    });

    sendSuccess(res, { sentCount: targetUserIds.length, campaign: updatedCampaign }, 'Campaign executed');
  } catch (error) {
    next(error);
  }
});

router.get('/inactive-members', async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const inactiveDays = parseOptionalNumber(req.query.days, 'days') ?? 30;

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - inactiveDays);

    const activeSubscriptions = await prisma.subscription.findMany({
      where: {
        gymId: authUser.gymId,
        status: 'active',
      },
      select: {
        userId: true,
        endDate: true,
      },
    });

    const activeUserIds = Array.from(new Set(activeSubscriptions.map((item) => item.userId)));

    const recentAttendance = await prisma.attendance.findMany({
      where: {
        gymId: authUser.gymId,
        userId: { in: activeUserIds },
        checkInTime: { gte: cutoff },
      },
      select: { userId: true },
      distinct: ['userId'],
    });

    const activeSet = new Set(recentAttendance.map((item) => item.userId));
    const inactiveIds = activeUserIds.filter((id) => !activeSet.has(id));

    const inactiveMembers = await prisma.user.findMany({
      where: {
        id: { in: inactiveIds },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        joinDate: true,
      },
    });

    sendSuccess(res, inactiveMembers);
  } catch (error) {
    next(error);
  }
});

export default router;

