import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { ArrowLeftIcon, ClockIcon, FolderIcon, CalendarIcon, UserIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/LoadingSpinner';
import ModernDropdown from '../../components/ModernDropdown';
import { useToast } from '../../contexts/ToastContext';

const timesheetSchema = z.object({
  projectId: z.string().uuid('Please select a project'),
  userId: z.union([z.string().uuid('Please select a user'), z.literal('')]).optional(),
  customUserName: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  hours: z.number().positive('Hours must be positive'),
  description: z.string().optional(),
  billable: z.boolean().default(true),
}).transform((data) => {
  // Convert empty string to undefined for userId
  return {
    ...data,
    userId: data.userId === '' ? undefined : data.userId,
  };
}).superRefine((data, ctx) => {
  // Either userId or customUserName must be provided (at least one)
  const hasUserId = data.userId && data.userId.trim() !== '';
  const hasCustomName = data.customUserName && data.customUserName.trim() !== '';
  
  if (!hasUserId && !hasCustomName) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Please either select a user or enter a custom user name',
      path: ['customUserName'],
    });
    return;
  }
  // But not both
  if (hasUserId && hasCustomName) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Please select a user OR enter a custom name, not both',
      path: ['customUserName'],
    });
  }
});

type TimesheetFormData = z.infer<typeof timesheetSchema>;

