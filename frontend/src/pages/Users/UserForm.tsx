import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ArrowLeftIcon, ShieldCheckIcon, UserIcon } from '@heroicons/react/24/outline';

const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .optional()
    .or(z.literal('')),
  roleId: z.string().uuid('Please select a role'),
});

type UserFormData = z.infer<typeof userSchema>;

const UserForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await api.get('/users/roles');
      return res.data.data;
    },
  });

  const {
    data: user,
    isLoading: userLoading,
    error: userError,
  } = useQuery({
    queryKey: ['user', id],
    queryFn: async () => {
      const res = await api.get(`/users/${id}`);
      return res.data.data;
    },
    enabled: isEdit,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      roleId: '',
    },
  });

  // Set form values when user data loads
  useEffect(() => {
    if (isEdit && user) {
      setValue('name', user.name);
      setValue('email', user.email);
      if (user.roleId) {
        setValue('roleId', user.roleId);
      }
    }
  }, [user, isEdit, setValue]);

  const createMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      await api.post('/users', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      navigate('/users');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<UserFormData>) => {
      await api.put(`/users/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', id] });
      navigate('/users');
    },
  });

  const onSubmit = (data: UserFormData) => {
    if (isEdit) {
      // Remove password if empty for updates
      const { password, ...updateData } = data;
      const finalData = password ? data : updateData;
      updateMutation.mutate(finalData);
    } else {
      createMutation.mutate(data);
    }
  };

  const selectedRoleId = watch('roleId');
  const selectedRole = roles?.find((r: any) => r.id === selectedRoleId);

  if (rolesLoading || (isEdit && userLoading)) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isEdit && userError) {
    return (
      <div className="card">
        <div className="text-center py-12">
          <p className="text-red-600">Failed to load user. Please try again.</p>
          <Link to="/users" className="btn-secondary mt-4 inline-flex items-center">
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Users
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEdit ? 'Edit User' : 'Create New User'}
        description={
          isEdit
            ? 'Update user information and permissions'
            : 'Add a new user to your organization'
        }
      />

      <div className="card max-w-3xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Name Field */}
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              {...register('name')}
              className="input-field"
              placeholder="Enter full name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              {...register('email')}
              className="input-field"
              placeholder="user@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          {/* Password Field */}
          {!isEdit && (
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                type="password"
                {...register('password')}
                className="input-field"
                placeholder="Enter password (min. 6 characters)"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Password must be at least 6 characters long
              </p>
            </div>
          )}

          {isEdit && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Leave password field empty to keep the current password. To
                change the password, update it in the user's profile settings.
              </p>
            </div>
          )}

          {/* Role Field */}
          <div>
            <label htmlFor="roleId" className="block text-sm font-semibold text-gray-700 mb-2">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              id="roleId"
              {...register('roleId')}
              className="input-field appearance-none cursor-pointer"
            >
              <option value="">Select a role</option>
              {roles?.map((role: any) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
            {errors.roleId && (
              <p className="mt-1 text-sm text-red-600">{errors.roleId.message}</p>
            )}

            {/* Role Description */}
            {selectedRole && (
              <div
                className={`mt-3 p-4 rounded-lg border ${
                  selectedRole.name === 'ADMIN'
                    ? 'bg-purple-50 border-purple-200'
                    : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-start space-x-3">
                  {selectedRole.name === 'ADMIN' ? (
                    <ShieldCheckIcon className="w-5 h-5 text-purple-600 mt-0.5" />
                  ) : (
                    <UserIcon className="w-5 h-5 text-blue-600 mt-0.5" />
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">{selectedRole.name} Role</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedRole.name === 'ADMIN'
                        ? 'Full system access. Can manage users, all modules, and system settings.'
                        : 'Limited access. Can manage business data (contacts, invoices, quotes, etc.) but cannot manage users.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <Link
              to="/users"
              className="btn-secondary flex items-center space-x-2"
              type="button"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              <span>Cancel</span>
            </Link>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
            >
              {isSubmitting || createMutation.isPending || updateMutation.isPending ? (
                <span className="flex items-center space-x-2">
                  <LoadingSpinner size="sm" />
                  <span>{isEdit ? 'Updating...' : 'Creating...'}</span>
                </span>
              ) : (
                <span>{isEdit ? 'Update User' : 'Create User'}</span>
              )}
            </button>
          </div>

          {/* Error Messages */}
          {(createMutation.error || updateMutation.error) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                {createMutation.error || updateMutation.error
                  ? 'An error occurred. Please try again.'
                  : ''}
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default UserForm;
