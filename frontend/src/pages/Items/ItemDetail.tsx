import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  XMarkIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import ItemOverview from '../../components/Items/ItemOverview';
import ItemsSidebar from '../../components/Items/ItemsSidebar';
import ItemTransactions from '../../components/Items/ItemTransactions';
import ItemHistory from '../../components/Items/ItemHistory';

const ItemDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: item, isLoading } = useQuery({
    queryKey: ['item', id],
    queryFn: async () => {
      const res = await api.get(`/items/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Item not found</p>
          <Link to="/items" className="btn-primary">
            Back to Items
          </Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'transactions', label: 'Transactions' },
    { id: 'history', label: 'History' },
  ];

  return (
    <div className="flex bg-gray-50 -m-6 lg:-m-8 h-screen">
      {/* Left Sidebar - Items List */}
      <div className="flex-shrink-0 h-full">
        <ItemsSidebar currentItemId={id} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden h-full">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0 sticky top-0 z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/items')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-gray-600" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">{item.name}</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Link
                to={`/items/${id}/edit`}
                className="btn-secondary flex items-center space-x-2"
              >
                <PencilIcon className="w-4 h-4" />
                <span>Edit</span>
              </Link>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {activeTab === 'overview' && <ItemOverview itemId={id!} />}
            {activeTab === 'transactions' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Transactions</h2>
                <ItemTransactions itemId={id!} />
              </div>
            )}
            {activeTab === 'history' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">History</h2>
                <ItemHistory itemId={id!} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemDetail;

