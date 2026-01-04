import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { XMarkIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../LoadingSpinner';

const contactPersonSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  designation: z.string().optional(),
  isPrimary: z.boolean().optional().default(false),
});

type ContactPersonFormData = z.infer<typeof contactPersonSchema>;

interface ContactPersonFormProps {
  contactId: string;
  person?: any;
  onClose: () => void;
}

const ContactPersonForm = ({ contactId, person, onClose }: ContactPersonFormProps) => {
  const queryClient = useQueryClient();
  const isEdit = !!person;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactPersonFormData>({
    resolver: zodResolver(contactPersonSchema),
    defaultValues: person || {
      name: '',
      email: '',
      phone: '',
      mobile: '',
      designation: '',
      isPrimary: false,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ContactPersonFormData) => {
      await api.post(`/contacts/${contactId}/persons`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contactPersons', contactId] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ContactPersonFormData) => {
      await api.put(`/contacts/${contactId}/persons/${person.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contactPersons', contactId] });
      onClose();
    },
  });

  const onSubmit = (data: ContactPersonFormData) => {
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-gray-900">
          {isEdit ? 'Edit Contact Person' : 'Add Contact Person'}
        </h4>
        <button
          onClick={onClose}
          className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
          <input
            {...register('name')}
            className="input-field text-sm"
            placeholder="Enter name"
          />
          {errors.name && (
            <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              {...register('email')}
              className="input-field text-sm"
              placeholder="email@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
            <input
              {...register('phone')}
              className="input-field text-sm"
              placeholder="Phone number"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Mobile</label>
            <input
              {...register('mobile')}
              className="input-field text-sm"
              placeholder="Mobile number"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Designation</label>
            <input
              {...register('designation')}
              className="input-field text-sm"
              placeholder="Designation"
            />
          </div>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            {...register('isPrimary')}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <label className="ml-2 text-xs text-gray-700">Set as primary contact person</label>
        </div>

        <div className="flex items-center justify-end space-x-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary text-sm"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary text-sm"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center space-x-2">
                <LoadingSpinner size="sm" />
                <span>Saving...</span>
              </span>
            ) : (
              isEdit ? 'Update' : 'Add'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ContactPersonForm;

