import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import ModernDropdown from '../../components/ModernDropdown';
import { ArrowLeftIcon, CalendarIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useToast } from '../../contexts/ToastContext';

const createPaymentSchema = (invoiceIssueDate?: string) => z.object({
  invoiceId: z.string().uuid(),
  amountReceived: z.number().positive('Amount received must be greater than 0'),
  bankCharges: z.number().nonnegative('Bank charges cannot be negative').optional(),
  pan: z.string().optional(),
  taxDeducted: z.boolean().default(false),
  tdsAmount: z.number().nonnegative('TDS amount cannot be negative').optional(),
  paymentDate: z.string().min(1, 'Payment date is required').refine((val) => {
    if (!invoiceIssueDate) return true;
    const issueDate = new Date(invoiceIssueDate);
    issueDate.setHours(0, 0, 0, 0);
    const paymentDate = new Date(val);
    return paymentDate >= issueDate;
  }, {
    message: 'Payment date cannot be earlier than invoice issue date',
  }),
  paymentMode: z.enum(['Cash', 'Bank Transfer', 'Cheque', 'Credit Card', 'Debit Card']),
  paymentReceivedOn: z.string().optional(),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['DRAFT', 'PAID']).default('DRAFT'),
}).refine((data) => {
  if (data.taxDeducted && (!data.tdsAmount || data.tdsAmount <= 0)) {
    return false;
  }
  return true;
}, {
  message: 'TDS amount is required when tax is deducted',
  path: ['tdsAmount'],
});

type PaymentFormData = z.infer<ReturnType<typeof createPaymentSchema>>;

