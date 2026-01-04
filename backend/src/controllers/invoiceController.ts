import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import {
  createInvoiceSchema,
  updateInvoiceSchema,
  updateInvoiceStatusSchema,
} from '../validators/invoiceValidator';
import { createInvoice, updateInvoiceStatus, calculateInvoiceTotals } from '../services/invoiceService';
import { convertBillableHoursToInvoiceItems } from '../services/timesheetService';
import { renderInvoiceTemplate } from '../utils/handlebarsTemplateRenderer';
import { getDefaultInvoiceTemplate } from '../utils/templateHelper';
import { generatePDFFromHTML } from '../services/pdfService';
import { sendDocumentEmail } from '../services/emailService';

export const getInvoices = async (req: AuthRequest, res: Response) => {
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
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { contact: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        include: {
          contact: true,
          items: true,
          quote: {
            select: {
              quoteNumber: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.invoice.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        invoices,
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
        message: error.message || 'Failed to fetch invoices',
      },
    });
  }
};

export const getInvoiceById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        contact: true,
        items: true,
        template: true,
        payments: {
          orderBy: {
            paymentDate: 'desc',
          },
        },
      },
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Invoice not found',
        },
      });
    }

    // Fetch quote if quoteId exists
    let quote = null;
    if (invoice.quoteId) {
      quote = await prisma.quote.findUnique({
        where: { id: invoice.quoteId },
        select: {
          id: true,
          quoteNumber: true,
          status: true,
        },
      });
    }

    // Use the template assigned to the invoice, or default if none
    let template = invoice.template;
    
    // If templateId exists but template relation is null, fetch it explicitly
    if (!template && invoice.templateId) {
      template = await prisma.template.findUnique({
        where: { id: invoice.templateId },
      });
    }
    
    // Only use default if no template is assigned
    if (!template) {
      template = await getDefaultInvoiceTemplate();
    }
    // If template is already marked as default, use it as-is (don't replace)

    // Render the template HTML with invoice data
    const renderedHTML = renderInvoiceTemplate(
      template.content,
      {
        ...invoice,
        quote, // Include quote if associated
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
        ...invoice,
        template, // Always include template (either selected or default)
        renderedHTML, // Include rendered HTML for display
        quote, // Include quote if associated
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to fetch invoice',
      },
    });
  }
};

export const createInvoiceController = async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = createInvoiceSchema.parse(req.body);

    // Clean up items - convert empty strings to undefined
    const cleanedItems = validatedData.items.map((item) => ({
      ...item,
      type: item.type || 'ITEM',
      itemId: item.itemId && item.itemId !== '' ? item.itemId : undefined,
      description: item.description && item.description !== '' ? item.description : undefined,
      // Headers should have quantity and rate as 0
      quantity: item.type === 'HEADER' ? 0 : item.quantity,
      rate: item.type === 'HEADER' ? 0 : item.rate,
      taxRate: item.type === 'HEADER' ? 0 : item.taxRate,
    }));

    const templateIdToSave = validatedData.templateId && validatedData.templateId !== '' ? validatedData.templateId : undefined;

    const invoice = await createInvoice({
      contactId: validatedData.contactId,
      templateId: templateIdToSave,
      projectId: validatedData.projectId && validatedData.projectId !== '' ? validatedData.projectId : undefined,
      paymentTerms: validatedData.paymentTerms,
      issueDate: validatedData.issueDate && validatedData.issueDate !== '' ? new Date(validatedData.issueDate) : undefined,
      dueDate: validatedData.dueDate && validatedData.dueDate !== '' ? new Date(validatedData.dueDate) : undefined,
      items: cleanedItems,
      notes: validatedData.notes && validatedData.notes !== '' ? validatedData.notes : undefined,
      quoteId: validatedData.quoteId && validatedData.quoteId !== '' ? validatedData.quoteId : undefined,
    });

    res.status(201).json({
      success: true,
      data: invoice,
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
        message: error.message || 'Failed to create invoice',
      },
    });
  }
};

// Get quote data for invoice form pre-population
export const getQuoteForInvoice = async (req: AuthRequest, res: Response) => {
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

    if (quote.convertedToInvoice) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Quote has already been converted to invoice',
        },
      });
    }

    if (quote.status !== 'SENT') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Only sent quotes can be converted to invoices',
        },
      });
    }

    // Return quote data formatted for invoice form
    res.json({
      success: true,
      data: {
        quoteId: quote.id,
        contactId: quote.contactId,
        templateId: quote.templateId,
        projectId: quote.projectId,
        paymentTerms: quote.paymentTerms,
        issueDate: quote.issueDate,
        items: quote.items.map((item) => ({
          itemId: item.itemId || undefined,
          type: 'ITEM' as const,
          name: item.name,
          description: item.description || undefined,
          quantity: Number(item.quantity),
          rate: Number(item.rate),
          taxRate: Number(item.taxRate),
        })),
        notes: quote.notes || undefined,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to fetch quote data',
      },
    });
  }
};

