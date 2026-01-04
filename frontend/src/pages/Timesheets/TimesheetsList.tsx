import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import ModernDropdown from '../../components/ModernDropdown';
import ConfirmModal from '../../components/ConfirmModal';
import Pagination from '../../components/Pagination';
import {
  ClockIcon,
  FunnelIcon,
  PlusIcon,
  TrashIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

interface Timesheet {
  id: string;
  project: { name: string };
  date: string;
  hours: number;
  billable: boolean;
  description: string | null;
  userId?: string | null;
  customUserName?: string | null;
  user?: { name: string; email?: string } | null;
  contact?: { name: string; email?: string } | null;
}

const TimesheetsList = () => {
  const [projectFilter, setProjectFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const queryClient = useQueryClient();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await api.get('/projects');
      return res.data.data.projects;
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['timesheets', projectFilter, debouncedSearch, currentPage, itemsPerPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (projectFilter) params.append('projectId', projectFilter);
      if (debouncedSearch) params.append('search', debouncedSearch);
      params.append('page', currentPage.toString());
      params.append('limit', itemsPerPage.toString());
      const res = await api.get(`/timesheets?${params.toString()}`);
      return res.data.data;
    },
  });

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [projectFilter, debouncedSearch]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/timesheets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
    },
  });

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
        title="Timesheets"
        description="Track time spent on projects"
        action={{ label: 'Log Time', to: '/timesheets/new' }}
      />

      {/* Search and Filters */}
      <div className="card">
        <div className="flex items-center space-x-4">
          <div className="flex-[2] relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by project name, user name, or description..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="input-field pl-12 w-full"
            />
          </div>
          <div className="flex-1">
            <ModernDropdown
              options={[
                { value: '', label: 'All Projects' },
                ...(projects?.map((p: any) => ({ value: p.id, label: p.name })) || []),
              ]}
              value={projectFilter}
              onChange={(value) => setProjectFilter(value)}
              placeholder="All Projects"
              icon={<FunnelIcon className="w-5 h-5 text-gray-400" />}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Hours
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Billable
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.timesheets?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <ClockIcon className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">No timesheets found</h3>
                      <p className="text-sm text-gray-500 mb-6">Get started by logging your first time entry.</p>
                      <Link to="/timesheets/new" className="btn-primary inline-flex items-center space-x-2">
                        <PlusIcon className="w-5 h-5" />
                        <span>Log Time</span>
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                data?.timesheets?.map((timesheet: Timesheet) => {
                  // Get user name: prioritize customUserName, then contact, then user
                  // If customUserName exists, use it; otherwise use contact or user name
                  let userName = 'Unknown User';
                  let userEmail: string | undefined;
                  
                  if (timesheet.customUserName && timesheet.customUserName.trim()) {
                    // Custom user name takes priority
                    userName = timesheet.customUserName;
                  } else if (timesheet.contact?.name) {
                    // Use contact name if available
                    userName = timesheet.contact.name;
                    userEmail = timesheet.contact.email;
                  } else if (timesheet.user?.name) {
                    // Use user name if available
                    userName = timesheet.user.name;
                    userEmail = timesheet.user.email;
                  }
                  
                  return (
                  <tr key={timesheet.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">{timesheet.project.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{userName}</div>
                        {userEmail && (
                          <div className="text-sm text-gray-500">{userEmail}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {new Date(timesheet.date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">{timesheet.hours} hrs</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {timesheet.billable ? (
                        <span className="badge badge-success inline-flex items-center">
                          <CheckCircleIcon className="w-4 h-4 mr-1" />
                          Billable
                        </span>
                      ) : (
                        <span className="badge badge-gray">Non-billable</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 max-w-xs truncate">
                        {timesheet.description || <span className="text-gray-400">-</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          setPendingDeleteId(timesheet.id);
                          setDeleteModalOpen(true);
                        }}
                        className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                  );
                })
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

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setPendingDeleteId(null);
        }}
        onConfirm={() => {
          if (pendingDeleteId) {
            deleteMutation.mutate(pendingDeleteId);
          }
          setDeleteModalOpen(false);
          setPendingDeleteId(null);
        }}
        title="Delete Timesheet Entry"
        message="Are you sure you want to delete this timesheet entry? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonColor="red"
      />
    </div>
  );
};

export default TimesheetsList;
