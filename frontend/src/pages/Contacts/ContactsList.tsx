import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import ConfirmModal from '../../components/ConfirmModal';
import ModernDropdown from '../../components/ModernDropdown';
import Pagination from '../../components/Pagination';
import {
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  UserGroupIcon,
  FunnelIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  type: string;
  receivables?: number;
  unusedCredits?: number;
  createdAt: string;
}

const ContactsList = () => {
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'single' | 'bulk'; id?: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading } = useQuery({
    queryKey: ['contacts', debouncedSearch, typeFilter, statusFilter, currentPage, itemsPerPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (typeFilter) params.append('type', typeFilter);
      if (statusFilter && statusFilter !== 'ALL') params.append('status', statusFilter);
      params.append('page', currentPage.toString());
      params.append('limit', itemsPerPage.toString());
      const res = await api.get(`/contacts?${params.toString()}`);
      return res.data.data;
    },
  });

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, typeFilter, statusFilter]);

  const getPageTitle = () => {
    switch (statusFilter) {
      case 'ACTIVE':
        return 'Active Customers';
      case 'INACTIVE':
        return 'Inactive Customers';
      case 'ALL':
        return 'All Customers';
      default:
        return 'Active Customers';
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      // Delete all contacts in parallel
      await Promise.all(ids.map((id) => api.delete(`/contacts/${id}`)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setSelectedContacts([]);
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
      deleteMutation.mutate(selectedContacts);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const currentPageIds = data?.contacts?.map((c: Contact) => c.id) || [];
      setSelectedContacts((prev) => [...new Set([...prev, ...currentPageIds])]);
    } else {
      const currentPageIds = data?.contacts?.map((c: Contact) => c.id) || [];
      setSelectedContacts((prev) => prev.filter((id) => !currentPageIds.includes(id)));
    }
  };

  const handleSelectContact = (contactId: string) => {
    setSelectedContacts((prev) =>
      prev.includes(contactId)
        ? prev.filter((id) => id !== contactId)
        : [...prev, contactId]
    );
  };

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return '₹0.00';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const currentPageIds = data?.contacts?.map((c: Contact) => c.id) || [];
  const allSelected = currentPageIds.length > 0 && currentPageIds.every((id: string) => selectedContacts.includes(id));
  const someSelected = currentPageIds.some((id: string) => selectedContacts.includes(id)) && !allSelected;

  const getDeleteMessage = () => {
    if (deleteTarget?.type === 'bulk') {
      return `Are you sure you want to delete ${selectedContacts.length} contact${selectedContacts.length > 1 ? 's' : ''}? This action cannot be undone.`;
    }
    return 'Are you sure you want to delete this contact? This action cannot be undone.';
  };

  return (
    <div className="space-y-6">
      {/* Header with Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-gray-900">
            {getPageTitle()}
          </h1>
          <ModernDropdown
            options={[
              { value: 'ACTIVE', label: 'Active Customers' },
              { value: 'INACTIVE', label: 'Inactive Customers' },
              { value: 'ALL', label: 'All Customers' },
            ]}
            value={statusFilter}
            onChange={(value) => setStatusFilter(value)}
            placeholder={getPageTitle()}
            className="w-auto min-w-[200px]"
          />
        </div>
        <button
          onClick={() => navigate('/contacts/new')}
          className="btn-primary inline-flex items-center gap-2"
        >
          <PlusIcon className="w-4 h-4" />
          <span>New</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="card">
        <div className="flex items-center gap-4">
          <div className="flex-[2] relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search in Customers (/)"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="input-field pl-10 w-full"
                />
          </div>
          <div className="flex-1">
            <ModernDropdown
              options={[
                { value: '', label: 'All Types' },
                { value: 'CUSTOMER', label: 'Customer' },
                { value: 'VENDOR', label: 'Vendor' },
              ]}
              value={typeFilter}
              onChange={(value) => setTypeFilter(value)}
              placeholder="All Types"
              icon={<FunnelIcon className="w-6 h-6 text-gray-400" />}
            />
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedContacts.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-900">
            {selectedContacts.length} contact{selectedContacts.length > 1 ? 's' : ''} selected
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
                  NAME
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  COMPANY NAME
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  EMAIL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  WORK PHONE
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                  RECEIVABLES (BCY)
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                  UNUSED CREDITS (BCY)
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white/50 backdrop-blur-sm divide-y divide-white/20">
              {data?.contacts?.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                        <UserGroupIcon className="h-6 w-6 text-gray-400" />
                      </div>
                      <h3 className="text-sm font-medium text-gray-900 mb-1">No contacts found</h3>
                      <p className="text-sm text-gray-500 mb-6">Get started by creating your first contact.</p>
                      <Link to="/contacts/new" className="btn-primary inline-flex items-center gap-2">
                        <PlusIcon className="w-5 h-5" />
                        <span>Add Contact</span>
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                data?.contacts?.map((contact: Contact) => (
                  <tr
                    key={contact.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/contacts/${contact.id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedContacts.includes(contact.id)}
                        onChange={() => handleSelectContact(contact.id)}
                        className="rounded border-gray-300 text-gray-900 focus:ring-gray-900 w-4 h-4 cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {contact.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{contact.company || <span className="text-gray-400">-</span>}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{contact.email || <span className="text-gray-400">-</span>}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{contact.phone || <span className="text-gray-400">-</span>}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(contact.receivables)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(contact.unusedCredits)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/contacts/${contact.id}/edit`}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                          title="Edit"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <PencilIcon className="w-5 h-5" />
                        </Link>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick('single', contact.id);
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

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Contact"
        message={getDeleteMessage()}
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonColor="red"
      />
    </div>
  );
};

export default ContactsList;