export const createInvoiceFromQuote = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        contact: true,
        items: true,
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

    if (quote.convertedToInvoice) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Quote has already been converted to invoice',
        },
      });
    }

    if (quote.status !== 'SENT') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Only sent quotes can be converted to invoices',
        },
      });
    }

    const invoice = await createInvoice({
      contactId: quote.contactId,
      issueDate: new Date(),
      items: quote.items.map((item) => ({
        itemId: item.itemId || undefined,
        name: item.name,
        description: item.description || undefined,
        quantity: Number(item.quantity),
        rate: Number(item.rate),
        taxRate: Number(item.taxRate),
      })),
      notes: quote.notes || undefined,
      quoteId: quote.id,
    });

    res.status(201).json({
      success: true,
      data: invoice,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to create invoice from quote',
      },
    });
  }
};

export const updateInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    let validatedData;
    try {
      validatedData = updateInvoiceSchema.parse(req.body);
    } catch (validationError: any) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation error',
          details: validationError.errors || validationError.message || validationError,
        },
      });
    }

    const existingInvoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!existingInvoice) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Invoice not found',
        },
      });
    }

    // Cannot update sent/paid invoices
    if (existingInvoice.status !== 'DRAFT') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Cannot update invoice that has been sent or paid',
        },
      });
    }

    let updateData: any = {};
    if (validatedData.items && Array.isArray(validatedData.items) && validatedData.items.length > 0) {
      // Filter out items with empty names
      const validItems = validatedData.items.filter((item: any) => item.name && item.name.trim().length > 0);
      
      if (validItems.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'At least one item or header must have a name',
          },
        });
      }
      
      const { subtotal, taxAmount, total } = calculateInvoiceTotals(validItems);
      updateData.subtotal = subtotal;
      updateData.taxAmount = taxAmount;
      updateData.total = total;

      await prisma.invoiceItem.deleteMany({
        where: { invoiceId: id },
      });

      updateData.items = {
        create: validItems.map((item: any) => ({
          itemId: item.itemId || null,
          type: item.type || 'ITEM',
          name: item.name.trim(),
          description: item.description || null,
          quantity: item.type === 'HEADER' ? 0 : Number(item.quantity),
          rate: item.type === 'HEADER' ? 0 : Number(item.rate),
          taxRate: item.type === 'HEADER' ? 0 : Number(item.taxRate),
          amount: item.type === 'HEADER' ? 0 : (Number(item.quantity) * Number(item.rate)),
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
      updateData.templateId = existingInvoice.templateId;
    }
    
    // Handle projectId
    if (validatedData.projectId !== undefined) {
      updateData.projectId = validatedData.projectId && validatedData.projectId !== '' ? validatedData.projectId : null;
    } else {
      updateData.projectId = existingInvoice.projectId;
    }
    
    // Handle paymentTerms
    if (validatedData.paymentTerms !== undefined) {
      updateData.paymentTerms = validatedData.paymentTerms;
    } else {
      updateData.paymentTerms = existingInvoice.paymentTerms;
    }
    
    // Handle issueDate and dueDate
    if (validatedData.issueDate) {
      updateData.issueDate = new Date(validatedData.issueDate);
    }
    
    // Calculate dueDate based on paymentTerms if provided
    if (validatedData.paymentTerms && validatedData.paymentTerms !== 'Custom' && validatedData.issueDate) {
      const issueDate = new Date(validatedData.issueDate);
      const dueDate = new Date(issueDate);
      
      switch (validatedData.paymentTerms) {
        case 'Due on Receipt':
          // Same day
          break;
        case 'Net 15':
          dueDate.setDate(dueDate.getDate() + 15);
          break;
        case 'Net 30':
          dueDate.setDate(dueDate.getDate() + 30);
          break;
        case 'Net 45':
          dueDate.setDate(dueDate.getDate() + 45);
          break;
        case 'Net 60':
          dueDate.setDate(dueDate.getDate() + 60);
          break;
      }
      updateData.dueDate = dueDate;
    } else if (validatedData.dueDate) {
      updateData.dueDate = new Date(validatedData.dueDate);
    } else if (validatedData.issueDate && existingInvoice.paymentTerms && existingInvoice.paymentTerms !== 'Custom') {
      // Recalculate if issueDate changed but paymentTerms didn't
      const issueDate = new Date(validatedData.issueDate);
      const dueDate = new Date(issueDate);
      
      switch (existingInvoice.paymentTerms) {
        case 'Due on Receipt':
          break;
        case 'Net 15':
          dueDate.setDate(dueDate.getDate() + 15);
          break;
        case 'Net 30':
          dueDate.setDate(dueDate.getDate() + 30);
          break;
        case 'Net 45':
          dueDate.setDate(dueDate.getDate() + 45);
          break;
        case 'Net 60':
          dueDate.setDate(dueDate.getDate() + 60);
          break;
      }
      updateData.dueDate = dueDate;
    }
    
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes;

    const invoice = await prisma.invoice.update({
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
      data: invoice,
    });
  } catch (error: any) {
    console.error('Update invoice error:', error);
    if (error.name === 'ZodError') {
      console.error('Validation errors:', error.errors);
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
        message: error.message || 'Failed to update invoice',
      },
    });
  }
};

