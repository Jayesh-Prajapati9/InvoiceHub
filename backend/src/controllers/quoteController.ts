import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import {
  createQuoteSchema,
  updateQuoteSchema,
  updateQuoteStatusSchema,
} from '../validators/quoteValidator';
import { createQuote, updateQuoteStatus, calculateQuoteTotals } from '../services/quoteService';
import { getDefaultQuoteTemplate } from '../utils/templateHelper';
import { renderQuoteTemplate } from '../utils/handlebarsTemplateRenderer';
import { generatePDFFromHTML } from '../services/pdfService';
import { sendDocumentEmail } from '../services/emailService';

interface QuoteItemInput {
  itemId?: string;
  name: string;
  description?: string;
  quantity: number;
  rate: number;
  taxRate: number;
}

export const getQuotes = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status as string;
    const search = req.query.search as string;

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { quoteNumber: { contains: search, mode: 'insensitive' } },
        { contact: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [quotes, total] = await Promise.all([
      prisma.quote.findMany({
        where,
        skip,
        take: limit,
        include: {
          contact: true,
          items: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.quote.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        quotes,
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
        message: error.message || 'Failed to fetch quotes',
      },
    });
  }
};

export const getQuoteById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        contact: true,
        items: true,
        template: true,
        project: true,
      },
    });

    if (!quote) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Quote not found',
        },
      });
    }

    // If no template is set, get the default template
    // IMPORTANT: Don't replace non-default templates with default
    let template = quote.template;
    
    // If templateId exists but template relation is null, fetch it explicitly
    if (!template && quote.templateId) {
      template = await prisma.template.findUnique({
        where: { id: quote.templateId },
      });
    }
    
    if (!template) {
      template = await getDefaultQuoteTemplate();
    }
    // If template is already marked as default, use it as-is (don't replace)

    // Render the template HTML with quote data
    const renderedHTML = renderQuoteTemplate(
      template.content,
      {
        ...quote,
        template: {
          id: template.id,
          name: template.name,
        },
      } as any,
      {
        name: 'Test',
        city: 'Gujarat',
        country: 'India',
        email: 'jayesh.prajapati@aipxperts.com',
      }
    );

    res.json({
      success: true,
      data: {
        ...quote,
        template, // Always include template (either selected or default)
        renderedHTML, // Include rendered HTML for display
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to fetch quote',
      },
    });
  }
};

export const createQuoteController = async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = createQuoteSchema.parse(req.body);

    // Clean up items - convert empty strings to undefined
    const cleanedItems = validatedData.items.map((item) => ({
      ...item,
      itemId: item.itemId && item.itemId !== '' ? item.itemId : undefined,
      description: item.description && item.description !== '' ? item.description : undefined,
    }));

    const quote = await createQuote({
      contactId: validatedData.contactId,
      templateId: validatedData.templateId && validatedData.templateId !== '' ? validatedData.templateId : undefined,
      projectId: validatedData.projectId && validatedData.projectId !== '' ? validatedData.projectId : undefined,
      paymentTerms: validatedData.paymentTerms,
      issueDate: validatedData.issueDate && validatedData.issueDate !== '' ? new Date(validatedData.issueDate) : undefined,
      expiryDate: validatedData.expiryDate && validatedData.expiryDate !== '' ? new Date(validatedData.expiryDate) : undefined,
      items: cleanedItems as QuoteItemInput[],
      notes: validatedData.notes && validatedData.notes !== '' ? validatedData.notes : undefined,
    });

    res.status(201).json({
      success: true,
      data: quote,
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
        message: error.message || 'Failed to create quote',
      },
    });
  }
};

