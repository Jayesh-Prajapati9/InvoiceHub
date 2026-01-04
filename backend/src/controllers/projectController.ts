import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { createProjectSchema, updateProjectSchema } from '../validators/projectValidator';

export const getProjects = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status as string;
    const contactId = req.query.contactId as string;
    const search = req.query.search as string;

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (contactId) {
      where.contactId = contactId;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { contact: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: limit,
        include: {
          contact: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.project.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        projects,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to fetch projects',
      },
    });
  }
};

export const getProjectById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        contact: true,
        timesheets: {
          orderBy: {
            date: 'desc',
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Project not found',
        },
      });
    }

    res.json({
      success: true,
      data: project,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to fetch project',
      },
    });
  }
};

export const createProject = async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = createProjectSchema.parse(req.body);

    const project = await prisma.project.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        contactId: validatedData.contactId,
        hourlyRate: validatedData.hourlyRate,
        status: validatedData.status,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : undefined,
        addToDashboard: validatedData.addToDashboard ?? false,
      },
      include: {
        contact: true,
      },
    });

    res.status(201).json({
      success: true,
      data: project,
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
        message: error.message || 'Failed to create project',
      },
    });
  }
};

export const updateProject = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updateProjectSchema.parse(req.body);

    const updateData: any = {};
    if (validatedData.name) updateData.name = validatedData.name;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.contactId) updateData.contactId = validatedData.contactId;
    if (validatedData.hourlyRate) updateData.hourlyRate = validatedData.hourlyRate;
    if (validatedData.status) updateData.status = validatedData.status;
    if (validatedData.startDate) updateData.startDate = new Date(validatedData.startDate);
    if (validatedData.endDate) updateData.endDate = new Date(validatedData.endDate);
    if (validatedData.addToDashboard !== undefined) updateData.addToDashboard = validatedData.addToDashboard;

    const project = await prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        contact: true,
      },
    });

    res.json({
      success: true,
      data: project,
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
        message: error.message || 'Failed to update project',
      },
    });
  }
};

export const deleteProject = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.project.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to delete project',
      },
    });
  }
};

