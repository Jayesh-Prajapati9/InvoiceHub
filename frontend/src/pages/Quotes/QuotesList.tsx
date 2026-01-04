import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import ModernDropdown from '../../components/ModernDropdown';
import { useToast } from '../../contexts/ToastContext';
import ConfirmModal from '../../components/ConfirmModal';
import Pagination from '../../components/Pagination';
import {
  MagnifyingGlassIcon,
  TrashIcon,
  DocumentTextIcon,
  FunnelIcon,
  PlusIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';

interface Quote {
  id: string;
  quoteNumber: string;
  contact: {
    name: string;
  };
  status: string;
  total: number;
  issueDate: string;
  expiryDate: string | null;
  createdAt: string;
}

const QuotesList = () => {
  const [statusFilter, setStatusFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedQuotes, setSelectedQuotes] = useState<string[]>([]);
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

  const getQuoteStatus = (quote: Quote) => {
    // Check if quote is expired
    if (quote.expiryDate) {
      const expiryDate = new Date(quote.expiryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      expiryDate.setHours(0, 0, 0, 0);
      
      if (expiryDate < today) {
        return 'EXPIRED';
      }
    }
    
    // Return the actual status if not expired
    return quote.status;
  };

  const getStatusColor = (status: string) => {
    if (status === 'INVOICED') {
      return 'badge-success';
    }
    if (status === 'EXPIRED') {
      return 'badge-danger';
    }
    switch (status) {
      case 'DRAFT':
        return 'badge-gray';
      case 'SENT':
        return 'badge-info';
      case 'ACCEPTED':
        return 'badge-success';
      case 'REJECTED':
        return 'badge-danger';
      default:
        return 'badge-gray';
    }
  };

  const { data, isLoading } = useQuery({
    queryKey: ['quotes', statusFilter, debouncedSearch, currentPage, itemsPerPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (debouncedSearch) params.append('search', debouncedSearch);
      params.append('page', currentPage.toString());
      params.append('limit', itemsPerPage.toString());
      const res = await api.get(`/quotes?${params.toString()}`);
      return res.data.data;
    },
  });

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, debouncedSearch]);

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => api.delete(`/quotes/${id}`)));
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      setSelectedQuotes([]);
      setDeleteModalOpen(false);
      setDeleteTarget(null);
      showToast(
        ids.length === 1 
          ? 'Quote deleted successfully' 
          : `${ids.length} quotes deleted successfully`,
        'success'
      );
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Failed to delete quote(s)';
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
      deleteMutation.mutate(selectedQuotes);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const currentPageIds = data?.quotes?.map((q: Quote) => q.id) || [];
      setSelectedQuotes((prev) => [...new Set([...prev, ...currentPageIds])]);
    } else {
      const currentPageIds = data?.quotes?.map((q: Quote) => q.id) || [];
      setSelectedQuotes((prev) => prev.filter((id) => !currentPageIds.includes(id)));
    }
  };

  const handleSelectQuote = (quoteId: string) => {
    setSelectedQuotes((prev) =>
      prev.includes(quoteId)
        ? prev.filter((id) => id !== quoteId)
        : [...prev, quoteId]
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const currentPageIds = data?.quotes?.map((q: Quote) => q.id) || [];
  const allSelected = currentPageIds.length > 0 && currentPageIds.every((id) => selectedQuotes.includes(id));
  const someSelected = currentPageIds.some((id) => selectedQuotes.includes(id)) && !allSelected;

  const getDeleteMessage = () => {
    if (deleteTarget?.type === 'bulk') {
      return `Are you sure you want to delete ${selectedQuotes.length} quote${selectedQuotes.length > 1 ? 's' : ''}? This action cannot be undone.`;
    }
    return 'Are you sure you want to delete this quote? This action cannot be undone.';
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quotes"
        description="Manage and track your quotes"
        action={{ label: 'Create Quote', to: '/quotes/new' }}
      />

      {/* Search and Filters */}
      <div className="card">
        <div className="flex items-center space-x-4">
          <div className="flex-[2] relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
            <input
              type="text"
              placeholder="Search by quote number or customer name..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="input-field pl-12 w-full"
            />
          </div>
          <div className="flex-1">
            <ModernDropdown
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'DRAFT', label: 'Draft' },
                { value: 'SENT', label: 'Sent' },
                { value: 'ACCEPTED', label: 'Accepted' },
                { value: 'REJECTED', label: 'Rejected' },
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
      {selectedQuotes.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-900">
            {selectedQuotes.length} quote{selectedQuotes.length > 1 ? 's' : ''} selected
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
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quote Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.quotes?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <DocumentTextIcon className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">No quotes found</h3>
                      <p className="text-sm text-gray-500 mb-6">Get started by creating your first quote.</p>
                      <Link to="/quotes/new" className="btn-primary inline-flex items-center gap-2">
                        <PlusIcon className="w-5 h-5" />
                        <span>Create Quote</span>
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                data?.quotes?.map((quote: Quote) => {
                  const displayStatus = getQuoteStatus(quote);
                  return (
                  <tr
                    key={quote.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/quotes/${quote.id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedQuotes.includes(quote.id)}
                        onChange={() => handleSelectQuote(quote.id)}
                        className="rounded border-gray-300 text-gray-900 focus:ring-gray-900 w-4 h-4 cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {new Date(quote.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {quote.quoteNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{quote.contact.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`badge ${getStatusColor(displayStatus)}`}>
                        {displayStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(Number(quote.total))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/quotes/${quote.id}/edit`}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                          title="Edit"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <PencilIcon className="w-5 h-5" />
                        </Link>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick('single', quote.id);
                          }}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Delete"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
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
          setDeleteTarget(null);
        }}
        onConfirm={handleConfirmDelete}
        title={deleteTarget?.type === 'bulk' ? 'Delete Quotes' : 'Delete Quote'}
        message={getDeleteMessage()}
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonColor="red"
      />
    </div>
  );
};

export default QuotesList;
