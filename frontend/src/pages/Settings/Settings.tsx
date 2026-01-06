import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import ModernDropdown from '../../components/ModernDropdown';
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  GlobeAltIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';

const COUNTRIES = [
  { value: 'US', label: 'United States' },
  { value: 'IN', label: 'India' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'CA', label: 'Canada' },
  { value: 'AU', label: 'Australia' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'IT', label: 'Italy' },
  { value: 'ES', label: 'Spain' },
  { value: 'NL', label: 'Netherlands' },
  { value: 'BR', label: 'Brazil' },
  { value: 'MX', label: 'Mexico' },
  { value: 'JP', label: 'Japan' },
  { value: 'CN', label: 'China' },
  { value: 'KR', label: 'South Korea' },
  { value: 'SG', label: 'Singapore' },
  { value: 'AE', label: 'United Arab Emirates' },
  { value: 'SA', label: 'Saudi Arabia' },
  { value: 'ZA', label: 'South Africa' },
  { value: 'NZ', label: 'New Zealand' },
  { value: 'CH', label: 'Switzerland' },
  { value: 'SE', label: 'Sweden' },
  { value: 'NO', label: 'Norway' },
  { value: 'DK', label: 'Denmark' },
  { value: 'FI', label: 'Finland' },
];

const settingsSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name is too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name is too long'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters').max(20, 'Phone number is too long').regex(/^[\d\s\-\+\(\)]+$/, 'Phone number can only contain numbers, spaces, hyphens, parentheses, and plus sign'),
  country: z.string().min(1, 'Country is required'),
  zipCode: z.string().min(1, 'ZIP code is required').max(10, 'ZIP code is too long').regex(/^[A-Za-z0-9\s\-]+$/, 'ZIP code can only contain letters, numbers, spaces, and hyphens'),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SettingsFormData = z.infer<typeof settingsSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

