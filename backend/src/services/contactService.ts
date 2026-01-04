import { Decimal } from '@prisma/client/runtime/library';
import prisma from '../config/database';

/**
 * Calculate outstanding receivables for a contact
 * Sum of all unpaid invoices (total - paidAmount)
 */
export const calculateReceivables = async (contactId: string): Promise<Decimal> => {
  const invoices = await prisma.invoice.findMany({
    where: {
      contactId,
      status: {
        in: ['SENT', 'OVERDUE'],
      },
    },
    select: {
      total: true,
      paidAmount: true,
    },
  });

  let receivables = new Decimal(0);
  invoices.forEach((invoice) => {
    const outstanding = new Decimal(invoice.total).minus(invoice.paidAmount);
    receivables = receivables.add(outstanding);
  });

  return receivables;
};

/**
 * Calculate unused credits for a contact
 * For now, returns 0 as credits feature is not implemented
 */
export const calculateUnusedCredits = async (contactId: string): Promise<Decimal> => {
  // TODO: Implement credits calculation when credits feature is added
  return new Decimal(0);
};

/**
 * Calculate quote statistics for a contact
 * Returns statistics about all quotes, with potential income from non-converted quotes
 */
export const calculateQuoteStatistics = async (contactId: string) => {
  // Get all quotes for the contact (including converted ones for statistics)
  const allQuotes = await prisma.quote.findMany({
    where: {
      contactId,
    },
    select: {
      total: true,
      status: true,
      convertedToInvoice: true,
    },
  });

  // Separate converted and non-converted quotes
  const nonConvertedQuotes = allQuotes.filter((q) => !q.convertedToInvoice);
  
  let totalValue = new Decimal(0);
  let potentialIncome = new Decimal(0);
  let pendingCount = 0;
  let acceptedCount = 0;

  // Calculate statistics from all quotes
  allQuotes.forEach((quote) => {
    totalValue = totalValue.add(quote.total);

    if (quote.status === 'SENT' || quote.status === 'DRAFT') {
      pendingCount++;
    } else if (quote.status === 'ACCEPTED') {
      acceptedCount++;
    }
  });

  // Calculate potential income only from non-converted quotes
  nonConvertedQuotes.forEach((quote) => {
    potentialIncome = potentialIncome.add(quote.total);
  });

  return {
    totalValue, // Total value of all quotes (historical)
    totalCount: allQuotes.length, // Total count of all quotes
    pendingCount, // Count of pending quotes (all, including converted)
    acceptedCount, // Count of accepted quotes (all, including converted)
    potentialIncome, // Only non-converted quotes represent potential income
  };
};

/**
 * Get income and expense data for chart
 * Returns monthly data for the specified number of months
 */
