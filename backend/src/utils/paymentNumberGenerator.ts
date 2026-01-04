import prisma from '../config/database';

export const generatePaymentNumber = async (): Promise<string> => {
  const count = await prisma.payment.count();
  const nextNumber = count + 1;
  return `PAY-${String(nextNumber).padStart(6, '0')}`;
};

