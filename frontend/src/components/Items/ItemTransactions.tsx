import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import ModernDropdown from '../ModernDropdown';
import { format } from 'date-fns';

interface ItemTransactionsProps {
  itemId: string;
}

const ItemTransactions = ({ itemId }: ItemTransactionsProps) => {
  const [typeFilter, setTypeFilter] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['itemTransactions', itemId, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (typeFilter !== 'all') {
        params.append('type', typeFilter);
      }
      const res = await api.get(`/items/${itemId}/transactions?${params.toString()}`);
      return res.data.data;
    },
  });

  if (isLoading) {
    return <LoadingSpinner size="md" />;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: string | Date) => {
    return format(new Date(date), 'dd/MM/yyyy');
  };

  const getStatusBadge = (status: string) => {
    const statusClass =
      status === 'PAID' || status === 'ACCEPTED'
        ? 'bg-green-100 text-green-800'
        : status === 'OVERDUE' || status === 'REJECTED'
        ? 'bg-red-100 text-red-800'
        : status === 'SENT'
        ? 'bg-blue-100 text-blue-800'
        : 'bg-gray-100 text-gray-800';

    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusClass}`}>
        {status}
      </span>
    );
  };

  const filteredTransactions = data || [];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Filter By:</label>
          <div className="w-48">
            <ModernDropdown
              options={[
                { value: 'all', label: 'All' },
                { value: 'quotes', label: 'Quotes' },
                { value: 'invoices', label: 'Invoices' },
              ]}
              value={typeFilter}
              onChange={(value) => setTypeFilter(value)}
              placeholder="Select type"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      {filteredTransactions.length === 0 ? (
        <div className="card">
          <p className="text-gray-600 text-center py-8">No transactions found.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    DATE
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    {typeFilter === 'quotes' ? 'QUOTE NUMBER' : typeFilter === 'invoices' ? 'INVOICE NUMBER' : 'DOCUMENT NUMBER'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    CUSTOMER NAME
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    QUANTITY SOLD
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    PRICE
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    TOTAL
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    STATUS
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.map((transaction: any) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">
                        {formatDate(transaction.date)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        to={`/${transaction.type === 'invoice' ? 'invoices' : 'quotes'}/${transaction.type === 'invoice' ? transaction.invoiceId : transaction.quoteId}`}
                        className="text-sm text-primary-600 hover:text-primary-900 font-medium"
                      >
                        {transaction.documentNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{transaction.customerName}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-sm font-medium text-gray-900">
                        {transaction.quantity.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(transaction.price)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(transaction.total)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(transaction.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemTransactions;

