import { Decimal } from '@prisma/client/runtime/library';
import prisma from '../config/database';
import { generatePaymentNumber } from '../utils/paymentNumberGenerator';
import { CreatePaymentInput, UpdatePaymentInput } from '../validators/paymentValidator';
import { updateFinancialSummary } from './contactService';

export const createPayment = async (data: CreatePaymentInput) => {
  // Verify invoice exists
  const invoice = await prisma.invoice.findUnique({
    where: { id: data.invoiceId },
  });

  if (!invoice) {
    throw new Error('Invoice not found');
  }

  // Only allow payments for SENT or OVERDUE invoices
  if (invoice.status !== 'SENT' && invoice.status !== 'OVERDUE') {
    throw new Error('Payments can only be recorded for sent or overdue invoices');
  }

  // Calculate balance due
  const balanceDue = Number(invoice.total) - Number(invoice.paidAmount);
  
  // Validate amount received doesn't exceed balance due
  if (data.amountReceived > balanceDue) {
    throw new Error(`Amount received cannot exceed balance due (₹${balanceDue.toFixed(2)})`);
  }

  // Generate payment number if not provided
  const paymentNumber = data.paymentNumber || await generatePaymentNumber();

  // Validate TDS amount if tax deducted
  if (data.taxDeducted && (!data.tdsAmount || data.tdsAmount <= 0)) {
    throw new Error('TDS amount is required when tax is deducted');
  }

  // Create payment
  const payment = await prisma.payment.create({
    data: {
      invoiceId: data.invoiceId,
      paymentNumber,
      amountReceived: data.amountReceived,
      bankCharges: data.bankCharges,
      pan: data.pan,
      taxDeducted: data.taxDeducted,
      tdsAmount: data.tdsAmount,
      paymentDate: data.paymentDate instanceof Date ? data.paymentDate : new Date(data.paymentDate),
      paymentMode: data.paymentMode,
      paymentReceivedOn: data.paymentReceivedOn 
        ? (data.paymentReceivedOn instanceof Date ? data.paymentReceivedOn : new Date(data.paymentReceivedOn))
        : null,
      referenceNumber: data.referenceNumber,
      notes: data.notes,
      status: data.status || 'DRAFT',
    },
    include: {
      invoice: true,
    },
  });

  // Update invoice based on payment status
  if (payment.status === 'PAID') {
    await updateInvoiceFromPayment(invoice.id);
  }
  
  // Always update contact financial summary when payment is created
  // (even if DRAFT, as it might be updated to PAID later)
  await updateFinancialSummary(invoice.contactId);

  return payment;
};

export const updatePayment = async (paymentId: string, data: UpdatePaymentInput) => {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      invoice: true,
    },
  });

  if (!payment) {
    throw new Error('Payment not found');
  }

  // Prevent editing paid payments
  if (payment.status === 'PAID') {
    throw new Error('Cannot edit a payment that has been marked as PAID. You can only delete it.');
  }

  const invoice = payment.invoice;
  const oldStatus = payment.status;
  const oldAmount = Number(payment.amountReceived);

  // Validate amount if being updated
  if (data.amountReceived !== undefined) {
    const currentPaidAmount = Number(invoice.paidAmount);
    const otherPaymentsTotal = await prisma.payment.aggregate({
      where: {
        invoiceId: invoice.id,
        id: { not: paymentId },
        status: 'PAID',
      },
      _sum: {
        amountReceived: true,
      },
    });

    const otherPaymentsSum = Number(otherPaymentsTotal._sum.amountReceived || 0);
    const balanceDue = Number(invoice.total) - currentPaidAmount + oldAmount - otherPaymentsSum;

    if (data.amountReceived > balanceDue) {
      throw new Error(`Amount received cannot exceed balance due (₹${balanceDue.toFixed(2)})`);
    }
  }

  // Validate TDS amount if tax deducted
  if (data.taxDeducted && (!data.tdsAmount || data.tdsAmount <= 0)) {
    throw new Error('TDS amount is required when tax is deducted');
  }

  // Update payment
  const updatedPayment = await prisma.payment.update({
    where: { id: paymentId },
    data: {
      amountReceived: data.amountReceived,
      bankCharges: data.bankCharges,
      pan: data.pan,
      taxDeducted: data.taxDeducted ?? payment.taxDeducted,
      tdsAmount: data.tdsAmount,
      paymentDate: data.paymentDate 
        ? (data.paymentDate instanceof Date ? data.paymentDate : new Date(data.paymentDate))
        : undefined,
      paymentMode: data.paymentMode,
      paymentReceivedOn: data.paymentReceivedOn 
        ? (data.paymentReceivedOn instanceof Date ? data.paymentReceivedOn : new Date(data.paymentReceivedOn))
        : data.paymentReceivedOn === null ? null : undefined,
      referenceNumber: data.referenceNumber,
      notes: data.notes,
      status: data.status,
    },
    include: {
      invoice: true,
    },
  });

  // If status changed from DRAFT to PAID, or amount changed, update invoice
  if (
    (oldStatus === 'DRAFT' && updatedPayment.status === 'PAID') ||
    (oldStatus === 'PAID' && updatedPayment.status === 'PAID' && data.amountReceived !== undefined)
  ) {
    await updateInvoiceFromPayment(invoice.id);
    // Update contact financial summary
    await updateFinancialSummary(invoice.contactId);
  } else if (oldStatus === 'PAID' && updatedPayment.status === 'DRAFT') {
    // If changed from PAID to DRAFT, recalculate invoice
    await updateInvoiceFromPayment(invoice.id);
    // Update contact financial summary
    await updateFinancialSummary(invoice.contactId);
  }

  return updatedPayment;
};

export const getPaymentsByInvoice = async (invoiceId: string) => {
  return await prisma.payment.findMany({
    where: { invoiceId },
    orderBy: { paymentDate: 'desc' },
  });
};

export const deletePayment = async (paymentId: string) => {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      invoice: true,
    },
  });

  if (!payment) {
    throw new Error('Payment not found');
  }

  const invoiceId = payment.invoiceId;
  const contactId = payment.invoice.contactId;

  // Delete payment
  await prisma.payment.delete({
    where: { id: paymentId },
  });

  // Recalculate invoice paidAmount
  await updateInvoiceFromPayment(invoiceId);
  
  // Update contact financial summary
  await updateFinancialSummary(contactId);

  return { success: true };
};

// Helper function to update invoice paidAmount and status based on payments
const updateInvoiceFromPayment = async (invoiceId: string) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
  });

  if (!invoice) {
    return;
  }

  // Sum all PAID payments
  const paidPayments = await prisma.payment.aggregate({
    where: {
      invoiceId,
      status: 'PAID',
    },
    _sum: {
      amountReceived: true,
    },
  });

  const totalPaid = Number(paidPayments._sum.amountReceived || 0);
  const invoiceTotal = Number(invoice.total);

  // Update invoice
  const updateData: any = {
    paidAmount: totalPaid,
  };

  // Update status based on payment amount
  if (totalPaid >= invoiceTotal) {
    updateData.status = 'PAID';
  } else if (invoice.status === 'PAID' && totalPaid < invoiceTotal) {
    // If invoice was PAID but now has less paid, revert to SENT or OVERDUE
    const dueDate = invoice.dueDate ? new Date(invoice.dueDate) : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (dueDate && dueDate < today) {
      updateData.status = 'OVERDUE';
    } else {
      updateData.status = 'SENT';
    }
  }

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: updateData,
  });
};

