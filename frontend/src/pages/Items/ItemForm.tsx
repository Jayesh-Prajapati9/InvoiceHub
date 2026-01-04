import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { ArrowLeftIcon, CurrencyDollarIcon, TagIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/LoadingSpinner';

const itemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  rate: z.number().positive('Rate must be positive'),
  unit: z.string().default('unit'),
  taxRate: z.number().min(0).max(100).default(0),
  itemType: z.enum(['SALES', 'PURCHASE', 'SERVICE']).default('SALES'),
});

type ItemFormData = z.infer<typeof itemSchema>;

const ItemForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const { data: item, isLoading } = useQuery({
    queryKey: ['item', id],
    queryFn: async () => {
      const res = await api.get(`/items/${id}`);
      return res.data.data;
    },
    enabled: isEdit,
  });

  // Check if item has transactions (quotes or invoices)
  const hasTransactions = isEdit && item && (
    (item.quoteItemsCount > 0) ||
    (item.invoiceItemsCount > 0)
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
    defaultValues: item || { rate: 0, taxRate: 0, unit: 'unit', itemType: 'SALES' },
  });

  // Set form values when item data loads
  useEffect(() => {
    if (isEdit && item) {
      Object.keys(item).forEach((key) => {
        if (item[key] !== null && item[key] !== undefined) {
          setValue(key as keyof ItemFormData, item[key]);
        }
      });
    }
  }, [item, isEdit, setValue]);

  const rate = watch('rate');
  const taxRate = watch('taxRate');
  const taxAmount = (Number(rate) * Number(taxRate)) / 100;
  const totalWithTax = Number(rate) + taxAmount;

  const createMutation = useMutation({
    mutationFn: async (data: ItemFormData) => {
      await api.post('/items', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      navigate('/items');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ItemFormData) => {
      await api.put(`/items/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      navigate('/items');
    },
  });

  const onSubmit = (data: ItemFormData) => {
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <button
          onClick={() => navigate('/items')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          <span className="font-medium">Back to Items</span>
        </button>
        <h1 className="text-3xl font-bold text-gray-900">
          {isEdit ? 'Edit Item' : 'Create Item'}
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          {isEdit ? 'Update item details' : 'Add a new product or service to your catalog'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="card">
          <div className="flex items-center space-x-2 mb-6">
            <TagIcon className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Item Information</h2>
          </div>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Item Name *
              </label>
              <input
                {...register('name')}
                className="input-field"
                placeholder="e.g., Web Development Service"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                {...register('description')}
                rows={3}
                className="input-field"
                placeholder="Detailed description of the item..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Item Type *
              </label>
              {hasTransactions && (
                <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-red-800">
                    Product type cannot be changed for Items having transactions.
                  </p>
                </div>
              )}
              <select
                {...register('itemType')}
                className={`input-field ${hasTransactions ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                disabled={hasTransactions}
              >
                <option value="SALES">Sales Items</option>
                <option value="PURCHASE">Purchase Items</option>
                <option value="SERVICE">Service Items</option>
              </select>
              {errors.itemType && (
                <p className="mt-1 text-sm text-red-600">{errors.itemType.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="card">
          <div className="flex items-center space-x-2 mb-6">
            <CurrencyDollarIcon className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Pricing & Tax</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Rate *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  {...register('rate', { valueAsNumber: true })}
                  className="input-field pl-8"
                  placeholder="0.00"
                />
              </div>
              {errors.rate && (
                <p className="mt-1 text-sm text-red-600">{errors.rate.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Unit
              </label>
              <input
                {...register('unit')}
                className="input-field"
                placeholder="unit, hour, day, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tax Rate (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  {...register('taxRate', { valueAsNumber: true })}
                  className="input-field pr-8"
                  placeholder="0.00"
                />
                <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
              </div>
              {errors.taxRate && (
                <p className="mt-1 text-sm text-red-600">{errors.taxRate.message}</p>
              )}
            </div>
          </div>

          {rate > 0 && (
            <div className="mt-6 p-4 bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl border border-primary-200">
              <h3 className="text-sm font-semibold text-primary-900 mb-3">Price Preview</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Base Rate:</span>
                  <span className="font-semibold text-gray-900">
                    {new Intl.NumberFormat('en-IN', {
                      style: 'currency',
                      currency: 'INR',
                      minimumFractionDigits: 2,
                    }).format(Number(rate))}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Tax ({taxRate}%):</span>
                  <span className="font-semibold text-gray-900">
                    {new Intl.NumberFormat('en-IN', {
                      style: 'currency',
                      currency: 'INR',
                      minimumFractionDigits: 2,
                    }).format(taxAmount)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-primary-200">
                  <span className="font-bold text-primary-900">Total Price:</span>
                  <span className="font-bold text-lg text-primary-900">
                    {new Intl.NumberFormat('en-IN', {
                      style: 'currency',
                      currency: 'INR',
                      minimumFractionDigits: 2,
                    }).format(totalWithTax)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/items')}
            className="btn-secondary"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {(createMutation.isPending || updateMutation.isPending) ? (
              <span className="flex items-center space-x-2">
                <LoadingSpinner size="sm" />
                <span>Saving...</span>
              </span>
            ) : (
              isEdit ? 'Update Item' : 'Create Item'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ItemForm;
