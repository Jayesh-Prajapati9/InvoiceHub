import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import { format } from 'date-fns';

interface MailHistoryProps {
  contactId: string;
}

const MailHistory = ({ contactId }: MailHistoryProps) => {
  const { data: activities, isLoading } = useQuery({
    queryKey: ['contactActivities', contactId],
    queryFn: async () => {
      const res = await api.get(`/contacts/${contactId}/activities`);
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

  // Filter activities for email-related actions
  const emailActivities = activities?.filter((activity: any) => 
    activity.action?.includes('EMAIL') || 
    activity.action?.includes('EMAIL_SENT') ||
    (activity.description?.toLowerCase().includes('sent via email') || 
     activity.description?.toLowerCase().includes('email to'))
  ) || [];

  // Extract email details from activity
  const formatEmailActivity = (activity: any) => {
    const description = activity.description || '';
    const metadata = activity.metadata || {};
    
    // Get email from metadata or extract from description
    let email = metadata.emailTo || '';
    if (!email) {
      const emailMatch = description.match(/to\s+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
      if (emailMatch) {
        email = emailMatch[1];
      }
    }
    
    // Get subject from metadata or create from description
    let subject = metadata.subject || '';
    if (!subject) {
      const documentType = metadata.invoiceId ? 'Invoice' : metadata.quoteId ? 'Quote' : '';
      const documentNumber = metadata.invoiceNumber || metadata.quoteNumber || '';
      
      if (documentType && documentNumber) {
        subject = `${documentType} Notification - ${documentType} - ${documentNumber}`;
        if (metadata.contactName) {
          subject += ` from ${metadata.contactName}`;
        }
      } else {
        subject = description;
      }
    }
    
    const documentType = metadata.invoiceId ? 'Invoice' : metadata.quoteId ? 'Quote' : '';
    const documentId = metadata.invoiceId || metadata.quoteId || '';
    const documentNumber = metadata.invoiceNumber || metadata.quoteNumber || '';
    
    return {
      email,
      subject,
      documentType,
      documentNumber,
      documentId,
      date: activity.createdAt,
      user: activity.user,
    };
  };

  const getInitial = (email: string) => {
    if (!email) return '?';
    return email.charAt(0).toUpperCase();
  };

  return (
    <div className="card">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-gray-900">System Mails</h3>
      </div>
      
      {emailActivities.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-sm text-gray-600">No emails sent yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {emailActivities.map((activity: any) => {
            const emailData = formatEmailActivity(activity);
            const initial = getInitial(emailData.email);
            
            return (
              <div key={activity.id} className="flex items-start space-x-3 pb-4 border-b border-gray-200 last:border-0">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">{initial}</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 mb-1">
                        To {emailData.email || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-900 font-medium">
                        {emailData.subject}
                      </p>
                      {emailData.documentId && (
                        <Link
                          to={emailData.documentType === 'Invoice' ? `/invoices/${emailData.documentId}` : `/quotes/${emailData.documentId}`}
                          className="text-sm text-primary-600 hover:text-primary-900 font-medium mt-1 inline-block"
                        >
                          - View Details
                        </Link>
                      )}
                    </div>
                    <div className="ml-4 text-right">
                      <p className="text-xs text-gray-500 whitespace-nowrap">
                        {format(new Date(emailData.date), 'dd/MM/yyyy hh:mm a')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MailHistory;

