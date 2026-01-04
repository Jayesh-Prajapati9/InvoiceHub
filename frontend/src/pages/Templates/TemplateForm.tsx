import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';

const templateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  isDefault: z.boolean().default(false),
});

type TemplateFormData = z.infer<typeof templateSchema>;

const TemplateForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const { data: template } = useQuery({
    queryKey: ['template', id],
    queryFn: async () => {
      const res = await api.get(`/templates/${id}`);
      return res.data.data;
    },
    enabled: isEdit,
  });

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: { isDefault: false, content: '<div>Invoice Template</div>' },
  });

  // Populate form when editing and template data is loaded
  useEffect(() => {
    if (isEdit && template) {
      setValue('name', template.name || '');
      setValue('description', template.description || '');
      setValue('content', template.content || '<div>Invoice Template</div>');
      setValue('isDefault', template.isDefault || false);
    }
  }, [isEdit, template, setValue]);

  const createMutation = useMutation({
    mutationFn: async (data: TemplateFormData) => {
      await api.post('/templates', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      navigate('/templates');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: TemplateFormData) => {
      await api.put(`/templates/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      navigate('/templates');
    },
  });

  const onSubmit = (data: TemplateFormData) => {
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">{isEdit ? 'Edit Template' : 'Create Template'}</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white shadow rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
          <input {...register('name')} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <input {...register('description')} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">HTML Content *</label>
          <textarea {...register('content')} rows={15} className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm" />
          {errors.content && <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>}
        </div>
        <div>
          <label className="flex items-center">
            <input type="checkbox" {...register('isDefault')} className="mr-2" />
            <span className="text-sm text-gray-700">Set as default template</span>
          </label>
        </div>
        <div className="flex gap-4">
          <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
            {isEdit ? 'Update' : 'Create'}
          </button>
          <button type="button" onClick={() => navigate('/templates')} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default TemplateForm;

