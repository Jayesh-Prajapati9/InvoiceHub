import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import ModernDropdown from '../../components/ModernDropdown';
import ConfirmModal from '../../components/ConfirmModal';
import { useToast } from '../../contexts/ToastContext';
import Pagination from '../../components/Pagination';
import {
  FolderIcon,
  FunnelIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

interface Project {
  id: string;
  name: string;
  contact: { name: string };
  hourlyRate: number;
  status: string;
  createdAt: string;
}

const ProjectsList = () => {
  const [statusFilter, setStatusFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'single' | 'bulk'; id?: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const { data, isLoading } = useQuery({
    queryKey: ['projects', statusFilter, debouncedSearch, currentPage, itemsPerPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (debouncedSearch) params.append('search', debouncedSearch);
      params.append('page', currentPage.toString());
      params.append('limit', itemsPerPage.toString());
      const res = await api.get(`/projects?${params.toString()}`);
      return res.data.data;
    },
  });

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, debouncedSearch]);

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => api.delete(`/projects/${id}`)));
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setSelectedProjects([]);
      setDeleteModalOpen(false);
      setDeleteTarget(null);
      showToast(
        ids.length === 1 
          ? 'Project deleted successfully' 
          : `${ids.length} projects deleted successfully`,
        'success'
      );
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Failed to delete project(s)';
      showToast(message, 'error');
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
      deleteMutation.mutate(selectedProjects);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const currentPageIds = data?.projects?.map((proj: Project) => proj.id) || [];
      setSelectedProjects((prev) => [...new Set([...prev, ...currentPageIds])]);
    } else {
      const currentPageIds = data?.projects?.map((proj: Project) => proj.id) || [];
      setSelectedProjects((prev) => prev.filter((id) => !currentPageIds.includes(id)));
    }
  };

  const handleSelectProject = (projectId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setSelectedProjects((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    );
  };

  const handleRowClick = (projectId: string) => {
    navigate(`/projects/${projectId}`);
  };

  const currentPageIds = data?.projects?.map((proj: Project) => proj.id) || [];
  const allSelected = currentPageIds.length > 0 && currentPageIds.every((id: string) => selectedProjects.includes(id));
  const someSelected = currentPageIds.some((id: string) => selectedProjects.includes(id)) && !allSelected;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'badge-success';
      case 'COMPLETED':
        return 'badge-info';
      case 'ON_HOLD':
        return 'badge-warning';
      case 'CANCELLED':
        return 'badge-danger';
      default:
        return 'badge-gray';
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
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Manage your projects and track progress"
        action={{ label: 'Create Project', to: '/projects/new' }}
      />

      {/* Search and Filters */}
      <div className="card">
        <div className="flex items-center space-x-4">
          <div className="flex-[2] relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
            <input
              type="text"
              placeholder="Search by project name or customer name..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="input-field pl-12 w-full"
            />
          </div>
          <div className="flex-1">
            <ModernDropdown
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'ACTIVE', label: 'Active' },
                { value: 'COMPLETED', label: 'Completed' },
                { value: 'ON_HOLD', label: 'On Hold' },
                { value: 'CANCELLED', label: 'Cancelled' },
              ]}
              value={statusFilter}
              onChange={(value) => setStatusFilter(value)}
              placeholder="All Statuses"
              icon={<FunnelIcon className="w-6 h-6 text-gray-400" />}
            />
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedProjects.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-900">
            {selectedProjects.length} project{selectedProjects.length > 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDeleteClick('bulk')}
              className="text-sm text-red-600 hover:text-red-700 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="table-container">
        <div className="overflow-x-auto">
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
                    className="rounded border-gray-300 text-gray-900 focus:ring-gray-900 w-4 h-4 cursor-pointer"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hourly Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.projects?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <FolderIcon className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">No projects found</h3>
                      <p className="text-sm text-gray-500 mb-6">Get started by creating your first project.</p>
                      <Link to="/projects/new" className="btn-primary inline-flex items-center gap-2">
                        <PlusIcon className="w-5 h-5" />
                        <span>Create Project</span>
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                data?.projects?.map((project: Project) => (
                  <tr 
                    key={project.id} 
                    onClick={() => handleRowClick(project.id)}
                    className="hover:bg-gray-50 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedProjects.includes(project.id)}
                        onChange={() => handleSelectProject(project.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded border-gray-300 text-gray-900 focus:ring-gray-900 w-4 h-4 cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 p-2 bg-gray-100 rounded-lg">
                          <FolderIcon className="w-6 h-6 text-gray-600" />
                        </div>
                        <div className="text-sm font-medium text-gray-900">{project.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{project.contact.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(Number(project.hourlyRate))}/hr
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`badge ${getStatusColor(project.status)}`}>
                        {project.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/projects/${project.id}/edit`}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                          title="Edit"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <PencilIcon className="w-5 h-5" />
                        </Link>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick('single', project.id);
                          }}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Delete"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
        onClose={() => {
          setDeleteModalOpen(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleConfirmDelete}
        title={deleteTarget?.type === 'bulk' ? 'Delete Projects' : 'Delete Project'}
        message={
          deleteTarget?.type === 'bulk'
            ? `Are you sure you want to delete ${selectedProjects.length} project${selectedProjects.length > 1 ? 's' : ''}? This action cannot be undone.`
            : 'Are you sure you want to delete this project? This action cannot be undone.'
        }
        confirmText="Delete"
        confirmButtonColor="red"
      />
    </div>
  );
};

export default ProjectsList;
