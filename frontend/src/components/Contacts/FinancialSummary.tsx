import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import IncomeExpenseChart from './IncomeExpenseChart';

interface FinancialSummaryProps {
  contactId: string;
}

const FinancialSummary = ({ contactId }: FinancialSummaryProps) => {
  const { data: summary, isLoading } = useQuery({
    queryKey: ['contactFinancialSummary', contactId],
    queryFn: async () => {
      const res = await api.get(`/contacts/${contactId}/financial-summary`);
      return res.data.data;
    },
  });

  if (isLoading) {
    return <LoadingSpinner size="md" />;
  }

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return '₹0.00';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: summary?.currency || 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Payment Due Period */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Payment due period</h3>
        <p className="text-sm text-gray-900">{summary?.paymentTerms || 'Due on Receipt'}</p>
      </div>

      {/* Potential Income */}
      {summary?.quoteStatistics && summary.quoteStatistics.potentialIncome > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Potential Income</h3>
          <p className="text-xl font-bold text-blue-600">
            {formatCurrency(Number(summary.quoteStatistics.potentialIncome))}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            From quotes that can be converted to invoices
          </p>
        </div>
      )}

      {/* Receivables */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Receivables</h3>
        <div className="space-y-2">
          <div>
            <p className="text-xs text-gray-500 mb-1">Currency</p>
            <p className="text-sm font-medium text-gray-900">
              {summary?.currency || 'INR'} - {summary?.currency === 'INR' ? 'Indian Rupee' : 'US Dollar'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Outstanding Receivables</p>
            <p className="text-lg font-bold text-gray-900">
              {formatCurrency(Number(summary?.outstandingReceivables || 0))}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Unused Credits</p>
            <p className="text-lg font-bold text-gray-900">
              {formatCurrency(Number(summary?.unusedCredits || 0))}
            </p>
          </div>
        </div>
      </div>

      {/* Quotes Section */}
      {summary?.quoteStatistics && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Quotes</h3>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-gray-500 mb-1">Total Quotes Value</p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(Number(summary.quoteStatistics.totalValue || 0))}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Total Quotes</p>
              <p className="text-sm font-medium text-gray-900">
                {summary.quoteStatistics.totalCount || 0}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Pending Quotes</p>
              <p className="text-sm font-medium text-gray-900">
                {summary.quoteStatistics.pendingCount || 0}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Income and Expense Chart */}
      <div>
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Income and Expense</h3>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          This chart is displayed in the organization's base currency.
        </p>
        <IncomeExpenseChart contactId={contactId} months={4} />
        <p className="text-xs text-gray-600 mt-3">
          Total Income (Last 4 Months) - {formatCurrency(Number(summary?.totalIncome || 0))}
        </p>
      </div>
    </div>
  );
};

export default FinancialSummary;