export const updateQuote = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updateQuoteSchema.parse(req.body);

    // Check if quote can be updated (not converted to invoice)
    const existingQuote = await prisma.quote.findUnique({
      where: { id },
    });

    if (!existingQuote) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Quote not found',
        },
      });
    }

    if (existingQuote.convertedToInvoice) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Cannot update quote that has been converted to invoice',
        },
      });
    }

    // Only allow editing quotes in DRAFT status
    if (existingQuote.status !== 'DRAFT') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Cannot update quote. Only draft quotes can be edited.',
        },
      });
    }

    // Recalculate totals if items are updated
    let updateData: any = {};
    if (validatedData.items) {
      const { subtotal, taxAmount, total } = calculateQuoteTotals(validatedData.items as QuoteItemInput[]);
      updateData.subtotal = subtotal;
      updateData.taxAmount = taxAmount;
      updateData.total = total;

      // Delete existing items and create new ones
      await prisma.quoteItem.deleteMany({
        where: { quoteId: id },
      });

      updateData.items = {
        create: validatedData.items.map((item) => ({
          itemId: item.itemId || null,
          name: item.name,
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          taxRate: item.taxRate,
          amount: item.quantity * item.rate,
        })),
      };
    }

    if (validatedData.contactId) updateData.contactId = validatedData.contactId;
    
    // Handle templateId - preserve existing if not provided, or update if provided
    if (validatedData.templateId !== undefined) {
      // If templateId is provided (even if empty string), update it
      updateData.templateId = validatedData.templateId && validatedData.templateId !== '' ? validatedData.templateId : null;
    } else {
      // If templateId is not provided, preserve the existing one
      updateData.templateId = existingQuote.templateId;
    }
    
    // Handle projectId
    if (validatedData.projectId !== undefined) {
      updateData.projectId = validatedData.projectId && validatedData.projectId !== '' ? validatedData.projectId : null;
    } else {
      updateData.projectId = existingQuote.projectId;
    }
    
    // Handle paymentTerms
    if (validatedData.paymentTerms !== undefined) {
      updateData.paymentTerms = validatedData.paymentTerms;
    } else {
      updateData.paymentTerms = existingQuote.paymentTerms;
    }
    
    // Handle issueDate and expiryDate
    if (validatedData.issueDate) {
      updateData.issueDate = new Date(validatedData.issueDate);
    }
    
    // Calculate expiryDate based on paymentTerms if provided
    if (validatedData.paymentTerms && validatedData.paymentTerms !== 'Custom' && validatedData.issueDate) {
      const issueDate = new Date(validatedData.issueDate);
      const expiryDate = new Date(issueDate);
      
      switch (validatedData.paymentTerms) {
        case 'Due on Receipt':
          // Same day
          break;
        case 'Net 15':
          expiryDate.setDate(expiryDate.getDate() + 15);
          break;
        case 'Net 30':
          expiryDate.setDate(expiryDate.getDate() + 30);
          break;
        case 'Net 45':
          expiryDate.setDate(expiryDate.getDate() + 45);
          break;
        case 'Net 60':
          expiryDate.setDate(expiryDate.getDate() + 60);
          break;
      }
      updateData.expiryDate = expiryDate;
    } else if (validatedData.expiryDate) {
      updateData.expiryDate = new Date(validatedData.expiryDate);
    } else if (validatedData.issueDate && existingQuote.paymentTerms && existingQuote.paymentTerms !== 'Custom') {
      // Recalculate if issueDate changed but paymentTerms didn't
      const issueDate = new Date(validatedData.issueDate);
      const expiryDate = new Date(issueDate);
      
      switch (existingQuote.paymentTerms) {
        case 'Due on Receipt':
          break;
        case 'Net 15':
          expiryDate.setDate(expiryDate.getDate() + 15);
          break;
        case 'Net 30':
          expiryDate.setDate(expiryDate.getDate() + 30);
          break;
        case 'Net 45':
          expiryDate.setDate(expiryDate.getDate() + 45);
          break;
        case 'Net 60':
          expiryDate.setDate(expiryDate.getDate() + 60);
          break;
      }
      updateData.expiryDate = expiryDate;
    }
    
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes;

    const quote = await prisma.quote.update({
      where: { id },
      data: updateData,
      include: {
        contact: true,
        items: true,
        template: true,
        project: true,
      },
    });


    res.json({
      success: true,
      data: quote,
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
        message: error.message || 'Failed to update quote',
      },
    });
  }
};

