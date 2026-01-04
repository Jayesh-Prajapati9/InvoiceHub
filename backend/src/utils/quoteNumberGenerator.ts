import prisma from '../config/database';

export const generateQuoteNumber = async (): Promise<string> => {
  const count = await prisma.quote.count();
  const nextNumber = count + 1;
  return `QUO-${String(nextNumber).padStart(4, '0')}`;
};