export const getIncomeExpenseData = async (
  contactId: string,
  months: number = 4
): Promise<Array<{ month: string; income: number; expense: number }>> => {
  // Set endDate to end of today to include all of today's data
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);
  
  // Calculate startDate as months months ago
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  startDate.setHours(0, 0, 0, 0);

  // Get paid invoices (income)
  const invoices = await prisma.invoice.findMany({
    where: {
      contactId,
      status: 'PAID',
      issueDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      issueDate: true,
      total: true,
    },
  });

  // Group by month
  const monthlyData: Record<string, { income: number; expense: number }> = {};

  // Initialize all months with 0
  // Calculate the last N months including the current month
  // Use endDate (which is today) to ensure consistency with invoice date filtering
  const currentYear = endDate.getFullYear();
  const currentMonth = endDate.getMonth(); // 0-indexed (0=Jan, 11=Dec)
  
  // Calculate the last N months including the current month
  // If today is December 2025 and months=4, we want: Sep, Oct, Nov, Dec
  // We need to go back (months-1) months from current, then include current
  for (let i = 0; i < months; i++) {
    // Go back (months - 1 - i) months from current month
    // For months=4, i=0,1,2,3: go back 3,2,1,0 months
    // This gives: (current-3), (current-2), (current-1), (current)
    const monthsBack = months - 1 - i;
    let targetMonth = currentMonth - monthsBack;
    let targetYear = currentYear;
    
    // Handle year rollover if targetMonth is negative
    while (targetMonth < 0) {
      targetMonth += 12;
      targetYear -= 1;
    }
    
    // Ensure we don't exceed 11 (December)
    while (targetMonth > 11) {
      targetMonth -= 12;
      targetYear += 1;
    }
    
    // Construct month key directly to avoid timezone issues
    // targetMonth is 0-indexed (0=Jan, 11=Dec), but we need 1-indexed for YYYY-MM format
    const monthKey = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}`; // YYYY-MM
    monthlyData[monthKey] = { income: 0, expense: 0 };
  }

  // Calculate income from invoices
  invoices.forEach((invoice) => {
    const monthKey = invoice.issueDate.toISOString().slice(0, 7);
    if (monthlyData[monthKey]) {
      monthlyData[monthKey].income += Number(invoice.total);
    }
  });

  // Convert to array format and sort by month to ensure chronological order
  const result = Object.entries(monthlyData)
    .map(([month, data]) => ({
      month,
      income: data.income,
      expense: data.expense, // Expenses can be added later
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return result;
};

/**
 * Update or create financial summary for a contact
 */
export const updateFinancialSummary = async (contactId: string) => {
  const receivables = await calculateReceivables(contactId);
  const unusedCredits = await calculateUnusedCredits(contactId);

  // Calculate total income (sum of all paid invoices)
  const paidInvoices = await prisma.invoice.findMany({
    where: {
      contactId,
      status: 'PAID',
    },
    select: {
      total: true,
    },
  });

  let totalIncome = new Decimal(0);
  paidInvoices.forEach((invoice) => {
    totalIncome = totalIncome.add(invoice.total);
  });

  // Upsert financial summary
  await prisma.contactFinancialSummary.upsert({
    where: { contactId },
    update: {
      outstandingReceivables: receivables,
      unusedCredits,
      totalIncome,
      lastUpdated: new Date(),
    },
    create: {
      contactId,
      outstandingReceivables: receivables,
      unusedCredits,
      totalIncome,
      lastUpdated: new Date(),
    },
  });

  return {
    outstandingReceivables: receivables,
    unusedCredits,
    totalIncome,
  };
};

/**
 * Get financial summary for a contact (with caching)
 */
export const getFinancialSummary = async (contactId: string) => {
  // Check if summary exists and is recent (within 1 hour)
  const summary = await prisma.contactFinancialSummary.findUnique({
    where: { contactId },
  });

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  // Calculate quote statistics (always calculated on the fly, not cached)
  const quoteStatistics = await calculateQuoteStatistics(contactId);

  if (summary && summary.lastUpdated > oneHourAgo) {
    return {
      outstandingReceivables: summary.outstandingReceivables,
      unusedCredits: summary.unusedCredits,
      totalIncome: summary.totalIncome,
      currency: 'INR', // TODO: Get from contact's defaultCurrency
      quoteStatistics: {
        totalValue: quoteStatistics.totalValue,
        totalCount: quoteStatistics.totalCount,
        pendingCount: quoteStatistics.pendingCount,
        acceptedCount: quoteStatistics.acceptedCount,
        potentialIncome: quoteStatistics.potentialIncome,
      },
    };
  }

  // Recalculate if cache is stale or doesn't exist
  const financialData = await updateFinancialSummary(contactId);
  
  return {
    ...financialData,
    currency: 'INR', // TODO: Get from contact's defaultCurrency
    quoteStatistics: {
      totalValue: quoteStatistics.totalValue,
      totalCount: quoteStatistics.totalCount,
      pendingCount: quoteStatistics.pendingCount,
      acceptedCount: quoteStatistics.acceptedCount,
      potentialIncome: quoteStatistics.potentialIncome,
    },
  };
};