const PaymentForm = () => {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: invoice, isLoading: invoiceLoading } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: async () => {
      const res = await api.get(`/invoices/${invoiceId}`);
      return res.data.data;
    },
    enabled: !!invoiceId,
  });

  // Fetch existing draft payment for this invoice
  const { data: paymentsData } = useQuery({
    queryKey: ['payments', invoiceId],
    queryFn: async () => {
      const res = await api.get(`/payments/invoice/${invoiceId}`);
      return res.data.data || [];
    },
    enabled: !!invoiceId,
  });

  // Find draft payment if exists
  const draftPayment = paymentsData?.find((p: any) => p.status === 'DRAFT');

  const paymentSchema = createPaymentSchema(invoice?.issueDate);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      invoiceId: invoiceId || '',
      taxDeducted: false,
      status: 'DRAFT',
      paymentDate: invoice?.issueDate ? new Date(invoice.issueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      paymentMode: 'Cash',
    },
  });

  const taxDeducted = watch('taxDeducted');

  // Pre-populate form when invoice loads or draft payment exists
  useEffect(() => {
    if (invoice) {
      setValue('invoiceId', invoice.id);
      
      // If draft payment exists, pre-populate from it
      if (draftPayment) {
        setValue('amountReceived', Number(draftPayment.amountReceived) || 0);
        setValue('bankCharges', draftPayment.bankCharges ? Number(draftPayment.bankCharges) : undefined);
        setValue('pan', draftPayment.pan || '');
        setValue('taxDeducted', draftPayment.taxDeducted || false);
        setValue('tdsAmount', draftPayment.tdsAmount ? Number(draftPayment.tdsAmount) : undefined);
        setValue('paymentDate', draftPayment.paymentDate ? new Date(draftPayment.paymentDate).toISOString().split('T')[0] : (invoice.issueDate ? new Date(invoice.issueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]));
        setValue('paymentMode', draftPayment.paymentMode || 'Cash');
        setValue('paymentReceivedOn', draftPayment.paymentReceivedOn ? new Date(draftPayment.paymentReceivedOn).toISOString().split('T')[0] : '');
        setValue('referenceNumber', draftPayment.referenceNumber || '');
        setValue('notes', draftPayment.notes || '');
        setValue('status', draftPayment.status || 'DRAFT');
      } else {
        // No draft payment, use defaults
        const balanceDue = Number(invoice.total) - Number(invoice.paidAmount || 0);
        setValue('amountReceived', balanceDue);
        // Pre-populate payment date with invoice issue date
        if (invoice.issueDate) {
          setValue('paymentDate', new Date(invoice.issueDate).toISOString().split('T')[0]);
        }
      }
    }
  }, [invoice, draftPayment, setValue]);

  const createOrUpdateMutation = useMutation({
    mutationFn: async (data: PaymentFormData) => {
      // Clean up the data - remove undefined, null, empty string, and NaN values for optional fields
      const cleanedData: any = {
        invoiceId: data.invoiceId,
        amountReceived: Number(data.amountReceived),
        paymentDate: data.paymentDate,
        paymentMode: data.paymentMode,
        taxDeducted: data.taxDeducted || false,
        status: data.status || 'DRAFT',
      };

      // Only include optional fields if they have valid values
      if (data.bankCharges !== undefined && data.bankCharges !== null && !isNaN(Number(data.bankCharges)) && Number(data.bankCharges) >= 0) {
        cleanedData.bankCharges = Number(data.bankCharges);
      }
      if (data.pan && typeof data.pan === 'string' && data.pan.trim() !== '') {
        cleanedData.pan = data.pan.trim();
      }
      if (data.taxDeducted && data.tdsAmount !== undefined && data.tdsAmount !== null && !isNaN(Number(data.tdsAmount)) && Number(data.tdsAmount) >= 0) {
        cleanedData.tdsAmount = Number(data.tdsAmount);
      }
      if (data.paymentReceivedOn && typeof data.paymentReceivedOn === 'string' && data.paymentReceivedOn.trim() !== '') {
        cleanedData.paymentReceivedOn = data.paymentReceivedOn.trim();
      }
      if (data.referenceNumber && typeof data.referenceNumber === 'string' && data.referenceNumber.trim() !== '') {
        cleanedData.referenceNumber = data.referenceNumber.trim();
      }
      if (data.notes && typeof data.notes === 'string' && data.notes.trim() !== '') {
        cleanedData.notes = data.notes.trim();
      }

      // If draft payment exists, update it; otherwise create new
      if (draftPayment?.id) {
        const res = await api.patch(`/payments/${draftPayment.id}`, cleanedData);
        return res.data;
      }
      const res = await api.post('/payments', cleanedData);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['payments', invoiceId] });
      const message = variables.status === 'PAID' 
        ? 'Payment recorded successfully' 
        : draftPayment?.id ? 'Payment updated successfully' : 'Payment saved as draft';
      showToast(message, 'success');
      // Redirect to invoice page after saving (both draft and paid)
      navigate(`/invoices/${invoiceId}`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || error.message || 'Failed to create payment';
      showToast(message, 'error');
    },
  });

  const onSubmit = (data: PaymentFormData) => {
    createOrUpdateMutation.mutate({ ...data, status: 'DRAFT' });
  };

  const handleSaveAsDraft = handleSubmit((data) => {
    createOrUpdateMutation.mutate({ ...data, status: 'DRAFT' });
  });

  const handleSaveAsPaid = handleSubmit((data) => {
    createOrUpdateMutation.mutate({ ...data, status: 'PAID' });
  });

  if (invoiceLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Invoice not found</p>
      </div>
    );
  }

  const balanceDue = Number(invoice.total) - Number(invoice.paidAmount || 0);

  // Calculate min date (invoice issue date)
  const minDate = invoice?.issueDate 
    ? (() => {
        // Handle the issueDate - extract date directly from string to avoid timezone issues
        if (typeof invoice.issueDate === 'string') {
          // If it's in YYYY-MM-DD format (with or without time), extract just the date part
          const dateMatch = invoice.issueDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
          if (dateMatch) {
            // Return the date part directly without timezone conversion
            return `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
          }
        }
        
        // Fallback: if it's a Date object or other format, use the Date methods
        const date = new Date(invoice.issueDate);
        if (isNaN(date.getTime())) {
          return undefined;
        }
        
        // Use UTC methods to avoid timezone conversion
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        
        return `${year}-${month}-${day}`;
      })()
    : undefined;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate(`/invoices/${invoiceId}`)}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          <span className="font-medium">Back to Invoice</span>
        </button>
        <h1 className="text-3xl font-bold text-gray-900">
          Payment for {invoice.invoiceNumber}
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Record payment for {invoice.contact?.name}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Customer Information */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Customer Name *
            </label>
            <input
              type="text"
              value={invoice.contact?.name || ''}
              disabled
              className="input-field bg-gray-50 cursor-not-allowed"
            />
          </div>
        </div>

        {/* Payment Details */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Payment # *
              </label>
              <input
                type="text"
                value="Auto-generated"
                disabled
                className="input-field bg-gray-50 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Amount Received (INR) *
              </label>
              <div className="relative">
                <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={balanceDue}
                  {...register('amountReceived', {
                    valueAsNumber: true,
                    max: {
                      value: balanceDue,
                      message: `Amount cannot exceed balance due (₹${balanceDue.toFixed(2)})`,
                    },
                  })}
                  className={`input-field pl-12 ${errors.amountReceived ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                  placeholder="0.00"
                />
              </div>
              {errors.amountReceived && (
                <p className="mt-1 text-sm text-red-600">{errors.amountReceived.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Balance Due: ₹{balanceDue.toFixed(2)}
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Bank Charges (if any)
              </label>
              <div className="relative">
                <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('bankCharges', { valueAsNumber: true })}
                  className="input-field pl-12"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                PAN
              </label>
              <input
                type="text"
                {...register('pan')}
                className="input-field"
                placeholder="Enter PAN"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tax deducted?
              </label>
              <div className="flex items-center space-x-6">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="false"
                    checked={!taxDeducted}
                    onChange={() => setValue('taxDeducted', false)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">No Tax deducted</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="true"
                    checked={taxDeducted}
                    onChange={() => setValue('taxDeducted', true)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Yes, TDS (Income Tax)</span>
                </label>
              </div>
            </div>

            {taxDeducted && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  TDS Amount *
                </label>
                <div className="relative">
                  <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    {...register('tdsAmount', { valueAsNumber: true })}
                    className={`input-field pl-12 ${errors.tdsAmount ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                    placeholder="0.00"
                  />
                </div>
                {errors.tdsAmount && (
                  <p className="mt-1 text-sm text-red-600">{errors.tdsAmount.message}</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Payment Date *
              </label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  {...register('paymentDate')}
                  min={minDate}
                  className={`input-field pl-12 ${errors.paymentDate ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                />
              </div>
              {errors.paymentDate && (
                <p className="mt-1 text-sm text-red-600">{errors.paymentDate.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Payment Mode *
              </label>
              <ModernDropdown
                options={[
                  { value: 'Cash', label: 'Cash' },
                  { value: 'Bank Transfer', label: 'Bank Transfer' },
                  { value: 'Cheque', label: 'Cheque' },
                  { value: 'Credit Card', label: 'Credit Card' },
                  { value: 'Debit Card', label: 'Debit Card' },
                ]}
                value={watch('paymentMode') || 'Cash'}
                onChange={(value) => setValue('paymentMode', value as any)}
                placeholder="Select payment mode"
              />
              {errors.paymentMode && (
                <p className="mt-1 text-sm text-red-600">{errors.paymentMode.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Payment Received On
              </label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  {...register('paymentReceivedOn')}
                  min={minDate}
                  className="input-field pl-12"
                  placeholder="dd/MM/yyyy"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Reference#
              </label>
              <input
                type="text"
                {...register('referenceNumber')}
                className="input-field"
                placeholder="Enter reference number"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                {...register('notes')}
                rows={4}
                className="input-field"
                placeholder="Add any additional notes..."
              />
            </div>

          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate(`/invoices/${invoiceId}`)}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveAsDraft}
            disabled={createOrUpdateMutation.isPending}
            className="btn-secondary"
          >
            Save as Draft
          </button>
          <button
            type="button"
            onClick={handleSaveAsPaid}
            disabled={createOrUpdateMutation.isPending}
            className="btn-primary"
          >
            Save as Paid
          </button>
        </div>
      </form>
    </div>
  );
};

export default PaymentForm;