export const updateInvoiceStatusController = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, paidAmount } = updateInvoiceStatusSchema.parse(req.body);

    const invoice = await updateInvoiceStatus(id, status, paidAmount);

    res.json({
      success: true,
      data: invoice,
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
        message: error.message || 'Failed to update invoice status',
      },
    });
  }
};

export const deleteInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (invoice && invoice.status !== 'DRAFT') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Cannot delete invoice that has been sent or paid',
        },
      });
    }

    await prisma.invoice.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Invoice deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to delete invoice',
      },
    });
  }
};

export const addProjectHoursToInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const { invoiceId, projectId } = req.body;

    if (!invoiceId || !projectId) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invoice ID and Project ID are required',
        },
      });
    }

    await convertBillableHoursToInvoiceItems(projectId, invoiceId);

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        contact: true,
        items: true,
        template: true,
      },
    });

    res.json({
      success: true,
      data: invoice,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to add project hours to invoice',
      },
    });
  }
};

export const renderInvoiceWithTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { templateId } = req.query;

    // Get invoice with all related data
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        contact: true,
        items: true,
        template: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Invoice not found',
        },
      });
    }

    // Fetch quote if quoteId exists
    let quote = null;
    if (invoice.quoteId) {
      quote = await prisma.quote.findUnique({
        where: { id: invoice.quoteId },
        select: {
          id: true,
          quoteNumber: true,
          status: true,
        },
      });
    }

    // Get template - use templateId from query if provided, otherwise use invoice's template
    let template = invoice.template;
    if (templateId && typeof templateId === 'string') {
      const selectedTemplate = await prisma.template.findUnique({
        where: { id: templateId },
      });
      if (selectedTemplate) {
        template = selectedTemplate;
      }
    }
    
    if (!template) {
      template = await getDefaultInvoiceTemplate();
    }
    // If template is already marked as default, use it as-is (don't replace)

    // Render the template HTML with invoice data
    const renderedHTML = renderInvoiceTemplate(
      template.content,
      {
        ...invoice,
        quote, // Include quote if associated
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
        message: error.message || 'Failed to render invoice',
      },
    });
  }
};

export const sendInvoiceEmail = async (req: AuthRequest, res: Response) => {
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

    // Get invoice with all related data
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        contact: true,
        items: true,
        template: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Invoice not found',
        },
      });
    }

    // Fetch quote if quoteId exists
    let quote = null;
    if (invoice.quoteId) {
      quote = await prisma.quote.findUnique({
        where: { id: invoice.quoteId },
        select: {
          id: true,
          quoteNumber: true,
          status: true,
        },
      });
    }

    // Get template
    let template = invoice.template;
    if (!template) {
      template = await getDefaultInvoiceTemplate();
    }
    // If template is already marked as default, use it as-is (don't replace)

    // Render the template HTML
    const renderedHTML = renderInvoiceTemplate(
      template.content,
      {
        ...invoice,
        quote,
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
      invoice.invoiceNumber
    );

    // Update invoice status to SENT after successful email send
    await updateInvoiceStatus(id, 'SENT');

    // Create activity log for email sent
    if (req.user && req.user.userId) {
      await prisma.activityLog.create({
        data: {
          contactId: invoice.contactId,
          userId: req.user.userId,
          action: 'INVOICE_EMAIL_SENT',
          description: `Invoice ${invoice.invoiceNumber} sent via email to ${to}`,
          metadata: {
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            emailTo: to,
            subject: subject,
            contactName: invoice.contact.name,
          },
        },
      });
    }

    res.json({
      success: true,
      message: 'Invoice sent via email successfully',
    });
  } catch (error: any) {
    console.error('Error sending invoice email:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to send invoice email',
      },
    });
  }
};
