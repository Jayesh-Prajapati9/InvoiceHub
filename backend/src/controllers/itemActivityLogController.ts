import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getItemActivityLogs = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    const activityLogs = await prisma.itemActivityLog.findMany({
      where: { itemId: id },
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

export const createItemActivityLog = async (
  itemId: string,
  userId: string,
  action: string,
  description: string,
  metadata?: any
) => {
  try {
    await prisma.itemActivityLog.create({
      data: {
        itemId,
        userId,
        action,
        description,
        metadata: metadata || {},
      },
    });
  } catch (error) {
    console.error('Failed to create item activity log:', error);
  }
};