const TimesheetForm = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const isEdit = !!id;
  const projectIdFromUrl = searchParams.get('projectId');

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await api.get('/projects');
      return res.data.data.projects;
    },
  });

  // Filter to only show ACTIVE projects
  const activeProjects = projects?.filter((p: any) => p.status === 'ACTIVE') || [];

  // Fetch contacts for the user dropdown
  const { data: contactsData, error: contactsError } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const res = await api.get('/contacts?limit=100&status=ACTIVE');
      return res.data.data;
    },
    retry: false,
  });

  const { data: timesheet, isLoading } = useQuery({
    queryKey: ['timesheet', id],
    queryFn: async () => {
      const res = await api.get(`/timesheets/${id}`);
      return res.data.data;
    },
    enabled: isEdit,
  });

  const { register, handleSubmit, watch, setValue, trigger, formState: { errors, isSubmitting } } = useForm<TimesheetFormData>({
    resolver: zodResolver(timesheetSchema),
    defaultValues: timesheet || { billable: true, hours: 0 },
    mode: 'onChange', // Validate on change to clear errors immediately
  });

  const userId = watch('userId');
  const customUserName = watch('customUserName');
  const projectId = watch('projectId');

  // Fetch selected project details to get date range
  const { data: selectedProject } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const res = await api.get(`/projects/${projectId}`);
      return res.data.data;
    },
    enabled: !!projectId,
  });

  // Clear customUserName when userId is selected
  useEffect(() => {
    if (userId) {
      setValue('customUserName', '', { shouldValidate: true });
    }
  }, [userId, setValue]);

  // Clear userId when customUserName is entered
  useEffect(() => {
    if (customUserName && customUserName.trim()) {
      setValue('userId', '', { shouldValidate: true });
    }
  }, [customUserName, setValue]);

  // Calculate min and max dates based on project date range
  const getDateMin = () => {
    if (selectedProject?.startDate) {
      return new Date(selectedProject.startDate).toISOString().split('T')[0];
    }
    return undefined;
  };

  const getDateMax = () => {
    if (selectedProject?.endDate) {
      return new Date(selectedProject.endDate).toISOString().split('T')[0];
    }
    return undefined;
  };

  // Pre-fill projectId from URL if provided and not editing
  useEffect(() => {
    if (!isEdit && projectIdFromUrl) {
      setValue('projectId', projectIdFromUrl);
    }
  }, [projectIdFromUrl, isEdit, setValue]);

  // Pre-fill form when editing and timesheet data is loaded
  useEffect(() => {
    if (isEdit && timesheet) {
      setValue('projectId', timesheet.projectId);
      setValue('userId', timesheet.userId || '');
      setValue('customUserName', timesheet.customUserName || '');
      setValue('date', timesheet.date ? new Date(timesheet.date).toISOString().split('T')[0] : '');
      setValue('hours', Number(timesheet.hours) || 0);
      setValue('description', timesheet.description || '');
      setValue('billable', timesheet.billable ?? true);
    }
  }, [isEdit, timesheet, setValue]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        const response = await api.post('/timesheets', data);
        return response.data;
      } catch (error) {
        console.error('Create timesheet error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Create timesheet success:', data);
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
      showToast('Timesheet created successfully', 'success');
      navigate('/timesheets');
    },
    onError: (error: any) => {
      console.error('Create timesheet onError:', error);
      const errorMessage = error?.response?.data?.error?.message || error?.message || 'Failed to create timesheet';
      showToast(errorMessage, 'error');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        const response = await api.put(`/timesheets/${id}`, data);
        return response.data;
      } catch (error) {
        console.error('Update timesheet error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Update timesheet success:', data);
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
      showToast('Timesheet updated successfully', 'success');
      navigate('/timesheets');
    },
    onError: (error: any) => {
      console.error('Update timesheet onError:', error);
      const errorMessage = error?.response?.data?.error?.message || error?.message || 'Failed to update timesheet';
      showToast(errorMessage, 'error');
    },
  });

  const onSubmit = (data: TimesheetFormData) => {
    // Clean up the data before sending
    const submitData: any = {
      projectId: data.projectId,
      date: new Date(data.date).toISOString(),
      hours: data.hours,
      billable: data.billable,
      description: data.description || undefined,
    };
    
    // Only include userId if it's a valid UUID (not empty string)
    if (data.userId && data.userId.trim() !== '') {
      submitData.userId = data.userId;
    }
    
    // Only include customUserName if it's provided
    if (data.customUserName && data.customUserName.trim() !== '') {
      submitData.customUserName = data.customUserName.trim();
    }
    
    if (isEdit) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
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
    <div className="max-w-5xl">
      <div className="mb-6">
        <button
          onClick={() => navigate('/timesheets')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          <span className="font-medium">Back to Timesheets</span>
        </button>
        <h1 className="text-3xl font-bold text-gray-900">
          {isEdit ? 'Edit Timesheet' : 'Log Time'}
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          {isEdit ? 'Update time entry' : 'Record time spent on a project'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Project *
            </label>
            <ModernDropdown
              options={[
                { value: '', label: 'Select project' },
                ...(activeProjects.map((p: any) => ({
                  value: p.id,
                  label: p.name,
                })) || []),
              ]}
              value={watch('projectId') || ''}
              onChange={(value) => setValue('projectId', value, { shouldValidate: true })}
              placeholder="Select project"
              icon={<FolderIcon className="w-5 h-5 text-gray-400" />}
              name="projectId"
            />
            {errors.projectId && (
              <p className="mt-1 text-sm text-red-600">{errors.projectId.message}</p>
            )}
          </div>

          {/* Show contact dropdown if contacts are available */}
          {!contactsError && contactsData?.contacts && contactsData.contacts.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                User
              </label>
              <ModernDropdown
                options={[
                  { value: '', label: 'Select user' },
                  ...(contactsData.contacts.map((contact: any) => ({
                    value: contact.id,
                    label: `${contact.name}${contact.company ? ` (${contact.company})` : ''}`,
                  }))),
                ]}
                value={watch('userId') || ''}
                onChange={(value) => setValue('userId', value || '', { shouldValidate: true })}
                placeholder="Select user"
                icon={<UserIcon className="w-5 h-5 text-gray-400" />}
                name="userId"
              />
              {errors.userId && (
                <p className="mt-1 text-sm text-red-600">{errors.userId.message}</p>
              )}
            </div>
          )}

          {/* Show custom user name field if no contact is selected */}
          {!userId && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {contactsError || !contactsData?.contacts || contactsData.contacts.length === 0 
                  ? 'User Name' 
                  : 'Custom User Name'}
              </label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  {...register('customUserName', {
                    onChange: async (e) => {
                      // Clear userId when custom name is entered
                      const value = e.target.value;
                      if (value && value.trim()) {
                        setValue('userId', '', { shouldValidate: false });
                      }
                      // Trigger validation when user types
                      await trigger('customUserName');
                    }
                  })}
                  className="input-field pl-12"
                  placeholder={contactsError || !contactsData?.contacts || contactsData.contacts.length === 0
                    ? "Enter user name"
                    : "Or enter custom user name (if not in database)"}
                />
              </div>
              {errors.customUserName && (
                <p className="mt-1 text-sm text-red-600">{errors.customUserName.message}</p>
              )}
              {contactsError && (
                <p className="mt-1 text-xs text-gray-500">
                  Unable to load contacts. Please enter the user name manually.
                </p>
              )}
              {!contactsError && contactsData?.contacts && contactsData.contacts.length > 0 && (
                <p className="mt-1 text-xs text-gray-500">
                  Use this if the user is not in the database
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Date *
            </label>
            <div className="relative">
              <CalendarIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <input
                type="date"
                {...register('date')}
                min={getDateMin()}
                max={getDateMax()}
                className="input-field pl-12"
              />
            </div>
            {errors.date && (
              <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
            )}
            {selectedProject && (
              <p className="mt-1 text-xs text-gray-500">
                {selectedProject.startDate && selectedProject.endDate
                  ? `Date must be between ${new Date(selectedProject.startDate).toLocaleDateString()} and ${new Date(selectedProject.endDate).toLocaleDateString()}`
                  : selectedProject.startDate
                  ? `Date must be on or after ${new Date(selectedProject.startDate).toLocaleDateString()}`
                  : selectedProject.endDate
                  ? `Date must be on or before ${new Date(selectedProject.endDate).toLocaleDateString()}`
                  : ''}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Hours *
            </label>
            <div className="relative">
              <ClockIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <input
                type="number"
                step="0.25"
                {...register('hours', { valueAsNumber: true })}
                className="input-field pl-12"
                placeholder="0.00"
              />
            </div>
            {errors.hours && (
              <p className="mt-1 text-sm text-red-600">{errors.hours.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Billable
            </label>
            <div className="mt-2">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('billable')}
                  className="w-5 h-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">Mark as billable</span>
              </label>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Description
          </label>
          <textarea
            {...register('description')}
            rows={4}
            className="input-field"
            placeholder="What did you work on?"
          />
        </div>

        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/timesheets')}
            className="btn-secondary"
            disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
          >
            {isSubmitting || createMutation.isPending || updateMutation.isPending ? (
              <span className="flex items-center space-x-2">
                <LoadingSpinner size="sm" />
                <span>Saving...</span>
              </span>
            ) : (
              isEdit ? 'Update Entry' : 'Log Time'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TimesheetForm;
