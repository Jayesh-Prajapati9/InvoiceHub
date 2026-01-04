import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import {
  createContactPersonSchema,
  updateContactPersonSchema,
} from '../validators/contactValidator';

export const getContactPersons = async (req: AuthRequest, res: Response) => {
  try {
    const { contactId } = req.params;

    const contactPersons = await prisma.contactPerson.findMany({
      where: { contactId },
      orderBy: [
        { isPrimary: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    res.json({
      success: true,
      data: contactPersons,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to fetch contact persons',
      },
    });
  }
};

export const getContactPersonById = async (req: AuthRequest, res: Response) => {
  try {
    const { personId } = req.params;

    const contactPerson = await prisma.contactPerson.findUnique({
      where: { id: personId },
    });

    if (!contactPerson) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Contact person not found',
        },
      });
    }

    res.json({
      success: true,
      data: contactPerson,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to fetch contact person',
      },
    });
  }
};

export const createContactPerson = async (req: AuthRequest, res: Response) => {
  try {
    const { contactId } = req.params;
    const validatedData = createContactPersonSchema.parse(req.body);

    // If this is marked as primary, unset other primary contact persons
    if (validatedData.isPrimary) {
      await prisma.contactPerson.updateMany({
        where: {
          contactId,
          isPrimary: true,
        },
        data: {
          isPrimary: false,
        },
      });
    }

    const contactPerson = await prisma.contactPerson.create({
      data: {
        ...validatedData,
        contactId,
      },
    });

    // Create activity log
    if (req.user) {
      await prisma.activityLog.create({
        data: {
          contactId,
          userId: req.user.userId,
          action: 'CONTACT_PERSON_ADDED',
          description: `${contactPerson.name} has been created by ${req.user.email}`,
        },
      });
    }

    res.status(201).json({
      success: true,
      data: contactPerson,
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
        message: error.message || 'Failed to create contact person',
      },
    });
  }
};

export const updateContactPerson = async (req: AuthRequest, res: Response) => {
  try {
    const { personId } = req.params;
    const validatedData = updateContactPersonSchema.parse(req.body);

    const existingPerson = await prisma.contactPerson.findUnique({
      where: { id: personId },
    });

    if (!existingPerson) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Contact person not found',
        },
      });
    }

    // If this is marked as primary, unset other primary contact persons
    if (validatedData.isPrimary) {
      await prisma.contactPerson.updateMany({
        where: {
          contactId: existingPerson.contactId,
          isPrimary: true,
          id: { not: personId },
        },
        data: {
          isPrimary: false,
        },
      });
    }

    const contactPerson = await prisma.contactPerson.update({
      where: { id: personId },
      data: validatedData,
    });

    // Create activity log
    if (req.user) {
      await prisma.activityLog.create({
        data: {
          contactId: existingPerson.contactId,
          userId: req.user.userId,
          action: 'CONTACT_PERSON_UPDATED',
          description: `${contactPerson.name} has been updated by ${req.user.email}`,
        },
      });
    }

    res.json({
      success: true,
      data: contactPerson,
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
        message: error.message || 'Failed to update contact person',
      },
    });
  }
};

export const deleteContactPerson = async (req: AuthRequest, res: Response) => {
  try {
    const { personId } = req.params;

    const contactPerson = await prisma.contactPerson.findUnique({
      where: { id: personId },
    });

    if (!contactPerson) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Contact person not found',
        },
      });
    }

    await prisma.contactPerson.delete({
      where: { id: personId },
    });

    // Create activity log
    if (req.user) {
      await prisma.activityLog.create({
        data: {
          contactId: contactPerson.contactId,
          userId: req.user.userId,
          action: 'CONTACT_PERSON_DELETED',
          description: `${contactPerson.name} has been deleted by ${req.user.email}`,
        },
      });
    }

    res.json({
      success: true,
      message: 'Contact person deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to delete contact person',
      },
    });
  }
};

