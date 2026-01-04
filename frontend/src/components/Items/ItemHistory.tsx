import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { format } from 'date-fns';
import LoadingSpinner from '../LoadingSpinner';

interface ItemHistoryProps {
  itemId: string;
}

const ItemHistory = ({ itemId }: ItemHistoryProps) => {
  const { data: activities, isLoading } = useQuery({
    queryKey: ['itemActivities', itemId],
    queryFn: async () => {
      const res = await api.get(`/items/${itemId}/activities`);
      return res.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="card">
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">History</h3>
      {activities && activities.length > 0 ? (
        <div className="space-y-4">
          {activities.map((activity: any) => (
            <div key={activity.id} className="flex items-start space-x-4 pb-4 border-b border-gray-200 last:border-0">
              <div className="flex-shrink-0">
                <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.description.replace(/\s+by\s+[\w.@-]+$/i, '')}
                  </p>
                  <p className="text-xs text-gray-500 ml-4">
                    {format(new Date(activity.createdAt), 'dd/MM/yyyy hh:mm a')}
                  </p>
                </div>
                {activity.user && (
                  <p className="text-xs text-gray-600 mt-1">
                    by {activity.user.name || (activity.user.email ? activity.user.email.split('@')[0] : 'Unknown')}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-600">No history found.</p>
      )}
    </div>
  );
};

export default ItemHistory;

