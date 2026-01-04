import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { createPaymentSchema, updatePaymentSchema } from '../validators/paymentValidator';
import {
  createPayment,
  updatePayment,
  getPaymentsByInvoice,
  deletePayment,
} from '../services/paymentService';

export const createPaymentController = async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = createPaymentSchema.parse(req.body);

    const payment = await createPayment(validatedData);

    res.status(201).json({
      success: true,
      data: payment,
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

    res.status(400).json({
      success: false,
      error: {
        message: error.message || 'Failed to create payment',
      },
    });
  }
};

export const getPaymentsByInvoiceController = async (req: AuthRequest, res: Response) => {
  try {
    const { invoiceId } = req.params;

    const payments = await getPaymentsByInvoice(invoiceId);

    res.json({
      success: true,
      data: payments,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to fetch payments',
      },
    });
  }
};

export const updatePaymentController = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updatePaymentSchema.parse(req.body);

    const payment = await updatePayment(id, validatedData);

    res.json({
      success: true,
      data: payment,
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

    res.status(400).json({
      success: false,
      error: {
        message: error.message || 'Failed to update payment',
      },
    });
  }
};

export const deletePaymentController = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await deletePayment(id);

    res.json({
      success: true,
      message: 'Payment deleted successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        message: error.message || 'Failed to delete payment',
      },
    });
  }
};

