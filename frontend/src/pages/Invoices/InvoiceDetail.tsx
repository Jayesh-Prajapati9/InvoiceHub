import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import InvoicesSidebar from '../../components/Invoices/InvoicesSidebar';
import { useToast } from '../../contexts/ToastContext';
import { renderInvoiceTemplate } from '../../utils/templateRenderer';
import { generatePDF } from '../../utils/pdfGenerator';
import EmailModal from '../../components/Invoices/EmailModal';
import ConfirmModal from '../../components/ConfirmModal';
import {
  XMarkIcon,
  PencilIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  DocumentArrowUpIcon,
  PaperAirplaneIcon,
  DocumentArrowDownIcon,
  DocumentTextIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CheckIcon,
  StarIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

const InvoiceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);
  const [templateDropdownOpen, setTemplateDropdownOpen] = useState(false);
  const [sendDropdownOpen, setSendDropdownOpen] = useState(false);
  const [pdfDropdownOpen, setPdfDropdownOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentsAccordionOpen, setPaymentsAccordionOpen] = useState(false);
  const [quoteAccordionOpen, setQuoteAccordionOpen] = useState(false);
  const [statusChangeModalOpen, setStatusChangeModalOpen] = useState(false);
  const [deletePaymentModalOpen, setDeletePaymentModalOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<string | null>(null);
  const [pendingPaymentDelete, setPendingPaymentDelete] = useState<string | null>(null);
  const sendDropdownRef = useRef<HTMLDivElement>(null);
  const pdfDropdownRef = useRef<HTMLDivElement>(null);

  const { data: invoice, isLoading, error: invoiceError } = useQuery({
    queryKey: ['invoice', id],
    queryFn: async () => {
      const res = await api.get(`/invoices/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });

  const { data: templatesData } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const res = await api.get('/templates?limit=1000');
      return res.data.data.templates || [];
    },
  });
  
  const templates = templatesData || [];

  // Fetch rendered HTML when template changes
  const { data: renderedTemplateHTML } = useQuery({
    queryKey: ['invoice-render', id, previewTemplateId],
    queryFn: async () => {
      if (!previewTemplateId) return null;
      const res = await api.get(`/invoices/${id}/render?templateId=${previewTemplateId}`);
      return res.data.data.renderedHTML;
    },
    enabled: !!id && !!previewTemplateId && !!invoice,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ status, paidAmount }: { status: string; paidAmount?: number }) => {
      await api.patch(`/invoices/${id}/status`, { status, paidAmount });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setPaidAmount('');
      const statusMessages: Record<string, string> = {
        'SENT': 'Invoice marked as sent',
        'PAID': 'Invoice marked as paid',
        'DRAFT': 'Invoice status updated',
        'OVERDUE': 'Invoice status updated',
      };
      showToast(statusMessages[variables.status] || 'Invoice status updated', 'success');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Failed to update invoice status';
      showToast(message, 'error');
    },
  });

  // Close dropdowns when clicking outside - MUST be before any early returns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sendDropdownRef.current && !sendDropdownRef.current.contains(event.target as Node)) {
        setSendDropdownOpen(false);
      }
      if (pdfDropdownRef.current && !pdfDropdownRef.current.contains(event.target as Node)) {
        setPdfDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (invoiceError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading invoice</p>
          <p className="text-gray-600 mb-4 text-sm">
            {invoiceError instanceof Error ? invoiceError.message : 'Unknown error occurred'}
          </p>
          <Link to="/invoices" className="btn-primary">
            Back to Invoices
          </Link>
        </div>
      </div>
    );
  }

  if (!invoice || !invoice.id) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Invoice not found</p>
          <Link to="/invoices" className="btn-primary">
            Back to Invoices
          </Link>
        </div>
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'badge-gray';
      case 'SENT':
        return 'badge-info';
      case 'PAID':
        return 'badge-success';
      case 'OVERDUE':
        return 'badge-danger';
      default:
        return 'badge-gray';
    }
  };

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === 'PAID' && !paidAmount) {
      setPaidAmount(invoice.total.toString());
    }
    setPendingStatusChange(newStatus);
    setStatusChangeModalOpen(true);
  };

  const confirmStatusChange = () => {
    if (pendingStatusChange) {
      updateStatusMutation.mutate({
        status: pendingStatusChange,
        paidAmount: pendingStatusChange === 'PAID' ? parseFloat(paidAmount) : undefined,
      });
    }
    setStatusChangeModalOpen(false);
    setPendingStatusChange(null);
  };

  const handleSendInvoice = () => {
    setEmailModalOpen(true);
  };

  const handleMarkAsSent = () => {
    handleStatusChange('SENT');
  };

  // Determine which template to use for preview
  const activeTemplateId = previewTemplateId || invoice.templateId;
  const activeTemplate = invoice.template;

  // Use backend rendered HTML - it's already processed by Handlebars correctly
  const getRenderedHTML = () => {
    try {
      // Ensure we have required invoice data
      if (!invoice || !invoice.invoiceNumber) {
        console.warn('Invoice data is incomplete');
        return '';
      }

      // Priority 1: If a template is selected for preview, use the rendered HTML from API
      if (previewTemplateId && renderedTemplateHTML) {
        console.log('[Frontend] Using rendered HTML from template preview API');
        return renderedTemplateHTML;
      }

      // Priority 2: Use default backend rendered HTML
      if ((invoice as any).renderedHTML) {
        console.log('[Frontend] Using backend renderedHTML');
        return (invoice as any).renderedHTML;
      }

      console.warn('[Frontend] No renderedHTML from backend, returning empty');
      return '';
    } catch (error) {
      console.error('Error getting rendered HTML:', error);
      return '';
    }
  };

  const renderedHTML = getRenderedHTML();

  const handleTemplateSelect = (templateId: string) => {
    setPreviewTemplateId(templateId);
    setTemplateDropdownOpen(false);
  };

  // Save template selection when navigating to edit
  const handleEditClick = () => {
    if (previewTemplateId) {
      // Pass templateId as URL parameter to pre-fill in edit form
      navigate(`/invoices/${id}/edit?templateId=${previewTemplateId}`);
    } else {
      navigate(`/invoices/${id}/edit`);
    }
  };

  const remainingAmount = Number(invoice.total) - Number(invoice.paidAmount || 0);

  // Get HTML for PDF - use EXACT same logic as preview to ensure they match
  const getPDFHTML = () => {
    // Use the exact same function that generates the preview HTML
    // This ensures 100% match between preview and PDF
    return getRenderedHTML();
  };

  const handleDownloadPDF = async () => {
    try {
      // Use the EXACT same HTML as the preview - recalculate to ensure latest state
      const pdfHTML = getRenderedHTML();
      
      if (!pdfHTML) {
        showToast('Invoice preview is not available', 'error');
        return;
      }
      
      await generatePDF(pdfHTML, invoice.invoiceNumber);
      setPdfDropdownOpen(false);
      showToast('PDF downloaded successfully', 'success');
    } catch (error: any) {
      const message = error.message || 'Failed to generate PDF. Please try again.';
      showToast(message, 'error');
    }
  };

  const handleSendEmail = () => {
    setEmailModalOpen(true);
    setSendDropdownOpen(false);
  };

  const handleEmailSent = () => {
    queryClient.invalidateQueries({ queryKey: ['invoice', id] });
    // Toast is shown in EmailModal component
  };

  return (
    <div className="flex bg-gray-50 -m-6 lg:-m-8 h-screen">
      {/* Left Sidebar - Invoices List */}
      <div className="flex-shrink-0 h-full">
        <InvoicesSidebar currentInvoiceId={id} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden h-full">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/invoices')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-gray-600" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">{invoice.invoiceNumber}</h1>
            </div>
            <div className="flex items-center space-x-2 flex-wrap gap-2">
              {invoice.status === 'DRAFT' && (
                <button
                  onClick={handleEditClick}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <PencilIcon className="w-4 h-4" />
                  <span>Edit</span>
                </button>
              )}
              <div className="relative">
                <button
                  onClick={() => setTemplateDropdownOpen(!templateDropdownOpen)}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <DocumentTextIcon className="w-4 h-4" />
                  <span>Change Template</span>
                  <ChevronDownIcon className="w-4 h-4" />
                </button>
                {templateDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setTemplateDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-20 max-h-96 overflow-y-auto">
                      <div className="p-2">
                        {templates?.map((template: any) => {
                          const isSelected = (previewTemplateId || invoice.templateId) === template.id;
                          return (
                            <button
                              key={template.id}
                              onClick={() => handleTemplateSelect(template.id)}
                              className={`w-full text-left px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-between gap-2 ${
                                isSelected ? 'bg-primary-50 text-primary-700' : 'text-gray-700'
                              }`}
                            >
                              <span className="text-sm font-medium flex-1">{template.name}</span>
                              {isSelected && (
                                <CheckIcon className="w-5 h-5 text-primary-600 flex-shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="relative" ref={sendDropdownRef}>
                <button 
                  onClick={() => setSendDropdownOpen(!sendDropdownOpen)}
                  className="btn-primary flex items-center space-x-2"
                >
                  <PaperAirplaneIcon className="w-4 h-4" />
                  <span>Send</span>
                  <ChevronDownIcon className="w-4 h-4" />
                </button>
                {sendDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setSendDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                      <div className="p-1">
                        <button
                          onClick={handleSendEmail}
                          className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2 text-gray-700"
                        >
                          <PaperAirplaneIcon className="w-4 h-4" />
                          <span>Send Email</span>
                        </button>
                        <button
                          onClick={() => {
                            handleSendInvoice();
                            setSendDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2 text-gray-700"
                        >
                          <CheckCircleIcon className="w-4 h-4" />
                          <span>Mark as Sent</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
              {(invoice.status === 'SENT' || invoice.status === 'OVERDUE') && (
                <button 
                  onClick={() => navigate(`/invoices/${id}/payment`)}
                  className="btn-primary flex items-center space-x-2"
                >
                  <CurrencyDollarIcon className="w-4 h-4" />
                  <span>Record Payment</span>
                </button>
              )}
              <div className="relative" ref={pdfDropdownRef}>
                <button 
                  onClick={() => setPdfDropdownOpen(!pdfDropdownOpen)}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <DocumentArrowDownIcon className="w-4 h-4" />
                  <span>PDF/Print</span>
                  <ChevronDownIcon className="w-4 h-4" />
                </button>
                {pdfDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setPdfDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                      <div className="p-1">
                        <button
                          onClick={handleDownloadPDF}
                          className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2 text-gray-700"
                        >
                          <DocumentArrowDownIcon className="w-4 h-4" />
                          <span>Download PDF</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* What's Next Section */}
            {invoice.status === 'DRAFT' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <StarIcon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-blue-900 font-medium mb-3">
                      Go ahead and email this invoice to your customer or simply mark it as sent.
                    </p>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleSendInvoice}
                        className="btn-primary text-sm"
                      >
                        Send Invoice
                      </button>
                      <button
                        onClick={handleMarkAsSent}
                        className="btn-secondary text-sm"
                      >
                        Mark As Sent
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payments Received Accordion */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setPaymentsAccordionOpen(!paymentsAccordionOpen)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <h3 className="text-sm font-semibold text-gray-900">Payments Received</h3>
                  {invoice.payments && invoice.payments.length > 0 && (
                    <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                      {invoice.payments.length}
                    </span>
                  )}
                </div>
                {paymentsAccordionOpen ? (
                  <ChevronUpIcon className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                )}
              </button>
              
              {paymentsAccordionOpen && (
                <div className="border-t border-gray-200">
                  {invoice.payments && invoice.payments.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              Payment #
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              Reference#
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              Payment Mode
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              Amount
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {invoice.payments.map((payment: any) => (
                            <tr key={payment.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {new Date(payment.paymentDate).toLocaleDateString('en-GB', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                })}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-sm font-medium text-primary-600">
                                  {payment.paymentNumber}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {payment.referenceNumber || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                  payment.status === 'PAID'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {payment.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {payment.paymentMode}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                                ₹{Number(payment.amountReceived).toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end space-x-3">
                                  {payment.status !== 'PAID' && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // For now, navigate to payment form - edit functionality can be added later
                                        navigate(`/invoices/${id}/payment`);
                                      }}
                                      className="text-primary-600 hover:text-primary-900 font-medium"
                                    >
                                      Edit
                                    </button>
                                  )}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPendingPaymentDelete(payment.id);
                                      setDeletePaymentModalOpen(true);
                                    }}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    <TrashIcon className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="px-6 py-12 text-center">
                      <p className="text-sm text-gray-500">No payment records found</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Associated Quote Accordion */}
            {invoice.quote && (
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setQuoteAccordionOpen(!quoteAccordionOpen)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <h3 className="text-sm font-semibold text-gray-900">Associated Quote</h3>
                  </div>
                  {quoteAccordionOpen ? (
                    <ChevronUpIcon className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                  )}
                </button>
                
                {quoteAccordionOpen && (
                  <div className="border-t border-gray-200 px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <DocumentTextIcon className="w-5 h-5 text-primary-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          Quote #{invoice.quote.quoteNumber}
                        </p>
                        <p className="text-xs text-gray-600 mt-0.5">
                          Status: <span className="font-medium">{invoice.quote.status}</span>
                        </p>
                      </div>
                      <Link
                        to={`/quotes/${invoice.quote.id}`}
                        className="btn-secondary text-sm"
                      >
                        View Quote
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Invoice Preview - Render using template */}
            {renderedHTML ? (
              <div className="flex justify-center" style={{ padding: '16px', width: '100%', overflowX: 'hidden' }}>
                <div 
                  className="bg-white shadow-lg"
                  style={{ 
                    width: '210mm', 
                    maxWidth: '100%',
                    flexShrink: 0,
                    margin: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    overflowX: 'hidden',
                    overflowY: 'hidden'
                  }}
                >
                  <iframe
                    srcDoc={renderedHTML}
                    className="border-0"
                    style={{ 
                      width: '100%',
                      display: 'block',
                      border: 'none',
                      overflow: 'hidden',
                      margin: 0,
                      padding: 0
                    }}
                    scrolling="no"
                    title="Invoice Preview"
                    onLoad={(e) => {
                      // Auto-resize iframe to exact content height
                      const iframe = e.target as HTMLIFrameElement;
                      const container = iframe.parentElement;
                      try {
                        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                        if (iframeDoc) {
                          const body = iframeDoc.body;
                          const html = iframeDoc.documentElement;
                          const height = Math.max(
                            body.scrollHeight,
                            body.offsetHeight,
                            html.clientHeight,
                            html.scrollHeight,
                            html.offsetHeight
                          );
                          // Set iframe height to exact content height
                          iframe.style.height = `${height}px`;
                          // Also resize container to match
                          if (container) {
                            container.style.height = `${height}px`;
                          }
                        }
                      } catch (err) {
                        // Cross-origin or other error, use default behavior
                        iframe.style.height = 'auto';
                        if (container) {
                          container.style.height = 'auto';
                        }
                      }
                    }}
                    onError={(e) => {
                      console.error('Iframe error:', e);
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="card bg-white relative overflow-hidden">
                {/* Draft Watermark */}
                {invoice.status === 'DRAFT' && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div
                      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -rotate-45 text-gray-300 text-8xl font-bold opacity-20"
                      style={{ zIndex: 1 }}
                    >
                      Draft
                    </div>
                  </div>
                )}

                <div className="relative" style={{ zIndex: 2 }}>
                  <div className="p-6">
                    <p className="text-gray-500 mb-4">Generating preview...</p>
                    <p className="text-sm text-gray-400">
                      {!invoice.contact && 'Contact information is missing. '}
                      {(!invoice.items || invoice.items.length === 0) && 'Invoice items are missing. '}
                      {!invoice.template && !activeTemplate && 'Template is missing.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* More Information */}
            <div className="card">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">More Information</h3>
              <div className="space-y-4">
                {invoice.project && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Project</label>
                    <p className="text-sm text-gray-900">{invoice.project.name}</p>
                  </div>
                )}
                {invoice.paymentTerms && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Payment Terms</label>
                    <p className="text-sm text-gray-900">{invoice.paymentTerms}</p>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Salesperson</label>
                  <input
                    type="text"
                    className="input-field text-sm"
                    placeholder="Select salesperson"
                  />
                </div>
              </div>
            </div>

            {/* Payment History */}
            {invoice.payments && invoice.payments.length > 0 && (
              <div className="card">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Payment History</h3>
                <div className="space-y-3">
                  {invoice.payments.map((payment: any) => (
                    <div
                      key={payment.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className={`w-2 h-2 rounded-full ${
                              payment.status === 'PAID' ? 'bg-green-500' : 'bg-yellow-500'
                            }`} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {payment.paymentNumber}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(payment.paymentDate).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">
                            ₹{Number(payment.amountReceived).toFixed(2)}
                          </p>
                          <p className={`text-xs ${
                            payment.status === 'PAID' ? 'text-green-600' : 'text-yellow-600'
                          }`}>
                            {payment.status}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                          <div>
                            <span className="font-medium">Mode:</span> {payment.paymentMode}
                          </div>
                          {payment.referenceNumber && (
                            <div>
                              <span className="font-medium">Reference:</span> {payment.referenceNumber}
                            </div>
                          )}
                        </div>
                        {payment.notes && (
                          <p className="mt-2 text-xs text-gray-600">{payment.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">Total Paid:</span>
                    <span className="text-sm font-bold text-gray-900">
                      ₹{Number(invoice.paidAmount || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-semibold text-gray-700">Balance Due:</span>
                    <span className={`text-sm font-bold ${
                      Number(invoice.total) - Number(invoice.paidAmount || 0) > 0
                        ? 'text-red-600'
                        : 'text-green-600'
                    }`}>
                      ₹{(Number(invoice.total) - Number(invoice.paidAmount || 0)).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Email Modal */}
      <EmailModal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        invoiceId={id!}
        invoiceNumber={invoice.invoiceNumber}
        contactEmail={invoice.contact?.email}
        onSuccess={handleEmailSent}
      />

      {/* Status Change Confirmation Modal */}
      <ConfirmModal
        isOpen={statusChangeModalOpen}
        onClose={() => {
          setStatusChangeModalOpen(false);
          setPendingStatusChange(null);
        }}
        onConfirm={confirmStatusChange}
        title="Change Invoice Status"
        message={`Are you sure you want to change status to ${pendingStatusChange}?`}
        confirmText="Confirm"
        cancelText="Cancel"
        confirmButtonColor="blue"
      />

      {/* Delete Payment Confirmation Modal */}
      <ConfirmModal
        isOpen={deletePaymentModalOpen}
        onClose={() => {
          setDeletePaymentModalOpen(false);
          setPendingPaymentDelete(null);
        }}
        onConfirm={async () => {
          if (pendingPaymentDelete) {
            try {
              await api.delete(`/payments/${pendingPaymentDelete}`);
              queryClient.invalidateQueries({ queryKey: ['invoice', id] });
              showToast('Payment deleted successfully', 'success');
            } catch (error: any) {
              const message = error.response?.data?.error?.message || 'Failed to delete payment';
              showToast(message, 'error');
            }
          }
          setDeletePaymentModalOpen(false);
          setPendingPaymentDelete(null);
        }}
        title="Delete Payment"
        message="Are you sure you want to delete this payment? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonColor="red"
      />
    </div>
  );
};

export default InvoiceDetail;
