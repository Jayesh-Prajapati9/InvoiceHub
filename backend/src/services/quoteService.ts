import { Decimal } from '@prisma/client/runtime/library';
import prisma from '../config/database';
import { generateQuoteNumber } from '../utils/quoteNumberGenerator';
import { getBillableHoursByProjectAndDateRange } from './timesheetService';

interface QuoteItemInput {
  itemId?: string;
  name: string;
  description?: string;
  quantity: number;
  rate: number;
  taxRate: number;
}

interface CreateQuoteInput {
  contactId: string;
  templateId?: string;
  projectId?: string;
  paymentTerms?: string;
  issueDate?: Date;
  expiryDate?: Date;
  items: QuoteItemInput[];
  notes?: string;
}

export const calculateQuoteTotals = (items: QuoteItemInput[]) => {
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

import { getDefaultTemplate } from '../utils/templateHelper';

// Helper function to calculate expiry date based on payment terms
const calculateExpiryDate = (issueDate: Date, paymentTerms?: string, providedExpiryDate?: Date): Date | undefined => {
  if (providedExpiryDate) {
    return providedExpiryDate;
  }
  
  if (!paymentTerms || paymentTerms === 'Custom') {
    return undefined;
  }

  const expiryDate = new Date(issueDate);
  
  switch (paymentTerms) {
    case 'Due on Receipt':
      // Same day
      return expiryDate;
    case 'Net 15':
      expiryDate.setDate(expiryDate.getDate() + 15);
      return expiryDate;
    case 'Net 30':
      expiryDate.setDate(expiryDate.getDate() + 30);
      return expiryDate;
    case 'Net 45':
      expiryDate.setDate(expiryDate.getDate() + 45);
      return expiryDate;
    case 'Net 60':
      expiryDate.setDate(expiryDate.getDate() + 60);
      return expiryDate;
    default:
      return undefined;
  }
};

export const createQuote = async (data: CreateQuoteInput) => {
  const quoteNumber = await generateQuoteNumber();
  
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
  
  const { subtotal, taxAmount, total } = calculateQuoteTotals(allItems);

  // If no template is provided, use the default template
  let templateId = data.templateId && data.templateId !== '' ? data.templateId : undefined;
  if (!templateId) {
    const defaultTemplate = await getDefaultTemplate();
    templateId = defaultTemplate.id;
  }

  const expiryDate = calculateExpiryDate(issueDate, data.paymentTerms, data.expiryDate);

  const quote = await prisma.quote.create({
    data: {
      quoteNumber,
      contactId: data.contactId,
      templateId: templateId,
      projectId: projectId,
      paymentTerms: data.paymentTerms,
      issueDate: issueDate,
      expiryDate: expiryDate,
      subtotal,
      taxAmount,
      total,
      notes: data.notes,
      items: {
        create: allItems.map((item: any) => ({
          itemId: item.itemId || null,
          type: item.type || 'ITEM',
          name: item.name,
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          taxRate: item.taxRate,
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

  return quote;
};

export const updateQuoteStatus = async (
  quoteId: string,
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED'
) => {
  return await prisma.quote.update({
    where: { id: quoteId },
    data: { status },
    include: {
      contact: true,
      items: true,
    },
  });
};

