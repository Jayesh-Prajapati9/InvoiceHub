import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import { CubeIcon } from '@heroicons/react/24/outline';

interface ItemOverviewProps {
  itemId: string;
}

const ItemOverview = ({ itemId }: ItemOverviewProps) => {
  const { data: item, isLoading } = useQuery({
    queryKey: ['item', itemId],
    queryFn: async () => {
      const res = await api.get(`/items/${itemId}`);
      return res.data.data;
    },
  });

  if (isLoading) {
    return <LoadingSpinner size="lg" />;
  }

  if (!item) {
    return <div>Item not found</div>;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getItemTypeLabel = (type: string) => {
    switch (type) {
      case 'SALES':
        return 'Sales Items';
      case 'PURCHASE':
        return 'Purchase Items';
      case 'SERVICE':
        return 'Service Items';
      default:
        return 'Sales Items';
    }
  };

  return (
    <div className="space-y-6">
      {/* Item Card */}
      <div className="card bg-gray-50 border border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
              <CubeIcon className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
              <div className="mt-2 space-y-1 text-sm text-gray-600">
                <p>
                  <span className="font-medium">Rate:</span> {formatCurrency(Number(item.rate))}
                </p>
                <p>
                  <span className="font-medium">Unit:</span> {item.unit}
                </p>
                {item.taxRate > 0 && (
                  <p>
                    <span className="font-medium">Tax Rate:</span> {Number(item.taxRate).toFixed(2)}%
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Other Details */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Other Details</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Item Type:</span>
            <span className="ml-2 font-medium text-gray-900">
              {getItemTypeLabel(item.itemType || 'SALES')}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Unit:</span>
            <span className="ml-2 font-medium text-gray-900">{item.unit}</span>
          </div>
          <div>
            <span className="text-gray-600">Created By:</span>
            <span className="ml-2 font-medium text-gray-900">{item.creatorName || 'Unknown'}</span>
          </div>
        </div>
      </div>

      {/* Sales Information */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Sales Information</h3>
        <div className="space-y-3">
          <div>
            <span className="text-sm text-gray-600">Selling Price:</span>
            <p className="text-lg font-bold text-gray-900 mt-1">
              {formatCurrency(Number(item.rate))}
            </p>
          </div>
          {item.description && (
            <div>
              <span className="text-sm text-gray-600">Description:</span>
              <p className="text-sm text-gray-900 mt-1">{item.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Statistics */}
      {(item.quoteItemsCount > 0 || item.invoiceItemsCount > 0) && (
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Usage Statistics</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Used in Quotes:</span>
              <p className="text-lg font-bold text-gray-900 mt-1">{item.quoteItemsCount || 0}</p>
            </div>
            <div>
              <span className="text-gray-600">Used in Invoices:</span>
              <p className="text-lg font-bold text-gray-900 mt-1">{item.invoiceItemsCount || 0}</p>
            </div>
            <div>
              <span className="text-gray-600">Total Quantity Sold:</span>
              <p className="text-lg font-bold text-gray-900 mt-1">
                {item.totalQuantitySold || 0}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemOverview;