export const updateQuoteStatusController = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = updateQuoteStatusSchema.parse(req.body);

    const quote = await updateQuoteStatus(id, status as 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED');

    res.json({
      success: true,
      data: quote,
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
        message: error.message || 'Failed to update quote status',
      },
    });
  }
};

export const deleteQuote = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const quote = await prisma.quote.findUnique({
      where: { id },
    });

    if (quote?.convertedToInvoice) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Cannot delete quote that has been converted to invoice',
        },
      });
    }

    await prisma.quote.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Quote deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to delete quote',
      },
    });
  }
};

export const sendQuoteEmail = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { to, subject, message } = req.body;

    if (!to || !subject || !message) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Email address, subject, and message are required',
        },
      });
    }

    // Get quote with all related data
    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        contact: true,
        items: true,
        template: true,
        project: true,
      },
    });

    if (!quote) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Quote not found',
        },
      });
    }

    // Get template
    let template = quote.template;
    if (!template) {
      template = await getDefaultQuoteTemplate();
    } else if (template.isDefault) {
      template = await getDefaultQuoteTemplate();
    }

    // Render the template HTML
    const renderedHTML = renderQuoteTemplate(
      template.content,
      {
        ...quote,
        template: {
          id: template.id,
          name: template.name,
        },
      } as any,
      {
        name: 'Test',
        city: 'Gujarat',
        country: 'India',
        email: 'jayesh.prajapati@aipxperts.com',
      }
    );

    // Generate PDF from HTML
    const pdfBuffer = await generatePDFFromHTML(renderedHTML);

    // Send email with PDF attachment
    await sendDocumentEmail(
      to,
      subject,
      message,
      pdfBuffer,
      quote.quoteNumber
    );

    // Update quote status to SENT after successful email send
    await updateQuoteStatus(id, 'SENT');

    // Create activity log for email sent
    if (req.user && req.user.userId) {
      await prisma.activityLog.create({
        data: {
          contactId: quote.contactId,
          userId: req.user.userId,
          action: 'QUOTE_EMAIL_SENT',
          description: `Quote ${quote.quoteNumber} sent via email to ${to}`,
          metadata: {
            quoteId: quote.id,
            quoteNumber: quote.quoteNumber,
            emailTo: to,
            subject: subject,
            contactName: quote.contact.name,
          },
        },
      });
    }

    res.json({
      success: true,
      message: 'Quote sent via email successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to send quote email',
      },
    });
  }
};

export const getRenderedQuoteTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { templateId } = req.query;

    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        contact: true,
        items: true,
        template: true,
        project: true,
      },
    });

    if (!quote) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Quote not found',
        },
      });
    }

    // Get template - use templateId from query if provided, otherwise use quote's template
    let template = quote.template;
    if (templateId && typeof templateId === 'string') {
      const selectedTemplate = await prisma.template.findUnique({
        where: { id: templateId },
      });
      if (selectedTemplate) {
        template = selectedTemplate;
      }
    }
    
    if (!template) {
      template = await getDefaultQuoteTemplate();
    } else if (template.isDefault) {
      template = await getDefaultQuoteTemplate();
    }

    // Render the template HTML with quote data
    const renderedHTML = renderQuoteTemplate(
      template.content,
      {
        ...quote,
        template: {
          id: template.id,
          name: template.name,
        },
      } as any,
      {
        name: 'Test',
        city: 'Gujarat',
        country: 'India',
        email: 'jayesh.prajapati@aipxperts.com',
      }
    );

    res.json({
      success: true,
      data: {
        renderedHTML,
        template: {
          id: template.id,
          name: template.name,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to render quote',
      },
    });
  }
};

