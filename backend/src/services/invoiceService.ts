import { Decimal } from '@prisma/client/runtime/library';
import prisma from '../config/database';
import { generateInvoiceNumber } from '../utils/invoiceNumberGenerator';
import { getBillableHoursByProjectAndDateRange } from './timesheetService';
import { updateFinancialSummary } from './contactService';

interface InvoiceItemInput {
  itemId?: string;
  type?: 'ITEM' | 'HEADER' | 'TIMESHEET';
  name: string;
  description?: string;
  quantity: number;
  rate: number;
  taxRate: number;
}

interface CreateInvoiceInput {
  contactId: string;
  templateId?: string;
  projectId?: string;
  paymentTerms?: string;
  issueDate?: Date;
  dueDate?: Date;
  items: InvoiceItemInput[];
  notes?: string;
  quoteId?: string;
}

export const calculateInvoiceTotals = (items: InvoiceItemInput[]) => {
  let subtotal = new Decimal(0);
  let taxAmount = new Decimal(0);

  items.forEach((item: any) => {
    // Skip headers in calculations
    if (item.type === 'HEADER') return;
    
    const amount = new Decimal(item.quantity).mul(item.rate);
    subtotal = subtotal.add(amount);
    const itemTax = amount.mul(new Decimal(item.taxRate).div(100));
    taxAmount = taxAmount.add(itemTax);
  });

  const total = subtotal.add(taxAmount);

  return {
    subtotal,
    taxAmount,
    total,
  };
};

// Helper function to calculate due date based on payment terms
const calculateDueDate = (issueDate: Date, paymentTerms?: string, providedDueDate?: Date): Date | undefined => {
  if (providedDueDate) {
    return providedDueDate;
  }
  
  if (!paymentTerms || paymentTerms === 'Custom') {
    return undefined;
  }

  const dueDate = new Date(issueDate);
  
  switch (paymentTerms) {
    case 'Due on Receipt':
      // Same day
      return dueDate;
    case 'Net 15':
      dueDate.setDate(dueDate.getDate() + 15);
      return dueDate;
    case 'Net 30':
      dueDate.setDate(dueDate.getDate() + 30);
      return dueDate;
    case 'Net 45':
      dueDate.setDate(dueDate.getDate() + 45);
      return dueDate;
    case 'Net 60':
      dueDate.setDate(dueDate.getDate() + 60);
      return dueDate;
    default:
      return undefined;
  }
};

export const createInvoice = async (data: CreateInvoiceInput) => {
  const invoiceNumber = await generateInvoiceNumber();
  
  const issueDate = data.issueDate || new Date();
  const projectId = data.projectId && data.projectId !== '' ? data.projectId : undefined;
  
  // Check if timesheet items are already included in the items array
  const hasTimesheetItems = data.items.some((item: any) => item.type === 'TIMESHEET');
  
  // If projectId is provided and no timesheet items exist, fetch and add them
  let allItems = [...data.items];
  if (projectId && !hasTimesheetItems) {
    try {
      const endDate = new Date();
      const timesheetData = await getBillableHoursByProjectAndDateRange(projectId, issueDate, endDate);
      
      if (timesheetData.timesheets.length > 0) {
        // Add header for timesheet section
        allItems.push({
          name: 'Timesheet Hours',
          description: '',
          quantity: 0,
          rate: 0,
          taxRate: 0,
          type: 'HEADER',
        } as any);
        
        // Add individual timesheet entries
        timesheetData.timesheets.forEach((timesheet) => {
          const hours = Number(timesheet.hours);
          const cost = hours * timesheetData.hourlyRate;
          allItems.push({
            name: `Work on ${new Date(timesheet.date).toLocaleDateString()}`,
            description: timesheet.description || `${hours} hours @ ₹${timesheetData.hourlyRate}/hr`,
            quantity: hours,
            rate: timesheetData.hourlyRate,
            taxRate: 0,
            type: 'TIMESHEET',
          } as any);
        });
      }
    } catch (error) {
      // If timesheet fetch fails, continue without timesheet items
      console.error('Failed to fetch timesheet hours:', error);
    }
  }
  
  const { subtotal, taxAmount, total } = calculateInvoiceTotals(allItems);

  const dueDate = calculateDueDate(issueDate, data.paymentTerms, data.dueDate);

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      contactId: data.contactId,
      templateId: data.templateId,
      projectId: projectId,
      paymentTerms: data.paymentTerms,
      issueDate: issueDate,
      dueDate: dueDate,
      subtotal,
      taxAmount,
      total,
      notes: data.notes,
      quoteId: data.quoteId,
      items: {
        create: allItems.map((item: any) => ({
          itemId: item.itemId || null,
          type: item.type || 'ITEM',
          name: item.name,
          description: item.description,
          quantity: item.type === 'HEADER' ? 0 : item.quantity,
          rate: item.type === 'HEADER' ? 0 : item.rate,
          taxRate: item.type === 'HEADER' ? 0 : item.taxRate,
          amount: item.type === 'HEADER' ? 0 : item.quantity * item.rate,
        })),
      },
    },
    include: {
      contact: true,
      items: true,
      template: true,
      project: true,
    },
  });

  // If created from quote, mark quote as converted and set status to INVOICED
  if (data.quoteId) {
    await prisma.quote.update({
      where: { id: data.quoteId },
      data: {
        convertedToInvoice: true,
        invoiceId: invoice.id,
        status: 'INVOICED',
      },
    });
  }

  // Update financial summary if invoice is SENT or OVERDUE (affects receivables)
  if (invoice.status === 'SENT' || invoice.status === 'OVERDUE') {
    await updateFinancialSummary(data.contactId);
  }

  return invoice;
};

export const updateInvoiceStatus = async (
  invoiceId: string,
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE',
  paidAmount?: number
) => {
  const updateData: any = { status };
  
  if (paidAmount !== undefined) {
    updateData.paidAmount = paidAmount;
  }

  // Auto-update to OVERDUE if due date passed and status is SENT
  if (status === 'SENT') {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });
    
    if (invoice?.dueDate && new Date(invoice.dueDate) < new Date()) {
      updateData.status = 'OVERDUE';
    }
  }

  const updatedInvoice = await prisma.invoice.update({
    where: { id: invoiceId },
    data: updateData,
    include: {
      contact: true,
      items: true,
      template: true,
    },
  });

  // Update financial summary if status changed to/from SENT/OVERDUE/PAID
  // (affects receivables and total income)
  await updateFinancialSummary(updatedInvoice.contactId);

  return updatedInvoice;
};

