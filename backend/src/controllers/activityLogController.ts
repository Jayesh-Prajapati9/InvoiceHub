import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { createActivityLogSchema } from '../validators/contactValidator';

export const getContactActivityLogs = async (req: AuthRequest, res: Response) => {
  try {
    const { contactId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    const activityLogs = await prisma.activityLog.findMany({
      where: { contactId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    res.json({
      success: true,
      data: activityLogs,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to fetch activity logs',
      },
    });
  }
};

export const createActivityLog = async (req: AuthRequest, res: Response) => {
  try {
    const { contactId } = req.params;
    const validatedData = createActivityLogSchema.parse(req.body);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Unauthorized',
        },
      });
    }

    const activityLog = await prisma.activityLog.create({
      data: {
        ...validatedData,
        contactId,
        userId: req.user.userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: activityLog,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation error',
          details: error.errors,
        },
      });
    }

    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to create activity log',
      },
    });
  }
};

