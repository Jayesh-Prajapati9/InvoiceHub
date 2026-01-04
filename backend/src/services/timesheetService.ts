import prisma from '../config/database';

export const getBillableHoursByProject = async (projectId: string, startDate?: Date, endDate?: Date) => {
  const whereClause: any = {
    projectId,
    billable: true,
  };

  if (startDate || endDate) {
    whereClause.date = {};
    if (startDate) {
      whereClause.date.gte = startDate;
    }
    if (endDate) {
      whereClause.date.lte = endDate;
    }
  }

  const timesheets = await prisma.timesheet.findMany({
    where: whereClause,
    orderBy: {
      date: 'asc',
    },
  });

  const totalHours = timesheets.reduce((sum, ts) => {
    return sum + Number(ts.hours);
  }, 0);

  return {
    timesheets,
    totalHours,
  };
};

export const getBillableHoursByProjectAndDateRange = async (
  projectId: string,
  startDate: Date,
  endDate: Date
) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new Error('Project not found');
  }

  const { timesheets, totalHours } = await getBillableHoursByProject(projectId, startDate, endDate);

  const totalCost = totalHours * Number(project.hourlyRate);

  return {
    timesheets,
    totalHours,
    totalCost,
    hourlyRate: Number(project.hourlyRate),
    project,
  };
};

export const convertBillableHoursToInvoiceItems = async (
  projectId: string,
  invoiceId: string
) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new Error('Project not found');
  }

  const { timesheets, totalHours } = await getBillableHoursByProject(projectId);

  if (totalHours === 0) {
    throw new Error('No billable hours found for this project');
  }

  // Create invoice item for billable hours
  const invoiceItem = await prisma.invoiceItem.create({
    data: {
      invoiceId,
      name: `Project: ${project.name}`,
      description: `${totalHours} billable hours`,
      quantity: totalHours,
      rate: Number(project.hourlyRate),
      taxRate: 0,
      amount: totalHours * Number(project.hourlyRate),
    },
  });

  // Recalculate invoice totals
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      items: true,
    },
  });

  if (invoice) {
    const subtotal = invoice.items.reduce((sum, item) => {
      return sum + Number(item.amount);
    }, 0);

    const taxAmount = invoice.items.reduce((sum, item) => {
      return sum + (Number(item.amount) * Number(item.taxRate)) / 100;
    }, 0);

    const total = subtotal + taxAmount;

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        subtotal,
        taxAmount,
        total,
      },
    });
  }

  return invoiceItem;
};

