import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import AddressSection from './AddressSection';
import ContactPersonsList from './ContactPersonsList';
import ActivityLog from './ActivityLog';
import { UserIcon } from '@heroicons/react/24/outline';

interface ContactOverviewProps {
  contactId: string;
}

const ContactOverview = ({ contactId }: ContactOverviewProps) => {
  const { data: contact, isLoading } = useQuery({
    queryKey: ['contact', contactId],
    queryFn: async () => {
      const res = await api.get(`/contacts/${contactId}`);
      return res.data.data;
    },
  });

  if (isLoading) {
    return <LoadingSpinner size="lg" />;
  }

  if (!contact) {
    return <div>Contact not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Contact Person Card */}
      <div className="card bg-gray-50 border border-gray-200">
        <div className="flex items-start">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
              <UserIcon className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {contact.name ? `Mr. ${contact.name}` : contact.name}
              </h3>
              <div className="mt-2 space-y-1 text-sm text-gray-600">
                {contact.email && (
                  <p>
                    <span className="font-medium">Email:</span> {contact.email}
                  </p>
                )}
                {contact.phone && (
                  <p>
                    <span className="font-medium">Phone:</span> {contact.phone}
                  </p>
                )}
                {contact.mobile && (
                  <p>
                    <span className="font-medium">Mobile:</span> {contact.mobile}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Address Section */}
      <AddressSection contact={contact} />

      {/* Other Details */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Other Details</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Customer Type:</span>
            <span className="ml-2 font-medium text-gray-900">
              {contact.customerType === 'BUSINESS' ? 'Business' : 'Individual'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Default Currency:</span>
            <span className="ml-2 font-medium text-gray-900">{contact.defaultCurrency || 'INR'}</span>
          </div>
          <div>
            <span className="text-gray-600">Portal Status:</span>
            <span
              className={`ml-2 font-medium ${
                contact.portalStatus === 'ENABLED' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {contact.portalStatus === 'ENABLED' ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Customer Language:</span>
            <span className="ml-2 font-medium text-gray-900">
              {contact.customerLanguage === 'en' ? 'English' : contact.customerLanguage}
            </span>
          </div>
        </div>
      </div>

      {/* Contact Persons */}
      <ContactPersonsList contactId={contactId} />

      {/* Activity Log */}
      <ActivityLog contactId={contactId} />
    </div>
  );
};

export default ContactOverview;

