import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import {
  XMarkIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceId: string;
  invoiceNumber: string;
  contactEmail?: string;
  onSuccess?: () => void;
}

// Development default email
const DEV_DEFAULT_EMAIL = 'jayesh.prajapati@aipxperts.com';

const EmailModal = ({ 
  isOpen, 
  onClose, 
  invoiceId, 
  invoiceNumber,
  contactEmail,
  onSuccess 
}: EmailModalProps) => {
  const { showToast } = useToast();
  // Use contact email if available, otherwise use development default
  const defaultEmail = contactEmail || DEV_DEFAULT_EMAIL;
  const [to, setTo] = useState(defaultEmail);
  const [subject, setSubject] = useState(`Invoice ${invoiceNumber}`);
  const [message, setMessage] = useState(`Please find attached invoice ${invoiceNumber}.`);

  // Update email when modal opens or contactEmail changes
  useEffect(() => {
    if (isOpen) {
      const emailToUse = contactEmail || DEV_DEFAULT_EMAIL;
      setTo(emailToUse);
      setSubject(`Invoice ${invoiceNumber}`);
      setMessage(`Please find attached invoice ${invoiceNumber}.`);
    }
  }, [isOpen, contactEmail, invoiceNumber]);

  const sendEmailMutation = useMutation({
    mutationFn: async (data: { to: string; subject: string; message: string }) => {
      const res = await api.post(`/invoices/${invoiceId}/send-email`, data);
      return res.data;
    },
    onSuccess: () => {
      onSuccess?.();
      onClose();
      showToast('Invoice sent via email successfully', 'success');
      // Reset form with default email
      const resetEmail = contactEmail || DEV_DEFAULT_EMAIL;
      setTo(resetEmail);
      setSubject(`Invoice ${invoiceNumber}`);
      setMessage(`Please find attached invoice ${invoiceNumber}.`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Failed to send email';
      showToast(message, 'error');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!to.trim()) {
      showToast('Please enter a recipient email address', 'error');
      return;
    }
    sendEmailMutation.mutate({ to, subject, message });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Send Invoice via Email</h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pt-4 space-y-4">
              <div>
                <label htmlFor="to" className="block text-sm font-medium text-gray-700 mb-1">
                  To <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="to"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="input-field"
                  placeholder={DEV_DEFAULT_EMAIL}
                  required
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="input-field"
                  rows={5}
                  required
                />
              </div>

              {sendEmailMutation.isError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">
                    {sendEmailMutation.error instanceof Error
                      ? sendEmailMutation.error.message
                      : 'Failed to send email. Please try again.'}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-200">
              <button
                type="submit"
                disabled={sendEmailMutation.isPending}
                className="btn-primary w-full sm:w-auto sm:ml-3 flex items-center justify-center space-x-2"
              >
                {sendEmailMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <PaperAirplaneIcon className="w-4 h-4" />
                    <span>Send Email</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={sendEmailMutation.isPending}
                className="btn-secondary w-full sm:w-auto mt-3 sm:mt-0"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EmailModal;

