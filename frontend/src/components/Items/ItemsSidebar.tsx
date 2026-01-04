import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import { PlusIcon, CubeIcon } from '@heroicons/react/24/outline';

interface ItemsSidebarProps {
  currentItemId?: string;
}

const ItemsSidebar = ({ currentItemId }: ItemsSidebarProps) => {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['items'],
    queryFn: async () => {
      const res = await api.get('/items?limit=100');
      return res.data.data;
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

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col overflow-hidden h-full">
      {/* Header */}
      <div className="border-b border-gray-200 flex-shrink-0 px-6 py-2.5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-900">Active Items</h2>
          <button
            onClick={() => navigate('/items/new')}
            className="p-1.5 text-primary-600 hover:text-primary-900 hover:bg-primary-50 rounded-lg transition-colors"
            title="Add Item"
          >
            <PlusIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-y-auto">
        {data?.items?.length === 0 ? (
          <div className="px-6 py-4 text-center text-sm text-gray-500">
            No items found
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {data?.items?.map((item: any) => (
              <Link
                key={item.id}
                to={`/items/${item.id}`}
                className={`block px-6 py-4 hover:bg-gray-50 transition-colors ${
                  currentItemId === item.id ? 'bg-primary-50 border-l-4 border-primary-600' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <CubeIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.name}
                      </p>
                    </div>
                  </div>
                  <div className="ml-2 flex-shrink-0">
                    <p className="text-sm font-medium text-gray-600">
                      {formatCurrency(Number(item.rate))}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemsSidebar;