const Settings = () => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [initialProfileValues, setInitialProfileValues] = useState<SettingsFormData | null>(null);

  const { data: userData, isLoading } = useQuery({
    queryKey: ['user', 'profile'],
    queryFn: async () => {
      const res = await api.get('/auth/me');
      return res.data.data;
    },
    enabled: true,
    refetchOnMount: true,
  });

  const {
    register: registerSettings,
    handleSubmit: handleSubmitSettings,
    formState: { errors: settingsErrors, isSubmitting: isSubmittingSettings },
    setValue: setSettingsValue,
    watch: watchSettings,
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      country: '',
      zipCode: '',
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors, isSubmitting: isSubmittingPassword },
    reset: resetPassword,
    watch: watchPassword,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    if (userData && !isLoading) {
      // If firstName/lastName are not set, try to split the name field
      let firstName = userData.firstName || '';
      let lastName = userData.lastName || '';
      
      if (!firstName && !lastName && userData.name) {
        const nameParts = userData.name.trim().split(' ');
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || '';
      }
      
      const initialValues: SettingsFormData = {
        firstName: firstName || '',
        lastName: lastName || '',
        email: userData.email || '',
        phone: userData.phone || '',
        country: userData.country || '',
        zipCode: userData.zipCode || '',
      };
      
      // Store initial values
      setInitialProfileValues(initialValues);
      
      // Set each field individually to ensure they update
      setSettingsValue('firstName', initialValues.firstName);
      setSettingsValue('lastName', initialValues.lastName);
      setSettingsValue('email', initialValues.email);
      setSettingsValue('phone', initialValues.phone);
      setSettingsValue('country', initialValues.country);
      setSettingsValue('zipCode', initialValues.zipCode);
    }
  }, [userData, isLoading, setSettingsValue]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: SettingsFormData) => {
      await api.put('/auth/profile', data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
      // Update initial values after successful save
      setInitialProfileValues(variables);
      showToast('Profile updated successfully', 'success');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Failed to update profile';
      showToast(message, 'error');
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      await api.put('/auth/password', data);
    },
    onSuccess: () => {
      resetPassword();
      showToast('Password updated successfully', 'success');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Failed to update password';
      showToast(message, 'error');
    },
  });

  // Watch all profile form fields
  const currentProfileValues = watchSettings();
  
  // Check if profile form has changes
  const hasProfileChanges = useMemo(() => {
    if (!initialProfileValues) return false;
    
    return (
      currentProfileValues.firstName !== initialProfileValues.firstName ||
      currentProfileValues.lastName !== initialProfileValues.lastName ||
      currentProfileValues.phone !== initialProfileValues.phone ||
      currentProfileValues.country !== initialProfileValues.country ||
      currentProfileValues.zipCode !== initialProfileValues.zipCode
    );
  }, [currentProfileValues, initialProfileValues]);

  // Watch password form fields
  const currentPassword = watchPassword('currentPassword') || '';
  const newPassword = watchPassword('newPassword') || '';
  const confirmPassword = watchPassword('confirmPassword') || '';
  
  // Check if password form has changes
  const hasPasswordChanges = useMemo(() => {
    return currentPassword.length > 0 || newPassword.length > 0 || confirmPassword.length > 0;
  }, [currentPassword, newPassword, confirmPassword]);

  const onSubmitSettings = (data: SettingsFormData) => {
    updateProfileMutation.mutate(data);
  };

  const onSubmitPassword = (data: PasswordFormData) => {
    updatePasswordMutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Profile Settings */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-6">
          <UserIcon className="w-5 h-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
        </div>
        <form onSubmit={handleSubmitSettings(onSubmitSettings)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                First Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...registerSettings('firstName')}
                  className={`input-field pl-10 ${settingsErrors.firstName ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                  placeholder="John"
                />
              </div>
              {settingsErrors.firstName && (
                <p className="mt-1 text-sm text-red-600">{settingsErrors.firstName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Last Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...registerSettings('lastName')}
                  className={`input-field pl-10 ${settingsErrors.lastName ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                  placeholder="Doe"
                />
              </div>
              {settingsErrors.lastName && (
                <p className="mt-1 text-sm text-red-600">{settingsErrors.lastName.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email Address *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <EnvelopeIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                {...registerSettings('email')}
                disabled
                className={`input-field pl-10 bg-gray-100 text-gray-500 cursor-not-allowed ${settingsErrors.email ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                placeholder="you@example.com"
              />
            </div>
            {settingsErrors.email && (
              <p className="mt-1 text-sm text-red-600">{settingsErrors.email.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Phone Number *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <PhoneIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="tel"
                {...registerSettings('phone', {
                  onChange: (e) => {
                    const value = e.target.value.replace(/[^0-9+\-() ]/g, '');
                    setSettingsValue('phone', value);
                  },
                })}
                className={`input-field pl-10 ${settingsErrors.phone ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            {settingsErrors.phone && (
              <p className="mt-1 text-sm text-red-600">{settingsErrors.phone.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Country *
              </label>
              <ModernDropdown
                options={[
                  { value: '', label: 'Select country' },
                  ...COUNTRIES,
                ]}
                value={watchSettings('country') || ''}
                onChange={(value) => setSettingsValue('country', value)}
                placeholder="Select country"
                icon={<GlobeAltIcon className="w-5 h-5 text-gray-400" />}
              />
              {settingsErrors.country && (
                <p className="mt-1 text-sm text-red-600">{settingsErrors.country.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ZIP / Postal Code *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPinIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...registerSettings('zipCode', {
                    onChange: (e) => {
                      const value = e.target.value.replace(/[^A-Za-z0-9\s\-]/g, '');
                      setSettingsValue('zipCode', value);
                    },
                  })}
                  className={`input-field pl-10 ${settingsErrors.zipCode ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                  placeholder="12345"
                />
              </div>
              {settingsErrors.zipCode && (
                <p className="mt-1 text-sm text-red-600">{settingsErrors.zipCode.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmittingSettings || !hasProfileChanges}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmittingSettings ? (
                <span className="flex items-center space-x-2">
                  <LoadingSpinner size="sm" />
                  <span>Saving...</span>
                </span>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Password Settings */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-6">
          <LockClosedIcon className="w-5 h-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
        </div>
        <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Current Password *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LockClosedIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                {...registerPassword('currentPassword')}
                className={`input-field pl-10 pr-10 ${passwordErrors.currentPassword ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                placeholder="Enter current password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? (
                  <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
            {passwordErrors.currentPassword && (
              <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              New Password *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LockClosedIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showNewPassword ? 'text' : 'password'}
                {...registerPassword('newPassword')}
                className={`input-field pl-10 pr-10 ${passwordErrors.newPassword ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                placeholder="Enter new password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? (
                  <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
            {passwordErrors.newPassword && (
              <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Confirm New Password *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LockClosedIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                {...registerPassword('confirmPassword')}
                className={`input-field pl-10 pr-10 ${passwordErrors.confirmPassword ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                placeholder="Confirm new password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
            {passwordErrors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword.message}</p>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmittingPassword || !hasPasswordChanges}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmittingPassword ? (
                <span className="flex items-center space-x-2">
                  <LoadingSpinner size="sm" />
                  <span>Updating...</span>
                </span>
              ) : (
                'Update Password'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;

