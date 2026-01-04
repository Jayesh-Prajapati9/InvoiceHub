import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { createItemSchema, updateItemSchema } from '../validators/itemValidator';
import { createItemActivityLog } from './itemActivityLogController';

export const getItems = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search as string;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.item.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        items,
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
        message: error.message || 'Failed to fetch items',
      },
    });
  }
};

export const getItemById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const item = await prisma.item.findUnique({
      where: { id },
      include: {
        itemActivityLogs: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Item not found',
        },
      });
    }

    // Get counts and statistics
    const [quoteItemsCount, invoiceItemsCount] = await Promise.all([
      prisma.quoteItem.count({
        where: { itemId: id },
      }),
      prisma.invoiceItem.count({
        where: { itemId: id },
      }),
    ]);

    // Calculate total quantity sold
    const [quoteItems, invoiceItems] = await Promise.all([
      prisma.quoteItem.findMany({
        where: { itemId: id },
        select: { quantity: true },
      }),
      prisma.invoiceItem.findMany({
        where: { itemId: id },
        select: { quantity: true },
      }),
    ]);

    let totalQuantity = 0;
    quoteItems.forEach((qi) => {
      totalQuantity += Number(qi.quantity);
    });
    invoiceItems.forEach((ii) => {
      totalQuantity += Number(ii.quantity);
    });

    // Get creator name from the first activity log (creation log)
    const creatorName = item.itemActivityLogs?.[0]?.user?.name || null;

    res.json({
      success: true,
      data: {
        ...item,
        quoteItemsCount,
        invoiceItemsCount,
        totalQuantitySold: totalQuantity,
        creatorName,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to fetch item',
      },
    });
  }
};

export const createItem = async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = createItemSchema.parse(req.body);

    const item = await prisma.item.create({
      data: validatedData,
    });

    // Get user name for activity log
    const user = await prisma.user.findUnique({
      where: { id: req.user?.userId },
      select: { name: true },
    });

    // Create activity log
    if (req.user && req.user.userId) {
      await createItemActivityLog(
        item.id,
        req.user.userId,
        'ITEM_CREATED',
        `${item.name} has been created by ${user?.name || req.user.email}`
      );
    }

    res.status(201).json({
      success: true,
      data: item,
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
        message: error.message || 'Failed to create item',
      },
    });
  }
};

export const updateItem = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updateItemSchema.parse(req.body);

    // Check if item has transactions (quotes or invoices)
    const [quoteItemsCount, invoiceItemsCount] = await Promise.all([
      prisma.quoteItem.count({
        where: { itemId: id },
      }),
      prisma.invoiceItem.count({
        where: { itemId: id },
      }),
    ]);

    const hasTransactions = quoteItemsCount > 0 || invoiceItemsCount > 0;

    // Get current item to check if type is being changed
    const currentItem = await prisma.item.findUnique({
      where: { id },
      select: { itemType: true, name: true },
    });

    // If item has transactions and type is being changed, prevent the update
    if (hasTransactions && validatedData.itemType && currentItem && validatedData.itemType !== currentItem.itemType) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Product type cannot be changed for Items having transactions.',
        },
      });
    }

    const item = await prisma.item.update({
      where: { id },
      data: validatedData,
    });

    // Get user name for activity log
    const user = await prisma.user.findUnique({
      where: { id: req.user?.userId },
      select: { name: true },
    });

    // Create activity log
    if (req.user && req.user.userId) {
      await createItemActivityLog(
        item.id,
        req.user.userId,
        'ITEM_UPDATED',
        `${item.name} has been updated by ${user?.name || req.user.email}`
      );
    }

    res.json({
      success: true,
      data: item,
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
        message: error.message || 'Failed to update item',
      },
    });
  }
};

export const deleteItem = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const item = await prisma.item.findUnique({
      where: { id },
      select: { name: true },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Item not found',
        },
      });
    }

    // Get user name for activity log
    const user = await prisma.user.findUnique({
      where: { id: req.user?.userId },
      select: { name: true },
    });

    // Create activity log BEFORE deletion (so we can still reference the item)
    if (req.user && req.user.userId) {
      await createItemActivityLog(
        id,
        req.user.userId,
        'ITEM_DELETED',
        `${item.name} has been deleted by ${user?.name || req.user.email}`
      );
    }

    // Delete the item after creating the activity log
    await prisma.item.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Item deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to delete item',
      },
    });
  }
};

export const getItemTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const typeFilter = req.query.type as string; // 'quotes', 'invoices', or 'all'

    // Get quote items
    const quoteItems = await prisma.quoteItem.findMany({
      where: { itemId: id },
      include: {
        quote: {
          include: {
            contact: {
              select: {
                name: true,
                company: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get invoice items
    const invoiceItems = await prisma.invoiceItem.findMany({
      where: { itemId: id },
      include: {
        invoice: {
          include: {
            contact: {
              select: {
                name: true,
                company: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform quote items
    const quoteTransactions = quoteItems
      .filter((qi) => !typeFilter || typeFilter === 'quotes' || typeFilter === 'all')
      .map((qi) => ({
        id: qi.id,
        type: 'quote',
        date: qi.quote.issueDate,
        documentNumber: qi.quote.quoteNumber,
        customerName: qi.quote.contact.company || qi.quote.contact.name,
        quantity: Number(qi.quantity),
        price: Number(qi.rate),
        total: Number(qi.amount) + (Number(qi.amount) * Number(qi.taxRate)) / 100,
        status: qi.quote.status,
        quoteId: qi.quote.id,
      }));

    // Transform invoice items
    const invoiceTransactions = invoiceItems
      .filter((ii) => !typeFilter || typeFilter === 'invoices' || typeFilter === 'all')
      .map((ii) => ({
        id: ii.id,
        type: 'invoice',
        date: ii.invoice.issueDate,
        documentNumber: ii.invoice.invoiceNumber,
        customerName: ii.invoice.contact.company || ii.invoice.contact.name,
        quantity: Number(ii.quantity),
        price: Number(ii.rate),
        total: Number(ii.amount) + (Number(ii.amount) * Number(ii.taxRate)) / 100,
        status: ii.invoice.status,
        invoiceId: ii.invoice.id,
      }));

    // Combine and sort by date
    const allTransactions = [...quoteTransactions, ...invoiceTransactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    res.json({
      success: true,
      data: allTransactions,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to fetch item transactions',
      },
    });
  }
};

