import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { UserIcon } from '@heroicons/react/24/outline';

interface ContactsSidebarProps {
  currentContactId?: string;
}

const ContactsSidebar = ({ currentContactId }: ContactsSidebarProps) => {
  const { data } = useQuery({
    queryKey: ['contacts', 'sidebar'],
    queryFn: async () => {
      const res = await api.get('/contacts?limit=50&status=ACTIVE');
      return res.data.data;
    },
  });

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col overflow-hidden h-full">
      <div className="border-b border-gray-200 flex-shrink-0 px-6 py-2.5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-900">Active Customers</h2>
          <Link
            to="/contacts/new"
            className="p-1 text-primary-600 hover:text-primary-900 hover:bg-primary-50 rounded transition-colors"
          >
            <span className="text-lg font-bold">+</span>
          </Link>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="py-2">
        {data?.contacts?.map((contact: any) => (
          <Link
            key={contact.id}
            to={`/contacts/${contact.id}`}
            className={`flex items-center space-x-3 px-6 py-3 rounded-lg mb-1 transition-colors ${
              currentContactId === contact.id
                ? 'bg-primary-50 border border-primary-200'
                : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-semibold">
                  {contact.name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{contact.name}</p>
              <p className="text-xs text-gray-500">
                {contact.receivables !== undefined
                  ? `₹${Number(contact.receivables).toFixed(2)}`
                  : '₹0.00'}
              </p>
            </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ContactsSidebar;

