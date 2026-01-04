import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

interface QuotesSidebarProps {
  currentQuoteId?: string;
  statusFilter?: string;
}

const QuotesSidebar = ({ currentQuoteId, statusFilter }: QuotesSidebarProps) => {
  const { data } = useQuery({
    queryKey: ['quotes', 'sidebar', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      params.append('limit', '50');
      const res = await api.get(`/quotes?${params.toString()}`);
      return res.data.data;
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col overflow-hidden h-full">
      <div className="border-b border-gray-200 flex-shrink-0 px-6 py-2.5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-900">All Quotes</h2>
          <Link
            to="/quotes/new"
            className="p-1 text-primary-600 hover:text-primary-900 hover:bg-primary-50 rounded transition-colors"
          >
            <span className="text-lg font-bold">+</span>
          </Link>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="py-2">
        {data?.quotes?.map((quote: any) => (
          <Link
            key={quote.id}
            to={`/quotes/${quote.id}`}
            className={`flex items-start space-x-3 px-6 py-3 rounded-lg mb-1 transition-colors ${
              currentQuoteId === quote.id
                ? 'bg-primary-50 border border-primary-200'
                : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-8 h-8 bg-purple-50 rounded flex items-center justify-center">
                <DocumentTextIcon className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {quote.contact?.name || 'Unknown Contact'}
              </p>
              <p className="text-xs text-gray-600 mt-0.5">{quote.quoteNumber}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {quote.issueDate ? format(new Date(quote.issueDate), 'dd/MM/yyyy') : 'N/A'}
              </p>
              <p className="text-xs font-medium text-gray-700 mt-1">
                {formatCurrency(Number(quote.total))}
              </p>
              <span
                className={`inline-block mt-1 px-2 py-0.5 text-xs font-semibold rounded ${
                  quote.status === 'DRAFT'
                    ? 'bg-gray-100 text-gray-800'
                    : quote.status === 'SENT'
                    ? 'bg-blue-100 text-blue-800'
                    : quote.status === 'ACCEPTED'
                    ? 'bg-green-100 text-green-800'
                    : quote.status === 'REJECTED'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {quote.status}
              </span>
            </div>
          </Link>
        ))}
        </div>
      </div>
    </div>
  );
};

export default QuotesSidebar;

