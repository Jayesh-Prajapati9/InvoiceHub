import prisma from '../config/database';

export const generateInvoiceNumber = async (): Promise<string> => {
  const count = await prisma.invoice.count();
  const nextNumber = count + 1;
  return `INV-${String(nextNumber).padStart(4, '0')}`;
};

