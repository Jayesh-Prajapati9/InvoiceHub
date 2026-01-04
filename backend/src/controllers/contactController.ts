import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { createContactSchema, updateContactSchema } from '../validators/contactValidator';
import {
  getFinancialSummary,
  getIncomeExpenseData,
  updateFinancialSummary,
} from '../services/contactService';

export const getContacts = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search as string;
    const type = req.query.type as string;
    const status = req.query.status as string;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (type) {
      where.type = type;
    }

    if (status === 'ACTIVE') {
      where.isActive = true;
    } else if (status === 'INACTIVE') {
      where.isActive = false;
    }
    // If status is 'ALL' or not provided, don't filter by isActive

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        skip,
        take: limit,
        include: {
          financialSummary: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.contact.count({ where }),
    ]);

    // Calculate receivables for each contact if not cached
    const contactsWithFinancials = await Promise.all(
      contacts.map(async (contact) => {
        let receivables = 0;
        let unusedCredits = 0;

        if (contact.financialSummary) {
          receivables = Number(contact.financialSummary.outstandingReceivables);
          unusedCredits = Number(contact.financialSummary.unusedCredits);
        } else {
          // Calculate on the fly if no cache
          const summary = await getFinancialSummary(contact.id);
          receivables = Number(summary.outstandingReceivables);
          unusedCredits = Number(summary.unusedCredits);
        }

        return {
          ...contact,
          receivables,
          unusedCredits,
        };
      })
    );

    res.json({
      success: true,
      data: {
        contacts: contactsWithFinancials,
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
        message: error.message || 'Failed to fetch contacts',
      },
    });
  }
};

export const getContactById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const contact = await prisma.contact.findUnique({
      where: { id },
      include: {
        contactPersons: {
          orderBy: [
            { isPrimary: 'desc' },
            { createdAt: 'desc' },
          ],
        },
        financialSummary: true,
      },
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Contact not found',
        },
      });
    }

    res.json({
      success: true,
      data: contact,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to fetch contact',
      },
    });
  }
};

export const createContact = async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = createContactSchema.parse(req.body);

    // Check if email already exists
    if (validatedData.email) {
      const existingContact = await prisma.contact.findFirst({
        where: {
          email: validatedData.email,
        },
      });

      if (existingContact) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Email already exists',
            code: 'EMAIL_DUPLICATE',
            details: {
              field: 'email',
              message: 'A contact with this email address already exists',
            },
          },
        });
      }
    }

    const contact = await prisma.contact.create({
      data: {
        ...validatedData,
        isActive: validatedData.isActive !== undefined ? validatedData.isActive : true,
      },
    });

    // Create activity log
    if (req.user && req.user.userId) {
      await prisma.activityLog.create({
        data: {
          contactId: contact.id,
          userId: req.user.userId,
          action: 'CONTACT_CREATED',
          description: `${contact.name} has been created by ${req.user.email}`,
        },
      });
    }

    res.status(201).json({
      success: true,
      data: contact,
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
        message: error.message || 'Failed to create contact',
      },
    });
  }
};

export const updateContact = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updateContactSchema.parse(req.body);

    // Check if email already exists (excluding current contact)
    if (validatedData.email) {
      const existingContact = await prisma.contact.findFirst({
        where: {
          email: validatedData.email,
          NOT: {
            id: id,
          },
        },
      });

      if (existingContact) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Email already exists',
            code: 'EMAIL_DUPLICATE',
            details: {
              field: 'email',
              message: 'A contact with this email address already exists',
            },
          },
        });
      }
    }

    const contact = await prisma.contact.update({
      where: { id },
      data: validatedData,
    });

    // Create activity log
    if (req.user && req.user.userId) {
      await prisma.activityLog.create({
        data: {
          contactId: contact.id,
          userId: req.user.userId,
          action: 'CONTACT_UPDATED',
          description: `${contact.name} has been updated by ${req.user.email}`,
        },
      });
    }

    res.json({
      success: true,
      data: contact,
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
        message: error.message || 'Failed to update contact',
      },
    });
  }
};

export const deleteContact = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const contact = await prisma.contact.findUnique({
      where: { id },
      select: { name: true },
    });

    await prisma.contact.delete({
      where: { id },
    });

    // Create activity log (before deletion, so we can still reference the contact name)
    if (req.user && contact) {
      // Note: Activity log will be cascade deleted, but we can log it elsewhere if needed
    }

    res.json({
      success: true,
      message: 'Contact deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to delete contact',
      },
    });
  }
};

export const getContactFinancialSummary = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const contact = await prisma.contact.findUnique({
      where: { id },
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Contact not found',
        },
      });
    }

    const summary = await getFinancialSummary(id);

    res.json({
      success: true,
      data: {
        ...summary,
        currency: contact.defaultCurrency || 'INR',
        paymentTerms: contact.paymentTerms || 'Due on Receipt',
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to fetch financial summary',
      },
    });
  }
};

export const getContactIncomeExpense = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const months = parseInt(req.query.months as string) || 4;

    const contact = await prisma.contact.findUnique({
      where: { id },
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Contact not found',
        },
      });
    }

    const data = await getIncomeExpenseData(id, months);

    res.json({
      success: true,
      data: {
        chartData: data,
        currency: contact.defaultCurrency || 'INR',
        totalIncome: data.reduce((sum, item) => sum + item.income, 0),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to fetch income/expense data',
      },
    });
  }
};

