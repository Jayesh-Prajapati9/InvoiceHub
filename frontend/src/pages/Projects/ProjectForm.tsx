import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { ArrowLeftIcon, FolderIcon, UserIcon, CalendarIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/LoadingSpinner';
import ModernDropdown from '../../components/ModernDropdown';

const projectSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  contactId: z.string().uuid('Please select a contact'),
  hourlyRate: z.number().positive('Hourly rate must be positive'),
  status: z.enum(['ACTIVE', 'COMPLETED', 'ON_HOLD', 'CANCELLED']).default('ACTIVE'),
  startDate: z.string().optional(),
  endDate: z.string().optional().refine((val) => {
    if (!val) return true; // Optional field
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(val);
    return endDate > today;
  }, {
    message: 'End date must be greater than today',
  }),
  addToDashboard: z.boolean().optional().default(false),
});

type ProjectFormData = z.infer<typeof projectSchema>;

const ProjectForm = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;
  const contactIdFromUrl = searchParams.get('contactId');

  const { data: contacts } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const res = await api.get('/contacts?status=ACTIVE');
      return res.data.data.contacts;
    },
  });

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const res = await api.get(`/projects/${id}`);
      return res.data.data;
    },
    enabled: isEdit,
  });

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: project || { status: 'ACTIVE', hourlyRate: 0, contactId: contactIdFromUrl || undefined },
  });

  // Pre-fill contactId from URL if provided and not editing
  useEffect(() => {
    if (!isEdit && contactIdFromUrl) {
      setValue('contactId', contactIdFromUrl);
    }
  }, [contactIdFromUrl, isEdit, setValue]);

  // Populate form when editing and project data is loaded
  useEffect(() => {
    if (isEdit && project) {
      setValue('name', project.name || '');
      setValue('description', project.description || '');
      setValue('contactId', project.contactId || '');
      setValue('hourlyRate', project.hourlyRate || 0);
      setValue('status', project.status || 'ACTIVE');
      setValue('startDate', project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '');
      setValue('endDate', project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '');
      setValue('addToDashboard', project.addToDashboard || false);
    }
  }, [isEdit, project, setValue]);

  const createMutation = useMutation({
    mutationFn: async (data: ProjectFormData) => {
      await api.post('/projects', {
        ...data,
        startDate: data.startDate ? new Date(data.startDate).toISOString() : undefined,
        endDate: data.endDate ? new Date(data.endDate).toISOString() : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      navigate('/projects');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ProjectFormData) => {
      await api.put(`/projects/${id}`, {
        ...data,
        startDate: data.startDate ? new Date(data.startDate).toISOString() : undefined,
        endDate: data.endDate ? new Date(data.endDate).toISOString() : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      navigate('/projects');
    },
  });

  const onSubmit = (data: ProjectFormData) => {
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

  const isCompleted = isEdit && project?.status === 'COMPLETED';

  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          <span className="font-medium">Back to Projects</span>
        </button>
        <h1 className="text-3xl font-bold text-gray-900">
          {isEdit ? 'Edit Project' : 'Create Project'}
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          {isEdit ? 'Update project details' : 'Create a new project to track time and billable hours'}
        </p>
        {isCompleted && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              This project is completed and cannot be edited.
            </p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="card">
          <div className="flex items-center space-x-2 mb-6">
            <FolderIcon className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Project Information</h2>
          </div>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Project Name *
              </label>
              <input
                {...register('name')}
                className="input-field"
                placeholder="e.g., Website Redesign"
                disabled={isCompleted}
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
                placeholder="Project description..."
                disabled={isCompleted}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Contact *
                </label>
                <ModernDropdown
                  options={[
                    { value: '', label: 'Select contact' },
                    ...(contacts?.map((c: any) => ({
                      value: c.id,
                      label: c.name,
                    })) || []),
                  ]}
                  value={watch('contactId') || ''}
                  onChange={(value) => setValue('contactId', value, { shouldValidate: true })}
                  placeholder="Select contact"
                  icon={<UserIcon className="w-5 h-5 text-gray-400" />}
                  name="contactId"
                  disabled={isCompleted}
                />
                {errors.contactId && (
                  <p className="mt-1 text-sm text-red-600">{errors.contactId.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Hourly Rate *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    {...register('hourlyRate', { valueAsNumber: true })}
                    className="input-field pl-8"
                    placeholder="0.00"
                    disabled={isCompleted}
                  />
                </div>
                {errors.hourlyRate && (
                  <p className="mt-1 text-sm text-red-600">{errors.hourlyRate.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Status
                </label>
                <ModernDropdown
                  options={[
                    { value: 'ACTIVE', label: 'Active' },
                    { value: 'COMPLETED', label: 'Completed' },
                    { value: 'ON_HOLD', label: 'On Hold' },
                    { value: 'CANCELLED', label: 'Cancelled' },
                  ]}
                  value={watch('status') || 'ACTIVE'}
                  onChange={(value) => setValue('status', value as 'ACTIVE' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED')}
                  placeholder="Select status"
                  name="status"
                  disabled={isCompleted}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Start Date
                </label>
                <div className="relative">
                  <CalendarIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  <input
                    type="date"
                    {...register('startDate')}
                    className="input-field pl-12"
                    disabled={isCompleted}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  End Date
                </label>
                <div className="relative">
                  <CalendarIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  <input
                    type="date"
                    {...register('endDate', {
                      validate: (value) => {
                        if (!value) return true; // Optional field
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const endDate = new Date(value);
                        return endDate > today || 'End date must be greater than today';
                      }
                    })}
                    min={new Date(Date.now() + 86400000).toISOString().split('T')[0]} // Tomorrow
                    className="input-field pl-12"
                    disabled={isCompleted}
                  />
                  {errors.endDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.endDate.message}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('addToDashboard')}
                  className="w-4 h-4 text-gray-900 bg-gray-100 border-gray-300 rounded focus:ring-gray-900 focus:ring-2"
                  disabled={isCompleted}
                />
                <span className="text-sm font-medium text-gray-700">
                  Add to Dashboard Watchlist
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/projects')}
            className="btn-secondary"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting || isCompleted}
          >
            {isSubmitting ? (
              <span className="flex items-center space-x-2">
                <LoadingSpinner size="sm" />
                <span>Saving...</span>
              </span>
            ) : (
              isEdit ? 'Update Project' : 'Create Project'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProjectForm;
