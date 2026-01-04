import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { createTimesheetSchema, updateTimesheetSchema } from '../validators/timesheetValidator';
import { getBillableHoursByProject, getBillableHoursByProjectAndDateRange } from '../services/timesheetService';

export const getTimesheets = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const projectId = req.query.projectId as string;
    const billable = req.query.billable as string;
    const search = req.query.search as string;

    const where: any = {};
    if (projectId) {
      where.projectId = projectId;
    }
    if (billable !== undefined) {
      where.billable = billable === 'true';
    }
    if (search) {
      where.OR = [
        { project: { name: { contains: search, mode: 'insensitive' } } },
        { customUserName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [timesheets, total] = await Promise.all([
      prisma.timesheet.findMany({
        where,
        skip,
        take: limit,
        include: {
          project: {
            include: {
              contact: true,
            },
          },
          user: true,
        },
        orderBy: {
          date: 'desc',
        },
      }),
      prisma.timesheet.count({ where }),
    ]);

    // Fetch contact information for timesheets where userId is a contact ID
    const timesheetsWithContacts = await Promise.all(
      timesheets.map(async (timesheet) => {
        let contact = null;
        // If userId is present and user relation is null, it might be a contact ID
        if (timesheet.userId && !timesheet.user) {
          try {
            contact = await prisma.contact.findUnique({
              where: { id: timesheet.userId },
              select: {
                id: true,
                name: true,
                email: true,
                company: true,
              },
            });
          } catch (error) {
            // Contact not found, ignore
          }
        }
        return {
          ...timesheet,
          contact, // Add contact information
        };
      })
    );

    res.json({
      success: true,
      data: {
        timesheets: timesheetsWithContacts,
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
        message: error.message || 'Failed to fetch timesheets',
      },
    });
  }
};

export const getTimesheetById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const timesheet = await prisma.timesheet.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            contact: true,
          },
        },
        user: true,
      },
    });

    if (!timesheet) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Timesheet not found',
        },
      });
    }

    // Fetch contact information if userId is present but user relation is null (might be a contact ID)
    let contact = null;
    if (timesheet.userId && !timesheet.user) {
      try {
        contact = await prisma.contact.findUnique({
          where: { id: timesheet.userId },
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
          },
        });
      } catch (error) {
        // Contact not found, ignore
      }
    }

    res.json({
      success: true,
      data: {
        ...timesheet,
        contact, // Add contact information
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to fetch timesheet',
      },
    });
  }
};

export const createTimesheet = async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = createTimesheetSchema.parse(req.body);

    // Check if userId is provided and if it's a valid User ID
    let userIdToSave: string | null = null;
    let customUserNameToSave: string | null = validatedData.customUserName || null;

    if (validatedData.userId) {
      try {
        // Check if the ID exists in the User table
        const user = await prisma.user.findUnique({
          where: { id: validatedData.userId },
        });

        if (user) {
          // It's a valid User ID, use it
          userIdToSave = validatedData.userId;
          customUserNameToSave = null; // Clear custom name if user is selected
        } else {
          // It's not a User ID (likely a contact ID), fetch contact name and use customUserName
          try {
            const contact = await prisma.contact.findUnique({
              where: { id: validatedData.userId },
              select: { name: true },
            });

            if (contact) {
              // Store contact name in customUserName
              customUserNameToSave = contact.name;
              userIdToSave = null; // Don't set userId for contacts
            } else {
              // ID doesn't exist in either table, treat as invalid
              return res.status(400).json({
                success: false,
                error: {
                  message: 'Invalid user ID provided',
                },
              });
            }
          } catch (contactError: any) {
            // If contact lookup fails, treat as invalid
            return res.status(400).json({
              success: false,
              error: {
                message: 'Invalid user ID provided',
              },
            });
          }
        }
      } catch (userError: any) {
        // If user lookup fails (e.g., invalid UUID format), try contact lookup
        try {
          const contact = await prisma.contact.findUnique({
            where: { id: validatedData.userId },
            select: { name: true },
          });

          if (contact) {
            // Store contact name in customUserName
            customUserNameToSave = contact.name;
            userIdToSave = null; // Don't set userId for contacts
          } else {
            // ID doesn't exist in either table, treat as invalid
            return res.status(400).json({
              success: false,
              error: {
                message: 'Invalid user ID provided',
              },
            });
          }
        } catch (contactError: any) {
          // If both lookups fail, treat as invalid
          return res.status(400).json({
            success: false,
            error: {
              message: 'Invalid user ID provided',
            },
          });
        }
      }
    }

    const timesheet = await prisma.timesheet.create({
      data: {
        projectId: validatedData.projectId,
        userId: userIdToSave,
        customUserName: customUserNameToSave,
        date: new Date(validatedData.date),
        hours: validatedData.hours,
        description: validatedData.description,
        billable: validatedData.billable,
      },
      include: {
        project: {
          include: {
            contact: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: timesheet,
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
        message: error.message || 'Failed to create timesheet',
      },
    });
  }
};

export const updateTimesheet = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updateTimesheetSchema.parse(req.body);

    const updateData: any = {};
    if (validatedData.projectId) updateData.projectId = validatedData.projectId;
    
    // Handle userId and customUserName
    if (validatedData.userId !== undefined) {
      if (validatedData.userId) {
        // Check if the ID exists in the User table
        const user = await prisma.user.findUnique({
          where: { id: validatedData.userId },
        });

        if (user) {
          // It's a valid User ID, use it
          updateData.userId = validatedData.userId;
          updateData.customUserName = null; // Clear custom name if user is selected
        } else {
          // It's not a User ID (likely a contact ID), fetch contact name and use customUserName
          const contact = await prisma.contact.findUnique({
            where: { id: validatedData.userId },
            select: { name: true },
          });

          if (contact) {
            // Store contact name in customUserName
            updateData.customUserName = contact.name;
            updateData.userId = null; // Don't set userId for contacts
          } else {
            // ID doesn't exist in either table, treat as invalid
            return res.status(400).json({
              success: false,
              error: {
                message: 'Invalid user ID provided',
              },
            });
          }
        }
      } else {
        // userId is explicitly set to empty string/null
        updateData.userId = null;
      }
    }

    if (validatedData.customUserName !== undefined) {
      updateData.customUserName = validatedData.customUserName || null;
      // If custom name is provided and userId is not set, clear userId
      if (updateData.customUserName && !validatedData.userId) {
        updateData.userId = null;
      }
    }

    if (validatedData.date) updateData.date = new Date(validatedData.date);
    if (validatedData.hours) updateData.hours = validatedData.hours;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.billable !== undefined) updateData.billable = validatedData.billable;

    const timesheet = await prisma.timesheet.update({
      where: { id },
      data: updateData,
      include: {
        project: {
          include: {
            contact: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: timesheet,
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
        message: error.message || 'Failed to update timesheet',
      },
    });
  }
};

export const deleteTimesheet = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.timesheet.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Timesheet deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to delete timesheet',
      },
    });
  }
};

export const getBillableHours = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const { startDate, endDate } = req.query;

    let result;
    
    if (startDate || endDate) {
      // Use date range function if dates are provided
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : new Date(); // Default to current date if endDate not provided
      
      if (!start) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'startDate is required when using date range',
          },
        });
      }

      result = await getBillableHoursByProjectAndDateRange(projectId, start, end);
    } else {
      // Use original function if no date range
      result = await getBillableHoursByProject(projectId);
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to fetch billable hours',
      },
    });
  }
};

