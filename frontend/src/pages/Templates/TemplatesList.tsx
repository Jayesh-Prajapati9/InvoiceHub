import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import ConfirmModal from '../../components/ConfirmModal';
import Pagination from '../../components/Pagination';
import PageHeader from '../../components/PageHeader';
import LoadingSpinner from '../../components/LoadingSpinner';

interface Template {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
}

const TemplatesList = () => {
  const queryClient = useQueryClient();
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'single' | 'bulk'; id?: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const { data, isLoading } = useQuery({
    queryKey: ['templates', currentPage, itemsPerPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', itemsPerPage.toString());
      const res = await api.get(`/templates?${params.toString()}`);
      return res.data.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => api.delete(`/templates/${id}`)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setSelectedTemplates([]);
      setDeleteModalOpen(false);
      setDeleteTarget(null);
    },
  });

  const handleDeleteClick = (type: 'single' | 'bulk', id?: string) => {
    setDeleteTarget({ type, id });
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === 'single' && deleteTarget.id) {
      deleteMutation.mutate([deleteTarget.id]);
    } else if (deleteTarget.type === 'bulk') {
      deleteMutation.mutate(selectedTemplates);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      // Only select non-default templates on current page
      const currentPageTemplates = data?.templates || [];
      const currentPageIds = currentPageTemplates.filter((t: Template) => !t.isDefault).map((t: Template) => t.id);
      setSelectedTemplates((prev) => [...new Set([...prev, ...currentPageIds])]);
    } else {
      // Only deselect current page templates
      const currentPageTemplates = data?.templates || [];
      const currentPageIds = currentPageTemplates.filter((t: Template) => !t.isDefault).map((t: Template) => t.id);
      setSelectedTemplates((prev) => prev.filter((id) => !currentPageIds.includes(id)));
    }
  };

  const handleSelectTemplate = (templateId: string, isDefault: boolean) => {
    if (isDefault) return; // Don't allow selecting default template
    setSelectedTemplates((prev) =>
      prev.includes(templateId)
        ? prev.filter((id) => id !== templateId)
        : [...prev, templateId]
    );
  };

  const currentPageTemplates = data?.templates || [];
  const currentPageNonDefaultIds = currentPageTemplates.filter((t: Template) => !t.isDefault).map((t: Template) => t.id);
  const allSelected = currentPageNonDefaultIds.length > 0 && currentPageNonDefaultIds.every((id: string) => selectedTemplates.includes(id));
  const someSelected = currentPageNonDefaultIds.some((id: string) => selectedTemplates.includes(id)) && !allSelected;

  const getDeleteMessage = () => {
    if (deleteTarget?.type === 'bulk') {
      return `Are you sure you want to delete ${selectedTemplates.length} template${selectedTemplates.length > 1 ? 's' : ''}? This action cannot be undone.`;
    }
    return 'Are you sure you want to delete this template? This action cannot be undone.';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Templates"
        description="Manage your invoice templates"
        action={{ label: 'Create Template', to: '/templates/new' }}
      />

      {/* Bulk Actions Bar */}
      {selectedTemplates.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-900">
            {selectedTemplates.length} template{selectedTemplates.length > 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleDeleteClick('bulk')}
              className="text-sm text-red-700 hover:text-red-900 font-medium"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = someSelected;
                  }}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Default</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data?.templates?.map((template: Template) => (
              <tr key={template.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {!template.isDefault && (
                    <input
                      type="checkbox"
                      checked={selectedTemplates.includes(template.id)}
                      onChange={() => handleSelectTemplate(template.id, template.isDefault)}
                      className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                    />
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{template.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{template.description || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {template.isDefault && <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Default</span>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <Link to={`/templates/${template.id}`} className="text-gray-700 hover:text-gray-900 mr-4 font-medium">
                    Edit
                  </Link>
                  {!template.isDefault && (
                    <button
                      onClick={() => handleDeleteClick('single', template.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data?.pagination && (
          <Pagination
            currentPage={data.pagination.page}
            totalPages={data.pagination.pages}
            totalItems={data.pagination.total}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        )}
      </div>

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title={deleteTarget?.type === 'bulk' ? 'Delete Selected Templates' : 'Delete Template'}
        message={getDeleteMessage()}
        confirmText="Delete"
        confirmButtonColor="red"
      />
    </div>
  );
};

export default TemplatesList;

