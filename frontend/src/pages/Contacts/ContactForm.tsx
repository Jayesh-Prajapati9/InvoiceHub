import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { ArrowLeftIcon, UserIcon, MapPinIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useToast } from '../../contexts/ToastContext';

const contactSchema = z.object({
  // Basic Information - ALL REQUIRED
  name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .max(20, 'Phone number is too long')
    .regex(/^[\d\s\-\+\(\)]+$/, 'Phone number can only contain numbers, spaces, hyphens, parentheses, and plus sign'),
  mobile: z
    .string()
    .min(1, 'Mobile number is required')
    .max(20, 'Mobile number is too long')
    .regex(/^[\d\s\-\+\(\)]+$/, 'Mobile number can only contain numbers, spaces, hyphens, parentheses, and plus sign'),
  company: z.string().min(1, 'Company name is required').max(255, 'Company name is too long'),
  type: z.enum(['CUSTOMER', 'VENDOR'], {
    required_error: 'Contact type is required',
    invalid_type_error: 'Contact type must be CUSTOMER or VENDOR',
  }),
  customerType: z.enum(['BUSINESS', 'INDIVIDUAL'], {
    required_error: 'Customer type is required',
  }),
  
  // Additional Settings - ALL REQUIRED
  defaultCurrency: z.string().min(1, 'Default currency is required').default('INR'),
  portalStatus: z.enum(['ENABLED', 'DISABLED'], {
    required_error: 'Portal status is required',
  }),
  customerLanguage: z.string().min(1, 'Customer language is required'),
  paymentTerms: z.string().min(1, 'Payment terms are required'),
  
  // Billing Address - ALL REQUIRED
  billingAddress: z.string().min(1, 'Billing address is required'),
  billingCity: z.string().min(1, 'Billing city is required'),
  billingState: z.string().min(1, 'Billing state is required'),
  billingZipCode: z
    .string()
    .min(1, 'Billing ZIP code is required')
    .regex(/^[A-Za-z0-9\s\-]+$/, 'ZIP code can only contain letters, numbers, spaces, and hyphens'),
  billingCountry: z.string().min(1, 'Billing country is required'),
  
  // Shipping Address - ALL REQUIRED
  shippingAddress: z.string().min(1, 'Shipping address is required'),
  shippingCity: z.string().min(1, 'Shipping city is required'),
  shippingState: z.string().min(1, 'Shipping state is required'),
  shippingZipCode: z
    .string()
    .min(1, 'Shipping ZIP code is required')
    .regex(/^[A-Za-z0-9\s\-]+$/, 'ZIP code can only contain letters, numbers, spaces, and hyphens'),
  shippingCountry: z.string().min(1, 'Shipping country is required'),
  
  // Legacy address fields (optional for backward compatibility)
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  isActive: z.boolean().default(true),
});

type ContactFormData = z.infer<typeof contactSchema>;

const ContactForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const isEdit = !!id;

  const { data: contact, isLoading } = useQuery({
    queryKey: ['contact', id],
    queryFn: async () => {
      const res = await api.get(`/contacts/${id}`);
      return res.data.data;
    },
    enabled: isEdit,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    mode: 'onChange', // Validate on change for better UX
    defaultValues: {
      type: 'CUSTOMER',
      customerType: 'BUSINESS',
      defaultCurrency: 'INR',
      portalStatus: 'DISABLED',
      customerLanguage: 'en',
      isActive: true,
    },
  });

  // Set form values when contact data loads
  useEffect(() => {
    if (isEdit && contact) {
      Object.keys(contact).forEach((key) => {
        if (contact[key] !== null && contact[key] !== undefined) {
          setValue(key as keyof ContactFormData, contact[key]);
        }
      });
    }
  }, [contact, isEdit, setValue]);

  const createMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      await api.post('/contacts', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      showToast('Contact created successfully', 'success');
      navigate('/contacts');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error?.message || 'Failed to create contact';
      const errorCode = error.response?.data?.error?.code;
      
      if (errorCode === 'EMAIL_DUPLICATE') {
        showToast('A contact with this email address already exists', 'error');
      } else {
        showToast(errorMessage, 'error');
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      await api.put(`/contacts/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contact', id] });
      showToast('Contact updated successfully', 'success');
      navigate(`/contacts/${id}`);
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error?.message || 'Failed to update contact';
      const errorCode = error.response?.data?.error?.code;
      
      if (errorCode === 'EMAIL_DUPLICATE') {
        showToast('A contact with this email address already exists', 'error');
      } else {
        showToast(errorMessage, 'error');
      }
    },
  });

  const onSubmit = (data: ContactFormData) => {
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const onError = (errors: any) => {
    console.log('Form validation errors:', errors);
    // Scroll to first error
    const firstErrorField = Object.keys(errors)[0];
    if (firstErrorField) {
      const element = document.querySelector(`[name="${firstErrorField}"]`);
      if (element) {
        (element as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Single currency - INR (Indian Rupee) as default
  const languages = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
  ];

  const paymentTermsOptions = [
    'Due on Receipt',
    'Net 15',
    'Net 30',
    'Net 45',
    'Net 60',
  ];

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <button
          onClick={() => navigate(isEdit ? `/contacts/${id}` : '/contacts')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          <span className="font-medium">Back</span>
        </button>
        <h1 className="text-3xl font-bold text-gray-900">
          {isEdit ? 'Edit Contact' : 'Create Contact'}
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          {isEdit ? 'Update contact information' : 'Add a new customer or vendor to your contacts'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-6">
        {/* Basic Information */}
        <div className="card">
          <div className="flex items-center space-x-2 mb-6">
            <UserIcon className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                {...register('name')}
                className={`input-field ${errors.name ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                placeholder="John Doe"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Type *
              </label>
              <select
                {...register('type')}
                className={`input-field ${errors.type ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
              >
                <option value="">Select type</option>
                <option value="CUSTOMER">Customer</option>
                <option value="VENDOR">Vendor</option>
              </select>
              {errors.type && (
                <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Customer Type *
              </label>
              <select
                {...register('customerType')}
                className={`input-field ${errors.customerType ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
              >
                <option value="">Select customer type</option>
                <option value="BUSINESS">Business</option>
                <option value="INDIVIDUAL">Individual</option>
              </select>
              {errors.customerType && (
                <p className="mt-1 text-sm text-red-600">{errors.customerType.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                {...register('email')}
                className={`input-field ${errors.email ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                placeholder="john@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Phone Number *
              </label>
              <input
                {...register('phone')}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^\d\s\-\+\(\)]/g, '');
                  setValue('phone', value);
                }}
                className={`input-field ${errors.phone ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                placeholder="+1 234 567 8900"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Mobile Number *
              </label>
              <input
                {...register('mobile')}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^\d\s\-\+\(\)]/g, '');
                  setValue('mobile', value);
                }}
                className={`input-field ${errors.mobile ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                placeholder="+1 234 567 8900"
              />
              {errors.mobile && (
                <p className="mt-1 text-sm text-red-600">{errors.mobile.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Company *
              </label>
              <input
                {...register('company')}
                className={`input-field ${errors.company ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                placeholder="Company Name"
              />
              {errors.company && (
                <p className="mt-1 text-sm text-red-600">{errors.company.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Additional Settings */}
        <div className="card">
          <div className="flex items-center space-x-2 mb-6">
            <GlobeAltIcon className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Additional Settings</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Default Currency *
              </label>
              <input
                type="text"
                value="INR - Indian Rupee"
                readOnly
                className="input-field bg-gray-50 cursor-not-allowed"
              />
              <input type="hidden" {...register('defaultCurrency')} value="INR" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Customer Language *
              </label>
              <select
                {...register('customerLanguage')}
                className={`input-field ${errors.customerLanguage ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
              >
                <option value="">Select language</option>
                {languages.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
              {errors.customerLanguage && (
                <p className="mt-1 text-sm text-red-600">{errors.customerLanguage.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Portal Status *
              </label>
              <select
                {...register('portalStatus')}
                className={`input-field ${errors.portalStatus ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
              >
                <option value="">Select portal status</option>
                <option value="DISABLED">Disabled</option>
                <option value="ENABLED">Enabled</option>
              </select>
              {errors.portalStatus && (
                <p className="mt-1 text-sm text-red-600">{errors.portalStatus.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Payment Terms *
              </label>
              <select
                {...register('paymentTerms')}
                className={`input-field ${errors.paymentTerms ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
              >
                <option value="">Select payment terms</option>
                {paymentTermsOptions.map((term) => (
                  <option key={term} value={term}>
                    {term}
                  </option>
                ))}
              </select>
              {errors.paymentTerms && (
                <p className="mt-1 text-sm text-red-600">{errors.paymentTerms.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Billing Address */}
        <div className="card">
          <div className="flex items-center space-x-2 mb-6">
            <MapPinIcon className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Billing Address</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Street Address *
              </label>
              <input
                {...register('billingAddress')}
                className={`input-field ${errors.billingAddress ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                placeholder="123 Main Street"
              />
              {errors.billingAddress && (
                <p className="mt-1 text-sm text-red-600">{errors.billingAddress.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">City *</label>
              <input
                {...register('billingCity')}
                className={`input-field ${errors.billingCity ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                placeholder="New York"
              />
              {errors.billingCity && (
                <p className="mt-1 text-sm text-red-600">{errors.billingCity.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                State / Province *
              </label>
              <input
                {...register('billingState')}
                className={`input-field ${errors.billingState ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                placeholder="NY"
              />
              {errors.billingState && (
                <p className="mt-1 text-sm text-red-600">{errors.billingState.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ZIP / Postal Code *
              </label>
              <input
                {...register('billingZipCode')}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^A-Za-z0-9\s\-]/g, '');
                  setValue('billingZipCode', value);
                }}
                className={`input-field ${errors.billingZipCode ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                placeholder="10001"
              />
              {errors.billingZipCode && (
                <p className="mt-1 text-sm text-red-600">{errors.billingZipCode.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Country *</label>
              <input
                {...register('billingCountry')}
                className={`input-field ${errors.billingCountry ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                placeholder="United States"
              />
              {errors.billingCountry && (
                <p className="mt-1 text-sm text-red-600">{errors.billingCountry.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="card">
          <div className="flex items-center space-x-2 mb-6">
            <MapPinIcon className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Shipping Address</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Street Address *
              </label>
              <input
                {...register('shippingAddress')}
                className={`input-field ${errors.shippingAddress ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                placeholder="123 Main Street"
              />
              {errors.shippingAddress && (
                <p className="mt-1 text-sm text-red-600">{errors.shippingAddress.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">City *</label>
              <input
                {...register('shippingCity')}
                className={`input-field ${errors.shippingCity ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                placeholder="New York"
              />
              {errors.shippingCity && (
                <p className="mt-1 text-sm text-red-600">{errors.shippingCity.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                State / Province *
              </label>
              <input
                {...register('shippingState')}
                className={`input-field ${errors.shippingState ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                placeholder="NY"
              />
              {errors.shippingState && (
                <p className="mt-1 text-sm text-red-600">{errors.shippingState.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ZIP / Postal Code *
              </label>
              <input
                {...register('shippingZipCode')}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^A-Za-z0-9\s\-]/g, '');
                  setValue('shippingZipCode', value);
                }}
                className={`input-field ${errors.shippingZipCode ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                placeholder="10001"
              />
              {errors.shippingZipCode && (
                <p className="mt-1 text-sm text-red-600">{errors.shippingZipCode.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Country *</label>
              <input
                {...register('shippingCountry')}
                className={`input-field ${errors.shippingCountry ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                placeholder="United States"
              />
              {errors.shippingCountry && (
                <p className="mt-1 text-sm text-red-600">{errors.shippingCountry.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Legacy Address (for backward compatibility) */}
        <div className="card bg-gray-50">
          <div className="flex items-center space-x-2 mb-4">
            <MapPinIcon className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-700">Legacy Address (Optional)</h2>
          </div>
          <p className="text-xs text-gray-600 mb-4">
            These fields are kept for backward compatibility. Use Billing/Shipping addresses above.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Street Address
              </label>
              <input
                {...register('address')}
                className="input-field"
                placeholder="123 Main Street"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
              <input
                {...register('city')}
                className="input-field"
                placeholder="New York"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                State / Province
              </label>
              <input
                {...register('state')}
                className="input-field"
                placeholder="NY"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ZIP / Postal Code
              </label>
              <input
                {...register('zipCode')}
                className="input-field"
                placeholder="10001"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
              <input
                {...register('country')}
                className="input-field"
                placeholder="United States"
              />
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="card">
          <div className="flex items-center space-x-2 mb-6">
            <UserIcon className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Status</h2>
          </div>
          <div>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                {...register('isActive')}
                className="w-5 h-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-700">Active Customer</span>
            </label>
            <p className="mt-2 text-xs text-gray-500">
              Inactive customers will not appear in contact dropdowns when creating quotes, invoices, or projects.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate(isEdit ? `/contacts/${id}` : '/contacts')}
            className="btn-secondary"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center space-x-2">
                <LoadingSpinner size="sm" />
                <span>Saving...</span>
              </span>
            ) : (
              isEdit ? 'Update Contact' : 'Create Contact'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ContactForm;
