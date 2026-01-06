import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import InvoiceItemsTable from '../../components/Invoices/InvoiceItemsTable';
import ModernDropdown from '../../components/ModernDropdown';
import { ArrowLeftIcon, UserIcon, CalendarIcon, DocumentTextIcon, PlusIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useToast } from '../../contexts/ToastContext';

export const invoiceItemSchema = z.object({
  itemId: z.union([z.string().uuid(), z.literal('')]).optional(),
  type: z.enum(['ITEM', 'HEADER', 'TIMESHEET']).default('ITEM'),
  name: z.string().optional(),
  description: z.string().optional(),
  quantity: z.number().min(0).default(0),
  rate: z.number().min(0).default(0),
  taxRate: z.number().min(0).max(100).default(0),
}).superRefine((data, ctx) => {
  // HEADER
  if (data.type === 'HEADER') {
    if (!data.name || data.name.trim().length === 0) {
      ctx.addIssue({
        path: ['name'],
        message: 'Header name is required',
        code: z.ZodIssueCode.custom,
      });
    }
    return;
  }

  // TIMESHEET
  if (data.type === 'TIMESHEET') {
    if (!data.name || data.name.trim().length === 0) {
      ctx.addIssue({
        path: ['name'],
        message: 'Timesheet item name is required',
        code: z.ZodIssueCode.custom,
      });
    }

    if (data.quantity <= 0) {
      ctx.addIssue({
        path: ['quantity'],
        message: 'Timesheet hours must be greater than 0',
        code: z.ZodIssueCode.custom,
      });
    }

    if (data.rate <= 0) {
      ctx.addIssue({
        path: ['rate'],
        message: 'Timesheet rate must be greater than 0',
        code: z.ZodIssueCode.custom,
      });
    }
    return;
  }

  // ITEM
  if (!data.name || data.name.trim().length === 0) {
    ctx.addIssue({
      path: ['name'],
      message: 'Item name is required',
      code: z.ZodIssueCode.custom,
    });
  }

  if (data.quantity <= 0) {
    ctx.addIssue({
      path: ['quantity'],
      message: 'Quantity must be greater than 0',
      code: z.ZodIssueCode.custom,
    });
  }

  if (data.rate <= 0) {
    ctx.addIssue({
      path: ['rate'],
      message: 'Rate must be greater than 0',
      code: z.ZodIssueCode.custom,
    });
  }
});
const invoiceSchema = z.object({
  contactId: z.string().uuid('Please select a contact'),
  templateId: z.string().uuid().optional(),
  projectId: z.union([z.string().uuid(), z.literal('')]).optional(),
  paymentTerms: z.enum(['Due on Receipt', 'Net 15', 'Net 30', 'Net 45', 'Net 60', 'Custom']).optional(),
  issueDate: z.string().min(1, 'Issue date is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  items: z.array(invoiceItemSchema).min(1, 'At least one item or header is required').refine((items) => {
    // Ensure at least one valid item or header exists (with names)
    return items.some(item => item.name && item.name.trim().length > 0);
  }, {
    message: 'At least one item or header must have a name',
  }),
  notes: z.string().optional(),
}).refine((data) => {
  // Ensure issue date is before or equal to due date
  if (data.issueDate && data.dueDate) {
    return new Date(data.issueDate) <= new Date(data.dueDate);
  }
  return true;
}, {
  message: 'Due date must be on or after issue date',
  path: ['dueDate'],
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

const InvoiceForm = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const isEdit = !!id;
  const contactIdFromUrl = searchParams.get('contactId');
  const quoteIdFromUrl = searchParams.get('quoteId');
  const projectIdFromUrl = searchParams.get('projectId');

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

  // Find default template (Spreadsheet Template)
  const defaultTemplate = templates?.find((t: any) => t.isDefault);

  const { data: invoice } = useQuery({
    queryKey: ['invoice', id],
    queryFn: async () => {
      const res = await api.get(`/invoices/${id}`);
      return res.data.data;
    },
    enabled: isEdit,
  });

  // Fetch quote data if quoteId is provided
  const { data: quoteData } = useQuery({
    queryKey: ['quoteForInvoice', quoteIdFromUrl],
    queryFn: async () => {
      const res = await api.get(`/invoices/from-quote/${quoteIdFromUrl}`);
      return res.data.data;
    },
    enabled: !!quoteIdFromUrl && !isEdit,
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      items: [{ type: 'ITEM', name: '', quantity: 1, rate: 0, taxRate: 0 }],
      contactId: contactIdFromUrl || undefined,
    },
  });

  const issueDate = watch('issueDate');
  const dueDate = watch('dueDate');
  const paymentTerms = watch('paymentTerms');
  const projectId = watch('projectId');
  
  // Calculate due date based on payment terms
  const calculateDueDateFromPaymentTerms = (issueDateValue: string, paymentTermsValue: string | undefined): string | undefined => {
    if (!issueDateValue || !paymentTermsValue || paymentTermsValue === 'Custom') {
      return undefined;
    }

    const issue = new Date(issueDateValue);
    const due = new Date(issue);

    switch (paymentTermsValue) {
      case 'Due on Receipt':
        // Same day
        break;
      case 'Net 15':
        due.setDate(due.getDate() + 15);
        break;
      case 'Net 30':
        due.setDate(due.getDate() + 30);
        break;
      case 'Net 45':
        due.setDate(due.getDate() + 45);
        break;
      case 'Net 60':
        due.setDate(due.getDate() + 60);
        break;
      default:
        return undefined;
    }

    return due.toISOString().split('T')[0];
  };

  // Check if a date matches any payment term calculation
  const getPaymentTermForDate = (issueDateValue: string, dueDateValue: string): string | undefined => {
    if (!issueDateValue || !dueDateValue) return undefined;

    const issue = new Date(issueDateValue);
    const due = new Date(dueDateValue);
    const diffDays = Math.floor((due.getTime() - issue.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Due on Receipt';
    if (diffDays === 15) return 'Net 15';
    if (diffDays === 30) return 'Net 30';
    if (diffDays === 45) return 'Net 45';
    if (diffDays === 60) return 'Net 60';
    return 'Custom';
  };
  
  // Calculate min date for due date (should be at least issue date or today)
  const getDueMinDate = () => {
    if (issueDate) {
      return issueDate;
    }
    return new Date().toISOString().split('T')[0];
  };

  // Calculate max date for issue date (should be at most due date)
  const getIssueMaxDate = () => {
    if (dueDate) {
      return dueDate;
    }
    return undefined;
  };

  const { fields, append, insert, remove, replace } = useFieldArray({
    control,
    name: 'items',
  });
  
  // Handle adding new item - insert before timesheet header if exists
  const handleAddNewRow = () => {
    // Get current items from form state
    const currentItems = watch('items') || [];
    
    // Find the index of the timesheet header (first item with name 'Timesheet Hours')
    const timesheetHeaderIndex = currentItems.findIndex((item: any) => 
      item.name === 'Timesheet Hours' || (item.type === 'HEADER' && item.name === 'Timesheet Hours')
    );
    
    const newItem = { type: 'ITEM' as const, name: '', quantity: 1, rate: 0, taxRate: 0 };
    
    // If timesheet header exists, insert before it, otherwise append
    if (timesheetHeaderIndex !== -1) {
      insert(timesheetHeaderIndex, newItem);
    } else {
      // No timesheet header found, append at the end
      append(newItem);
    }
  };
  
  // Handle adding new header - automatically add an item below it
  const handleAddNewHeader = () => {
    const newHeader = { type: 'HEADER' as const, name: '', quantity: 0, rate: 0, taxRate: 0 };
    const newItem = { type: 'ITEM' as const, name: '', quantity: 1, rate: 0, taxRate: 0 };
    
    // Get current length from fields array (more reliable than watch)
    const currentLength = fields.length;
    
    // Add the header first
    append(newHeader);
    
    // Insert the item right after the header we just added
    // The header will be at index currentLength, so item goes at currentLength + 1
    insert(currentLength + 1, newItem);
  };

  // Pre-fill contactId and projectId from URL if provided and not editing
  useEffect(() => {
    if (!isEdit && contactIdFromUrl) {
      setValue('contactId', contactIdFromUrl);
    }
    if (!isEdit && projectIdFromUrl) {
      setValue('projectId', projectIdFromUrl);
    }
    if (!isEdit && defaultTemplate) {
      // Set default template for new invoices
      setValue('templateId', defaultTemplate.id);
    }
  }, [contactIdFromUrl, projectIdFromUrl, isEdit, setValue, defaultTemplate]);

  // Populate form when editing and invoice data is loaded
  useEffect(() => {
    if (isEdit && invoice) {
      setValue('contactId', invoice.contactId);
      setValue('templateId', invoice.templateId || '');
      setValue('projectId', invoice.projectId || '');
      setValue('paymentTerms', invoice.paymentTerms || undefined);
      setValue('issueDate', invoice.issueDate ? new Date(invoice.issueDate).toISOString().split('T')[0] : '');
      setValue('dueDate', invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : '');
      setValue('notes', invoice.notes || '');
      
      // Replace items using useFieldArray's replace method
      if (invoice.items && invoice.items.length > 0) {
        const formattedItems = invoice.items.map((item: any) => ({
          itemId: item.itemId || undefined,
          type: item.type || 'ITEM',
          name: item.name,
          description: item.description || '',
          quantity: Number(item.quantity),
          rate: Number(item.rate),
          taxRate: Number(item.taxRate),
        }));
        replace(formattedItems);
      }
    }
  }, [isEdit, invoice, setValue, replace]);

  // Populate form with quote data when quoteId is provided
  useEffect(() => {
    if (!isEdit && quoteData) {
      setValue('contactId', quoteData.contactId);
      if (quoteData.templateId) {
        setValue('templateId', quoteData.templateId);
      }
      if (quoteData.projectId) {
        setValue('projectId', quoteData.projectId);
      }
      if (quoteData.paymentTerms) {
        setValue('paymentTerms', quoteData.paymentTerms);
      }
      // Set issue date to today for new invoice from quote
      const today = new Date().toISOString().split('T')[0];
      setValue('issueDate', today);
      // Calculate due date based on payment terms
      if (quoteData.paymentTerms && quoteData.paymentTerms !== 'Custom') {
        const calculatedDueDate = calculateDueDateFromPaymentTerms(today, quoteData.paymentTerms);
        if (calculatedDueDate) {
          setValue('dueDate', calculatedDueDate);
        }
      } else {
        // If no payment terms or custom, set due date to today
        setValue('dueDate', today);
      }
      if (quoteData.notes) {
        setValue('notes', quoteData.notes);
      }
      
      // Replace items with quote items
      if (quoteData.items && quoteData.items.length > 0) {
        const formattedItems = quoteData.items.map((item: any) => ({
          itemId: item.itemId || undefined,
          type: item.type || 'ITEM',
          name: item.name,
          description: item.description || '',
          quantity: Number(item.quantity),
          rate: Number(item.rate),
          taxRate: Number(item.taxRate),
        }));
        replace(formattedItems);
      }
    }
  }, [quoteData, isEdit, setValue, replace]);

  // Auto-calculate due date when payment terms change
  useEffect(() => {
    if (paymentTerms && paymentTerms !== 'Custom' && issueDate) {
      const calculatedDate = calculateDueDateFromPaymentTerms(issueDate, paymentTerms);
      if (calculatedDate) {
        setValue('dueDate', calculatedDate, { shouldValidate: true });
      }
    }
  }, [paymentTerms, issueDate, setValue]);

  // Auto-calculate due date when issue date changes (if payment terms is set and not Custom)
  useEffect(() => {
    if (paymentTerms && paymentTerms !== 'Custom' && issueDate) {
      const calculatedDate = calculateDueDateFromPaymentTerms(issueDate, paymentTerms);
      if (calculatedDate) {
        setValue('dueDate', calculatedDate, { shouldValidate: true });
      }
    }
  }, [issueDate, paymentTerms, setValue]);

  const [timesheetInfoMessage, setTimesheetInfoMessage] = useState<string | null>(null);

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
        // Use due date or current date, whichever is later, to include future timesheets
        const endDate = dueDate 
          ? new Date(dueDate).toISOString().split('T')[0] 
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
          const newItems = [
            ...filteredItems,
            {
              type: 'HEADER',
              name: 'Timesheet Hours',
              description: '',
              quantity: 0,
              rate: 0,
              taxRate: 0,
            },
          ];

          // Add individual timesheet entries
          timesheetData.timesheets.forEach((timesheet: any) => {
            const hours = Number(timesheet.hours);
            newItems.push({
              type: 'TIMESHEET',
              name: `Work on ${new Date(timesheet.date).toLocaleDateString()}`,
              description: timesheet.description || `${hours} hours @ ₹${timesheetData.hourlyRate}/hr`,
              quantity: hours,
              rate: timesheetData.hourlyRate,
              taxRate: 0,
            });
          });

          console.log('Adding timesheet items to form:', newItems);
          replace(newItems as any);
        } else {
          console.log('No timesheets found for date range');
          
          // Show message if project has timesheets but none in the selected date range
          if (hasAnyTimesheets) {
            setTimesheetInfoMessage(`Note: This project has timesheet records, but none are available in the selected date range (${new Date(issueDate).toLocaleDateString()} - ${dueDate ? new Date(dueDate).toLocaleDateString() : 'present'}).`);
          } else {
            setTimesheetInfoMessage(null);
          }
          
          // If no timesheets found, remove any existing timesheet items
          const currentItems = watch('items') || [];
          const filteredItems = currentItems.filter((item: any) => 
            item.type !== 'TIMESHEET' && item.name !== 'Timesheet Hours'
          );
          if (filteredItems.length !== currentItems.length) {
            replace(filteredItems.length > 0 ? filteredItems : [{ type: 'ITEM', name: '', quantity: 1, rate: 0, taxRate: 0 }]);
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
  }, [projectId, issueDate, dueDate, watch, replace]);

  // Remove timesheet items when project is deselected
  useEffect(() => {
    if (!projectId) {
      const currentItems = watch('items') || [];
      const filteredItems = currentItems.filter((item: any) => 
        item.type !== 'TIMESHEET' && item.name !== 'Timesheet Hours'
      );
      if (filteredItems.length !== currentItems.length) {
        replace(filteredItems.length > 0 ? filteredItems : [{ type: 'ITEM', name: '', quantity: 1, rate: 0, taxRate: 0 }]);
      }
    }
  }, [projectId, watch, replace]);

  const createMutation = useMutation({
    mutationFn: async (data: InvoiceFormData) => {
      // Clean up the data before sending
      // Filter out items/headers with empty names
      const validItems = data.items.filter(item => item.name && item.name.trim().length > 0);
      
      if (validItems.length === 0) {
        throw new Error('At least one item or header must have a name');
      }
      
      const cleanedData = {
        contactId: data.contactId,
        items: validItems.map((item) => {
          const cleanedItem: any = {
            type: item.type || 'ITEM',
            name: item.name?.trim(),
            // Headers should have quantity and rate as 0
            quantity: item.type === 'HEADER' ? 0 : Number(item.quantity),
            rate: item.type === 'HEADER' ? 0 : Number(item.rate),
            taxRate: item.type === 'HEADER' ? 0 : Number(item.taxRate),
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
        dueDate: new Date(data.dueDate).toISOString(),
        notes: data.notes && data.notes !== '' ? data.notes : undefined,
        quoteId: quoteIdFromUrl || undefined,
      };
      
      const response = await api.post('/invoices', cleanedData);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      if (quoteIdFromUrl) {
        showToast('Invoice created from quote successfully. Quote status updated to INVOICED.', 'success');
      } else {
        showToast('Invoice created successfully', 'success');
      }
      // Navigate to the created invoice detail page
      if (data?.data?.id) {
        navigate(`/invoices/${data.data.id}`);
      } else {
        navigate('/invoices');
      }
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error?.message || error?.message || 'Failed to create invoice';
      showToast(errorMessage, 'error');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InvoiceFormData) => {
      // Clean up the data before sending
      // Filter out items/headers with empty names
      const validItems = data.items.filter(item => item.name && item.name.trim().length > 0);
      
      if (validItems.length === 0) {
        throw new Error('At least one item or header must have a name');
      }
      
      const cleanedData = {
        contactId: data.contactId, // Required field
        items: validItems.map((item) => {
          const cleanedItem: any = {
            type: item.type || 'ITEM',
            name: item.name?.trim(),
            // Headers should have quantity and rate as 0
            quantity: item.type === 'HEADER' ? 0 : Number(item.quantity),
            rate: item.type === 'HEADER' ? 0 : Number(item.rate),
            taxRate: item.type === 'HEADER' ? 0 : Number(item.taxRate),
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
        dueDate: new Date(data.dueDate).toISOString(),
        notes: data.notes && data.notes !== '' ? data.notes : undefined,
      };
      
      console.log('Sending update data:', JSON.stringify(cleanedData, null, 2));
      console.log('API endpoint:', `/invoices/${id}`);
      const response = await api.put(`/invoices/${id}`, cleanedData);
      console.log('Update response:', response);
      return response.data;
    },
    onError: (error: any) => {
      console.error('Update error:', error);
      const errorMessage = error?.response?.data?.error?.message || error?.message || 'Failed to update invoice';
      showToast(errorMessage, 'error');
      if (error.response?.data?.error) {
        console.error('Error response:', error.response.data.error);
        if (error.response.data.error.details) {
          console.error('Validation errors:', JSON.stringify(error.response.data.error.details, null, 2));
        }
        if (error.response.data.error.message) {
          console.error('Error message:', error.response.data.error.message);
        }
      }
    },
    onSuccess: (data) => {
      console.log('Update successful:', data);
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      showToast('Invoice updated successfully', 'success');
      navigate('/invoices');
    },
  });

  const onSubmit = (data: InvoiceFormData) => {
    console.log('Form submitted with data:', data);
    console.log('Is edit mode:', isEdit);
    if (isEdit) {
      console.log('Calling updateMutation...');
      updateMutation.mutate(data);
    } else {
      console.log('Calling createMutation...');
      createMutation.mutate(data);
    }
  };

  const onError = (errors: any) => {
    console.error('Form validation errors:', errors);
    showToast('Please fix the form errors before submitting', 'error');
  };

  const handleItemSelect = (index: number, item: any) => {
    setValue(`items.${index}.itemId`, item.id);
    setValue(`items.${index}.name`, item.name);
    setValue(`items.${index}.description`, item.description || '');
    setValue(`items.${index}.rate`, Number(item.rate));
    setValue(`items.${index}.taxRate`, Number(item.taxRate));
  };

  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <button
          onClick={() => navigate('/invoices')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          <span className="font-medium">Back to Invoices</span>
        </button>
        <h1 className="text-3xl font-bold text-gray-900">
          {isEdit ? 'Edit Invoice' : 'Create Invoice'}
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          {isEdit ? 'Update invoice details' : 'Create a new invoice for your customer'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Invoice Details */}
        <div className="card">
          <div className="flex items-center space-x-2 mb-6">
            <DocumentTextIcon className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Invoice Details</h2>
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
                      // If due date exists and is before the new issue date, clear it (allow same date)
                      if (dueDate && newIssueDate && new Date(dueDate) < new Date(newIssueDate)) {
                        setValue('dueDate', '');
                      }
                    },
                  })}
                  max={getIssueMaxDate()}
                  className={`input-field pl-12 ${errors.dueDate ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Due Date *
              </label>
              <div className="relative">
                <CalendarIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input
                  type="date"
                  {...register('dueDate', {
                    onChange: (e) => {
                      const newDueDate = e.target.value;
                      // If issue date exists and is after the new due date, clear it (allow same date)
                      if (issueDate && newDueDate && new Date(issueDate) > new Date(newDueDate)) {
                        setValue('issueDate', '');
                      }
                      // Auto-select "Custom" if date doesn't match any payment term
                      if (issueDate && newDueDate) {
                        const matchingTerm = getPaymentTermForDate(issueDate, newDueDate);
                        setValue('paymentTerms', matchingTerm as any);
                      }
                    },
                  })}
                  min={getDueMinDate()}
                  className={`input-field pl-12 ${errors.dueDate ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                />
              </div>
              {errors.dueDate && (
                <p className="mt-1 text-sm text-red-600">{errors.dueDate.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <DocumentTextIcon className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-900">Item Table</h2>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleAddNewRow}
                className="btn-primary text-sm inline-flex items-center"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                <span>Add New Row</span>
              </button>
              <button
                type="button"
                onClick={handleAddNewHeader}
                className="btn-secondary text-sm inline-flex items-center"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                <span>Add New Header</span>
              </button>
            </div>
          </div>
          {timesheetInfoMessage && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start space-x-2">
              <InformationCircleIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">{timesheetInfoMessage}</p>
            </div>
          )}
          <InvoiceItemsTable
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
            placeholder="Additional notes or payment terms..."
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/invoices')}
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
              isEdit ? 'Update Invoice' : 'Create Invoice'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InvoiceForm;
