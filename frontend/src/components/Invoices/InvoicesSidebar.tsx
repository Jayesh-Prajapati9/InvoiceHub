import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import { PlusIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

interface InvoicesSidebarProps {
  currentInvoiceId?: string;
  statusFilter?: string;
}

const InvoicesSidebar = ({ currentInvoiceId, statusFilter }: InvoicesSidebarProps) => {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter) {
        params.append('status', statusFilter);
      }
      params.append('limit', '100');
      const res = await api.get(`/invoices?${params.toString()}`);
      return res.data.data.invoices || [];
    },
  });

  if (isLoading) {
    return (
      <div className="w-80 bg-white border-r border-gray-200 flex items-center justify-center h-full">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-700';
      case 'SENT':
        return 'bg-blue-100 text-blue-700';
      case 'PAID':
        return 'bg-green-100 text-green-700';
      case 'OVERDUE':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col overflow-hidden h-full">
      {/* Header */}
      <div className="border-b border-gray-200 flex-shrink-0 px-6 py-2.5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-900">Invoices</h2>
          <button
            onClick={() => navigate('/invoices/new')}
            className="p-1.5 text-primary-600 hover:text-primary-900 hover:bg-primary-50 rounded-lg transition-colors"
            title="Create Invoice"
          >
            <PlusIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Invoices List */}
      <div className="flex-1 overflow-y-auto">
        {!data || data.length === 0 ? (
          <div className="px-6 py-4 text-center text-sm text-gray-500">
            No invoices found
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {data.map((invoice: any) => {
              const isActive = currentInvoiceId === invoice.id;
              return (
                <button
                  key={invoice.id}
                  onClick={() => navigate(`/invoices/${invoice.id}`)}
                  className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                    isActive ? 'bg-primary-50 border-l-4 border-primary-600' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className={`text-sm font-medium ${isActive ? 'text-primary-900' : 'text-gray-900'}`}>
                      {invoice.invoiceNumber}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 mb-1">
                    {invoice.contact?.name || 'No contact'}
                  </div>
                  <div className="text-xs font-semibold text-gray-900">
                    {formatCurrency(Number(invoice.total))}
                  </div>
                  {invoice.issueDate && (
                    <div className="text-xs text-gray-500 mt-1">
                      {format(new Date(invoice.issueDate), 'MMM dd, yyyy')}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoicesSidebar;

