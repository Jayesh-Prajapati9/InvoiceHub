import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getRecentActivities = async (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 3;

    // Get recent activities from all sources
    const [contactActivities, itemActivities, quotes, invoices, payments] = await Promise.all([
      // Contact activities
      prisma.activityLog.findMany({
        take: limit * 2, // Get more to ensure we have enough after filtering
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          contact: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      // Item activities
      prisma.itemActivityLog.findMany({
        take: limit * 2,
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          item: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      // Recent quotes
      prisma.quote.findMany({
        take: limit,
        include: {
          contact: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      // Recent invoices
      prisma.invoice.findMany({
        take: limit,
        include: {
          contact: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      // Recent payments
      prisma.payment.findMany({
        take: limit,
        include: {
          invoice: {
            include: {
              contact: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ]);

    // Transform activities into a unified format
    const activities: any[] = [];

    // Add contact activities
    contactActivities.forEach((activity) => {
      activities.push({
        id: activity.id,
        type: 'contact',
        action: activity.action,
        description: activity.description.replace(/\s+by\s+[\w.@-]+$/i, ''),
        user: activity.user,
        entityName: activity.contact?.name || 'Contact',
        createdAt: activity.createdAt,
      });
    });

    // Add item activities
    itemActivities.forEach((activity) => {
      activities.push({
        id: activity.id,
        type: 'item',
        action: activity.action,
        description: activity.description.replace(/\s+by\s+[\w.@-]+$/i, ''),
        user: activity.user,
        entityName: activity.item?.name || 'Item',
        createdAt: activity.createdAt,
      });
    });

    // Add quote activities
    quotes.forEach((quote) => {
      activities.push({
        id: quote.id,
        type: 'quote',
        action: 'QUOTE_CREATED',
        description: `Quote ${quote.quoteNumber} created for ${quote.contact?.name || 'customer'}`,
        user: null, // Quotes don't have user relation, we'll need to add it if needed
        entityName: quote.quoteNumber,
        createdAt: quote.createdAt,
      });
    });

    // Add invoice activities
    invoices.forEach((invoice) => {
      activities.push({
        id: invoice.id,
        type: 'invoice',
        action: 'INVOICE_CREATED',
        description: `Invoice ${invoice.invoiceNumber} created for ${invoice.contact?.name || 'customer'}`,
        user: null,
        entityName: invoice.invoiceNumber,
        createdAt: invoice.createdAt,
      });
    });

    // Add payment activities
    payments.forEach((payment) => {
      const statusText = payment.status === 'PAID' ? 'recorded' : 'saved as draft';
      activities.push({
        id: payment.id,
        type: 'payment',
        action: 'PAYMENT_RECORDED',
        description: `Payment ${payment.paymentNumber} ${statusText} for invoice ${payment.invoice.invoiceNumber} (${payment.invoice.contact?.name || 'customer'})`,
        user: null,
        entityName: payment.paymentNumber,
        createdAt: payment.createdAt,
      });
    });

    // Sort by date and take the most recent
    activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const recentActivities = activities.slice(0, limit);

    res.json({
      success: true,
      data: recentActivities,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to fetch recent activities',
      },
    });
  }
};

