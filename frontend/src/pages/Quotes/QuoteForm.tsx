import { useEffect, useState, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import QuoteItemsTable from '../../components/Quotes/QuoteItemsTable';
import ModernDropdown from '../../components/ModernDropdown';
import { ArrowLeftIcon, UserIcon, CalendarIcon, DocumentTextIcon, PlusIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useToast } from '../../contexts/ToastContext';

const quoteItemSchema = z.object({
  // Allow itemId to be UUID, empty string, or undefined (for custom items)
  itemId: z.union([z.string().uuid(), z.literal(''), z.undefined()]).optional(),
  type: z.enum(['ITEM', 'HEADER', 'TIMESHEET']).optional(),
  name: z.string().min(1, 'Item name is required'),
  description: z.string().optional(),
  quantity: z.number().min(0, 'Quantity cannot be negative'),
  rate: z.number().min(0, 'Rate cannot be negative'),
  taxRate: z.number().min(0).max(100).default(0),
}).refine((data) => {
  // Headers and timesheets can have 0 quantity/rate, but regular items must be positive
  if (data.type === 'HEADER' || data.type === 'TIMESHEET') {
    return true;
  }
  return data.quantity > 0 && data.rate > 0;
}, {
  message: 'Quantity and rate must be positive for regular items',
  path: ['quantity'],
});

const quoteSchema = z.object({
  contactId: z.string().uuid('Please select a contact'),
  templateId: z.union([z.string().uuid(), z.literal('')]).optional(),
  projectId: z.union([z.string().uuid(), z.literal('')]).optional(),
  paymentTerms: z.enum(['Due on Receipt', 'Net 15', 'Net 30', 'Net 45', 'Net 60', 'Custom']).optional(),
  issueDate: z.string().min(1, 'Issue date is required'),
  expiryDate: z.string().min(1, 'Expiry date is required'),
  items: z.array(quoteItemSchema).min(1, 'At least one item is required'),
  notes: z.string().optional(),
}).refine((data) => {
  // Ensure issue date is before or equal to expiry date
  if (data.issueDate && data.expiryDate) {
    return new Date(data.issueDate) <= new Date(data.expiryDate);
  }
  return true;
}, {
  message: 'Expiry date must be on or after issue date',
  path: ['expiryDate'],
});

type QuoteFormData = z.infer<typeof quoteSchema>;

const QuoteForm = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const isEdit = !!id;
  const contactIdFromUrl = searchParams.get('contactId');
  const templateIdFromUrl = searchParams.get('templateId');
  const projectIdFromUrl = searchParams.get('projectId');
  const [timesheetInfoMessage, setTimesheetInfoMessage] = useState<string | null>(null);
  const checkedQuoteIdRef = useRef<string | null>(null);

  const { data: contacts } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const res = await api.get('/contacts?status=ACTIVE&limit=1000');
      return res.data.data?.contacts || [];
    },
  });

  const { data: items } = useQuery({
    queryKey: ['items'],
    queryFn: async () => {
      const res = await api.get('/items');
      return res.data.data.items;
    },
  });

  const { data: templatesData } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const res = await api.get('/templates?limit=1000');
      return res.data.data.templates || [];
    },
  });
  
  const templates = templatesData || [];

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await api.get('/projects');
      return res.data.data.projects;
    },
  });

  const { data: quote, isLoading: quoteLoading } = useQuery({
    queryKey: ['quote', id],
    queryFn: async () => {
      const res = await api.get(`/quotes/${id}`);
      return res.data.data;
    },
    enabled: isEdit,
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<QuoteFormData>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      items: [{ name: '', quantity: 1, rate: 0, taxRate: 0 }],
      contactId: contactIdFromUrl || undefined,
    },
  });

  const issueDate = watch('issueDate');
  const expiryDate = watch('expiryDate');
  const paymentTerms = watch('paymentTerms');
  const projectId = watch('projectId');
  const contactId = watch('contactId');
  
  // Calculate expiry date based on payment terms
  const calculateExpiryDateFromPaymentTerms = (issueDateValue: string, paymentTermsValue: string | undefined): string | undefined => {
    if (!issueDateValue || !paymentTermsValue || paymentTermsValue === 'Custom') {
      return undefined;
    }

    const issue = new Date(issueDateValue);
    const expiry = new Date(issue);

    switch (paymentTermsValue) {
      case 'Due on Receipt':
        // Same day
        break;
      case 'Net 15':
        expiry.setDate(expiry.getDate() + 15);
        break;
      case 'Net 30':
        expiry.setDate(expiry.getDate() + 30);
        break;
      case 'Net 45':
        expiry.setDate(expiry.getDate() + 45);
        break;
      case 'Net 60':
        expiry.setDate(expiry.getDate() + 60);
        break;
      default:
        return undefined;
    }

    return expiry.toISOString().split('T')[0];
  };

  // Check if a date matches any payment term calculation
  const getPaymentTermForDate = (issueDateValue: string, expiryDateValue: string): string | undefined => {
    if (!issueDateValue || !expiryDateValue) return undefined;

    const issue = new Date(issueDateValue);
    const expiry = new Date(expiryDateValue);
    const diffDays = Math.floor((expiry.getTime() - issue.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Due on Receipt';
    if (diffDays === 15) return 'Net 15';
    if (diffDays === 30) return 'Net 30';
    if (diffDays === 45) return 'Net 45';
    if (diffDays === 60) return 'Net 60';
    return 'Custom';
  };
  
  // Calculate min date for expiry date (should be at least issue date or today)
  const getExpiryMinDate = () => {
    if (issueDate) {
      return issueDate;
    }
    return new Date().toISOString().split('T')[0];
  };

  // Calculate max date for issue date (should be at most expiry date)
  const getIssueMaxDate = () => {
    if (expiryDate) {
      return expiryDate;
    }
    return undefined;
  };

  const { fields, append, remove, replace, insert } = useFieldArray({
    control,
    name: 'items',
  });

  // Pre-fill contactId and projectId from URL if provided and not editing
  useEffect(() => {
    if (!isEdit && contactIdFromUrl) {
      setValue('contactId', contactIdFromUrl);
    }
    if (!isEdit && projectIdFromUrl) {
      setValue('projectId', projectIdFromUrl);
    }
  }, [contactIdFromUrl, projectIdFromUrl, isEdit, setValue]);

  // Auto-populate payment terms when contact is selected (only for new quotes)
  useEffect(() => {
    if (!isEdit && contactId && contacts) {
      const selectedContact = contacts.find((c: any) => c.id === contactId);
      if (selectedContact?.paymentTerms) {
        // Auto-populate payment terms from contact when creating new quote
        setValue('paymentTerms', selectedContact.paymentTerms as any);
      }
    }
  }, [contactId, contacts, setValue, isEdit]);

  // Populate form when editing and quote data is loaded
  useEffect(() => {
    if (isEdit && quote && id && checkedQuoteIdRef.current !== id) {
      checkedQuoteIdRef.current = id;
      
      // Only allow editing quotes in DRAFT status
      if (quote.status !== 'DRAFT') {
        showToast('Cannot edit quote. Only draft quotes can be edited.', 'error');
        navigate(`/quotes/${id}`);
        return;
      }

      // Populate form fields for DRAFT quotes
      setValue('contactId', quote.contactId);
      // Use templateId from URL if provided (from template selection), otherwise use quote's templateId
      setValue('templateId', templateIdFromUrl || quote.templateId || '');
      setValue('projectId', quote.projectId || '');
      setValue('paymentTerms', quote.paymentTerms || undefined);
      setValue('issueDate', quote.issueDate ? new Date(quote.issueDate).toISOString().split('T')[0] : '');
      setValue('expiryDate', quote.expiryDate ? new Date(quote.expiryDate).toISOString().split('T')[0] : '');
      setValue('notes', quote.notes || '');
      
      // Replace items using useFieldArray's replace method
      if (quote.items && quote.items.length > 0) {
        const formattedItems = quote.items.map((item: any) => ({
          itemId: item.itemId || undefined,
          type: (item.type || 'ITEM') as 'ITEM' | 'HEADER' | 'TIMESHEET',
          name: item.name,
          description: item.description || '',
          quantity: Number(item.quantity),
          rate: Number(item.rate),
          taxRate: Number(item.taxRate),
        }));
        replace(formattedItems);
      }
    } else if (templateIdFromUrl && !isEdit) {
      // If templateId is in URL (from template selection in detail view), set it
      setValue('templateId', templateIdFromUrl);
    }
  }, [isEdit, quote, setValue, replace, templateIdFromUrl, id, navigate, showToast]);

  // Auto-calculate expiry date when payment terms change
  useEffect(() => {
    if (paymentTerms && paymentTerms !== 'Custom' && issueDate) {
      const calculatedDate = calculateExpiryDateFromPaymentTerms(issueDate, paymentTerms);
      if (calculatedDate) {
        setValue('expiryDate', calculatedDate, { shouldValidate: true });
      }
    }
  }, [paymentTerms, issueDate, setValue]);

  // Auto-calculate expiry date when issue date changes (if payment terms is set and not Custom)
  useEffect(() => {
    if (paymentTerms && paymentTerms !== 'Custom' && issueDate) {
      const calculatedDate = calculateExpiryDateFromPaymentTerms(issueDate, paymentTerms);
      if (calculatedDate) {
        setValue('expiryDate', calculatedDate, { shouldValidate: true });
      }
    }
  }, [issueDate, paymentTerms, setValue]);

  // Fetch and add timesheet hours when project is selected
  useEffect(() => {
    const fetchAndAddTimesheetHours = async () => {
      if (!projectId || !issueDate) {
        console.log('Timesheet fetch skipped:', { projectId, issueDate });
        setTimesheetInfoMessage(null);
        return;
      }

      try {
        const startDate = new Date(issueDate).toISOString().split('T')[0];
        // Use expiry date or current date, whichever is later, to include future timesheets
        const endDate = expiryDate 
          ? new Date(expiryDate).toISOString().split('T')[0] 
          : new Date().toISOString().split('T')[0];
        
        console.log('Fetching timesheet hours:', { projectId, startDate, endDate });
        
        // First check if project has any billable timesheets (without date filter)
        const allTimesheetsRes = await api.get(`/timesheets/project/${projectId}/billable`);
        const allTimesheetsData = allTimesheetsRes.data.data;
        const hasAnyTimesheets = allTimesheetsData.timesheets && allTimesheetsData.timesheets.length > 0;
        
        // Then check for timesheets in the date range
        const res = await api.get(`/timesheets/project/${projectId}/billable?startDate=${startDate}&endDate=${endDate}`);
        const timesheetData = res.data.data;

        console.log('Timesheet data received:', timesheetData);

        if (timesheetData.timesheets && timesheetData.timesheets.length > 0) {
          // Clear message if timesheets found in date range
          setTimesheetInfoMessage(null);
          
          // Get current items
          const currentItems = watch('items') || [];
          
          // Remove existing timesheet items and header
          const filteredItems = currentItems.filter((item: any) => 
            item.type !== 'TIMESHEET' && item.name !== 'Timesheet Hours'
          );

          // Add header for timesheet section
          const newItems: any[] = [
            ...filteredItems,
            {
              name: 'Timesheet Hours',
              description: '',
              quantity: 0,
              rate: 0,
              taxRate: 0,
              type: 'HEADER' as const,
            },
          ];

          // Add individual timesheet entries
          timesheetData.timesheets.forEach((timesheet: any) => {
            const hours = Number(timesheet.hours);
            newItems.push({
              name: `Work on ${new Date(timesheet.date).toLocaleDateString()}`,
              description: timesheet.description || `${hours} hours @ ₹${timesheetData.hourlyRate}/hr`,
              quantity: hours,
              rate: timesheetData.hourlyRate,
              taxRate: 0,
              type: 'TIMESHEET' as const,
            });
          });

          console.log('Adding timesheet items to form:', newItems);
          replace(newItems);
        } else {
          console.log('No timesheets found for date range');
          
          // Show message if project has timesheets but none in the selected date range
          if (hasAnyTimesheets) {
            setTimesheetInfoMessage(`Note: This project has timesheet records, but none are available in the selected date range (${new Date(issueDate).toLocaleDateString()} - ${expiryDate ? new Date(expiryDate).toLocaleDateString() : 'present'}).`);
          } else {
            setTimesheetInfoMessage(null);
          }
          
          // If no timesheets found, remove any existing timesheet items
          const currentItems = watch('items') || [];
          const filteredItems = currentItems.filter((item: any) => 
            item.type !== 'TIMESHEET' && item.name !== 'Timesheet Hours'
          );
          if (filteredItems.length !== currentItems.length) {
            replace(filteredItems.length > 0 ? filteredItems : [{ name: '', quantity: 1, rate: 0, taxRate: 0 }]);
          }
        }
      } catch (error) {
        // If fetch fails, silently continue (project might not have timesheets)
        console.error('Failed to fetch timesheet hours:', error);
        setTimesheetInfoMessage(null);
      }
    };

    // Only fetch if we have both projectId and issueDate, and wait a bit for form to be populated when editing
    if (projectId && issueDate) {
      // Small delay to ensure form is populated when editing
      const timeoutId = setTimeout(() => {
        fetchAndAddTimesheetHours();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    } else {
      setTimesheetInfoMessage(null);
    }
  }, [projectId, issueDate, expiryDate, watch, replace]);

  // Remove timesheet items when project is deselected
  useEffect(() => {
    if (!projectId) {
      const currentItems = watch('items') || [];
      const filteredItems = currentItems.filter((item: any) => 
        item.type !== 'TIMESHEET' && item.name !== 'Timesheet Hours'
      );
      if (filteredItems.length !== currentItems.length) {
        replace(filteredItems.length > 0 ? filteredItems : [{ name: '', quantity: 1, rate: 0, taxRate: 0 }]);
      }
    }
  }, [projectId, watch, replace]);

  const createMutation = useMutation({
    mutationFn: async (data: QuoteFormData) => {
      // Clean up the data before sending
      const cleanedData = {
        ...data,
        items: data.items.map((item) => {
          // Ensure name is not empty after trimming
          const trimmedName = item.name?.trim() || '';
          if (!trimmedName) {
            throw new Error(`Item at index ${data.items.indexOf(item)} has an empty name`);
          }
          
          const cleanedItem: any = {
            name: trimmedName,
            quantity: Number(item.quantity),
            rate: Number(item.rate),
            taxRate: Number(item.taxRate),
            type: item.type || 'ITEM', // Include type field for proper validation
          };
          
          // Only include itemId if it exists, is not empty, and is a valid UUID (for items from the list)
          // Custom items (not from dropdown) won't have itemId, which is fine
          if (item.itemId && item.itemId !== '' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.itemId)) {
            cleanedItem.itemId = item.itemId;
          }
          
          // Only include description if it exists and is not empty
          if (item.description && item.description !== '') {
            cleanedItem.description = item.description;
          }
          
          return cleanedItem;
        }),
        templateId: data.templateId && data.templateId !== '' ? data.templateId : undefined,
        projectId: data.projectId && data.projectId !== '' ? data.projectId : undefined,
        paymentTerms: data.paymentTerms,
        issueDate: new Date(data.issueDate).toISOString(),
        expiryDate: new Date(data.expiryDate).toISOString(),
        notes: data.notes && data.notes !== '' ? data.notes : undefined,
      };
      await api.post('/quotes', cleanedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      showToast('Quote created successfully', 'success');
      navigate('/quotes');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error?.message || error?.message || 'Failed to create quote';
      showToast(errorMessage, 'error');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: QuoteFormData) => {
      // Clean up the data before sending
      const cleanedData = {
        ...data,
        items: data.items.map((item) => {
          // Ensure name is not empty after trimming
          const trimmedName = item.name?.trim() || '';
          if (!trimmedName) {
            throw new Error(`Item at index ${data.items.indexOf(item)} has an empty name`);
          }
          
          const cleanedItem: any = {
            name: trimmedName,
            quantity: Number(item.quantity),
            rate: Number(item.rate),
            taxRate: Number(item.taxRate),
            type: item.type || 'ITEM', // Include type field for proper validation
          };
          
          // Only include itemId if it exists, is not empty, and is a valid UUID (for items from the list)
          // Custom items (not from dropdown) won't have itemId, which is fine
          if (item.itemId && item.itemId !== '' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.itemId)) {
            cleanedItem.itemId = item.itemId;
          }
          
          // Only include description if it exists and is not empty
          if (item.description && item.description !== '') {
            cleanedItem.description = item.description;
          }
          
          return cleanedItem;
        }),
        templateId: data.templateId && data.templateId !== '' ? data.templateId : undefined,
        issueDate: new Date(data.issueDate).toISOString(),
        expiryDate: new Date(data.expiryDate).toISOString(),
        notes: data.notes && data.notes !== '' ? data.notes : undefined,
      };
      await api.put(`/quotes/${id}`, cleanedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      showToast('Quote updated successfully', 'success');
      navigate('/quotes');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error?.message || error?.message || 'Failed to update quote';
      showToast(errorMessage, 'error');
    },
  });

  const onSubmit = (data: QuoteFormData) => {
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleItemSelect = (index: number, item: any) => {
    setValue(`items.${index}.itemId`, item.id);
    setValue(`items.${index}.name`, item.name);
    setValue(`items.${index}.description`, item.description || '');
    setValue(`items.${index}.rate`, Number(item.rate));
    setValue(`items.${index}.taxRate`, Number(item.taxRate));
  };

  if (isEdit && quoteLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <button
          onClick={() => navigate('/quotes')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          <span className="font-medium">Back to Quotes</span>
        </button>
        <h1 className="text-3xl font-bold text-gray-900">
          {isEdit ? 'Edit Quote' : 'Create Quote'}
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          {isEdit ? 'Update quote details' : 'Create a new quote for your customer'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Quote Details */}
        <div className="card">
          <div className="flex items-center space-x-2 mb-6">
            <DocumentTextIcon className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Quote Details</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Contact *
              </label>
              <ModernDropdown
                options={[
                  { value: '', label: 'Select a contact' },
                  ...(contacts?.map((contact: any) => ({
                    value: contact.id,
                    label: contact.name,
                  })) || []),
                ]}
                value={watch('contactId') || ''}
                onChange={(value) => setValue('contactId', value, { shouldValidate: true })}
                placeholder="Select a contact"
                icon={<UserIcon className="w-5 h-5 text-gray-400" />}
              />
              {errors.contactId && (
                <p className="mt-1 text-sm text-red-600">{errors.contactId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Template
              </label>
              <ModernDropdown
                options={
                  templates?.map((template: any) => ({
                    value: template.id,
                    label: template.name,
                  })) || []
                }
                value={watch('templateId') || ''}
                onChange={(value) => setValue('templateId', value)}
                placeholder="Select a template"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Project
              </label>
              <ModernDropdown
                options={[
                  { value: '', label: 'Select a project' },
                  ...(projects?.filter((project: any) => project.status === 'ACTIVE').map((project: any) => ({
                    value: project.id,
                    label: project.name,
                  })) || []),
                ]}
                value={watch('projectId') || ''}
                onChange={(value) => setValue('projectId', value)}
                placeholder="Select a project"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Payment Terms
              </label>
              <ModernDropdown
                options={[
                  { value: '', label: 'Select payment terms' },
                  { value: 'Due on Receipt', label: 'Due on Receipt' },
                  { value: 'Net 15', label: 'Net 15' },
                  { value: 'Net 30', label: 'Net 30' },
                  { value: 'Net 45', label: 'Net 45' },
                  { value: 'Net 60', label: 'Net 60' },
                  { value: 'Custom', label: 'Custom' },
                ]}
                value={watch('paymentTerms') || ''}
                onChange={(value) => setValue('paymentTerms', value as any)}
                placeholder="Select payment terms"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Issue Date *
              </label>
              <div className="relative">
                <CalendarIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input
                  type="date"
                  {...register('issueDate', {
                    onChange: (e) => {
                      const newIssueDate = e.target.value;
                      // If expiry date exists and is before the new issue date, clear it (allow same date)
                      if (expiryDate && newIssueDate && new Date(expiryDate) < new Date(newIssueDate)) {
                        setValue('expiryDate', '');
                      }
                    },
                  })}
                  max={getIssueMaxDate()}
                  className={`input-field pl-12 ${errors.expiryDate ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                />
              </div>
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Expiry Date *
                </label>
              <div className="relative">
                <CalendarIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input
                  type="date"
                  {...register('expiryDate', {
                    onChange: (e) => {
                      const newExpiryDate = e.target.value;
                      // If issue date exists and is after the new expiry date, clear it (allow same date)
                      if (issueDate && newExpiryDate && new Date(issueDate) > new Date(newExpiryDate)) {
                        setValue('issueDate', '');
                      }
                      // Auto-select "Custom" if date doesn't match any payment term
                      if (issueDate && newExpiryDate) {
                        const matchingTerm = getPaymentTermForDate(issueDate, newExpiryDate);
                        setValue('paymentTerms', matchingTerm as any);
                      }
                    },
                  })}
                  min={getExpiryMinDate()}
                  className={`input-field pl-12 ${errors.expiryDate ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                />
              </div>
              {errors.expiryDate && (
                <p className="mt-1 text-sm text-red-600">{errors.expiryDate.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <DocumentTextIcon className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-900">Items</h2>
            </div>
            <button
              type="button"
              onClick={() => {
                const currentItems = watch('items') || [];
                // Find the index of the timesheet header (first item with name 'Timesheet Hours' or type 'HEADER' that is the timesheet header)
                const timesheetHeaderIndex = currentItems.findIndex((item: any) => 
                  item.name === 'Timesheet Hours' || (item.type === 'HEADER' && item.name === 'Timesheet Hours')
                );
                
                const newItem = { name: '', quantity: 1, rate: 0, taxRate: 0, type: 'ITEM' as const };
                
                // If timesheet header exists, insert before it, otherwise append
                if (timesheetHeaderIndex !== -1) {
                  insert(timesheetHeaderIndex, newItem);
                } else {
                  append(newItem);
                }
              }}
              className="btn-primary text-sm inline-flex items-center"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              <span>Add Item</span>
            </button>
          </div>
          {timesheetInfoMessage && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start space-x-2">
              <InformationCircleIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">{timesheetInfoMessage}</p>
            </div>
          )}
          <QuoteItemsTable
            fields={{ fields, append, remove } as any}
            register={register}
            watch={watch}
            setValue={setValue}
            items={items || []}
            onItemSelect={handleItemSelect}
          />
          {errors.items && (
            <p className="mt-2 text-sm text-red-600">{errors.items.message}</p>
          )}
        </div>

        {/* Notes */}
        <div className="card">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Notes
          </label>
          <textarea
            {...register('notes')}
            rows={4}
            className="input-field"
            placeholder="Additional notes or terms..."
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/quotes')}
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
              isEdit ? 'Update Quote' : 'Create Quote'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuoteForm;
