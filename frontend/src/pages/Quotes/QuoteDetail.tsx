import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import QuoteStatusBadge from '../../components/Quotes/QuoteStatusBadge';
import QuotesSidebar from '../../components/Quotes/QuotesSidebar';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useToast } from '../../contexts/ToastContext';
import { numberToWords } from '../../utils/numberToWords';
import { generatePDF } from '../../utils/pdfGenerator';
import EmailModal from '../../components/Quotes/EmailModal';
import ConfirmModal from '../../components/ConfirmModal';
import AlertModal from '../../components/AlertModal';
import {
  XMarkIcon,
  PencilIcon,
  EllipsisVerticalIcon,
  PaperAirplaneIcon,
  ShareIcon,
  DocumentArrowDownIcon,
  DocumentTextIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  StarIcon,
  CheckIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

const QuoteDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);
  const [templateDropdownOpen, setTemplateDropdownOpen] = useState(false);
  const [sendDropdownOpen, setSendDropdownOpen] = useState(false);
  const [pdfDropdownOpen, setPdfDropdownOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [projectsAccordionOpen, setProjectsAccordionOpen] = useState(false);
  const [statusChangeModalOpen, setStatusChangeModalOpen] = useState(false);
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [alertModalConfig, setAlertModalConfig] = useState<{ title: string; message: string; type?: 'info' | 'error' | 'success' | 'warning' }>({ title: '', message: '', type: 'info' });
  const [pendingStatusChange, setPendingStatusChange] = useState<string | null>(null);
  const sendDropdownRef = useRef<HTMLDivElement>(null);
  const pdfDropdownRef = useRef<HTMLDivElement>(null);

  const { data: quote, isLoading } = useQuery({
    queryKey: ['quote', id],
    queryFn: async () => {
      const res = await api.get(`/quotes/${id}`);
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
    queryKey: ['quote-render', id, previewTemplateId],
    queryFn: async () => {
      if (!previewTemplateId) return null;
      const res = await api.get(`/quotes/${id}/render?templateId=${previewTemplateId}`);
      return res.data.data.renderedHTML;
    },
    enabled: !!id && !!previewTemplateId && !!quote,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      await api.patch(`/quotes/${id}/status`, { status });
    },
    onSuccess: (_, status) => {
      queryClient.invalidateQueries({ queryKey: ['quote', id] });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      const statusMessages: Record<string, string> = {
        'SENT': 'Quote marked as sent',
        'ACCEPTED': 'Quote marked as accepted',
        'REJECTED': 'Quote marked as rejected',
        'DRAFT': 'Quote status updated',
        'INVOICED': 'Quote marked as invoiced',
      };
      showToast(statusMessages[status] || 'Quote status updated', 'success');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Failed to update quote status';
      showToast(message, 'error');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!quote || !quote.id) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Quote not found</p>
          <Link to="/quotes" className="btn-primary">
            Back to Quotes
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

  const handleStatusChange = (newStatus: string) => {
    setPendingStatusChange(newStatus);
    setStatusChangeModalOpen(true);
  };

  const confirmStatusChange = () => {
    if (pendingStatusChange) {
      updateStatusMutation.mutate(pendingStatusChange);
    }
    setStatusChangeModalOpen(false);
    setPendingStatusChange(null);
  };

  const handleConvertToInvoice = () => {
    // Navigate to invoice form with quoteId to pre-populate
    navigate(`/invoices/new?quoteId=${id}`);
  };

  const handleSendQuote = () => {
    setEmailModalOpen(true);
  };

  const handleMarkAsSent = () => {
    handleStatusChange('SENT');
  };

  // Get HTML for PDF - use EXACT same logic as preview to ensure they match
  const getPDFHTML = () => {
    // Use the exact same function that generates the preview HTML
    // This ensures 100% match between preview and PDF
    return getRenderedHTML();
  };

  const handleDownloadPDF = async () => {
    try {
      // Use the EXACT same HTML as the preview - recalculate to ensure latest state
      const pdfHTML = getPDFHTML();
      
      if (!pdfHTML) {
        setAlertModalConfig({
          title: 'Preview Not Available',
          message: 'Quote preview is not available',
          type: 'error',
        });
        setAlertModalOpen(true);
        return;
      }

      // Log for debugging
      console.log('Downloading PDF');
      console.log('- Selected template ID:', previewTemplateId || 'none (using quote template)');
      console.log('- Quote template ID:', quote.templateId);
      console.log('- Rendered HTML available:', !!pdfHTML);
      console.log('- HTML length:', pdfHTML.length);
      
      await generatePDF(pdfHTML, quote.quoteNumber);
      setPdfDropdownOpen(false);
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      setAlertModalConfig({
        title: 'PDF Generation Failed',
        message: error.message || 'Failed to generate PDF. Please try again.',
        type: 'error',
      });
      setAlertModalOpen(true);
    }
  };

  const handleSendEmail = () => {
    setEmailModalOpen(true);
    setSendDropdownOpen(false);
  };

  const handleEmailSent = () => {
    queryClient.invalidateQueries({ queryKey: ['quote', id] });
  };

  // Calculate item totals
  const calculateItemTotal = (item: any) => {
    const amount = Number(item.quantity) * Number(item.rate);
    return amount;
  };

  const subtotal = quote.items?.reduce((sum: number, item: any) => sum + calculateItemTotal(item), 0) || 0;
  const taxAmount = quote.items?.reduce((sum: number, item: any) => {
    const amount = calculateItemTotal(item);
    return sum + (amount * Number(item.taxRate)) / 100;
  }, 0) || 0;
  const total = subtotal + taxAmount;

  // Get rendered HTML - prioritize backend-rendered HTML
  const getRenderedHTML = () => {
    try {
      // If we have a preview template selected, use the backend-rendered HTML for that template
      if (previewTemplateId && renderedTemplateHTML) {
        return renderedTemplateHTML;
      }

      // Otherwise, use the quote's rendered HTML from backend (which includes template)
      if ((quote as any).renderedHTML) {
        return (quote as any).renderedHTML;
      }

      return '';
    } catch (error) {
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
      navigate(`/quotes/${id}/edit?templateId=${previewTemplateId}`);
    } else {
      navigate(`/quotes/${id}/edit`);
    }
  };

  // Get current template name
  const currentTemplateName = (() => {
    if (previewTemplateId && templates) {
      const previewTemplate = templates.find((t: any) => t.id === previewTemplateId);
      if (previewTemplate) return previewTemplate.name;
    }
    return quote?.template?.name || 'Spreadsheet Template';
  })();

  return (
    <div className="flex bg-gray-50 -m-6 lg:-m-8 h-screen">
      {/* Left Sidebar - Quotes List */}
      <div className="flex-shrink-0 h-full">
        <QuotesSidebar currentQuoteId={id} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden h-full">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0 sticky top-0 z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/quotes')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-gray-600" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">{quote.quoteNumber}</h1>
            </div>
            <div className="flex items-center space-x-2">
              {quote.status === 'DRAFT' && (
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
                          const isSelected = (previewTemplateId || quote.templateId) === template.id;
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
                            handleMarkAsSent();
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
              <button className="btn-secondary flex items-center space-x-2">
                <ShareIcon className="w-4 h-4" />
                <span>Share</span>
              </button>
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
              {quote.status === 'SENT' && !quote.convertedToInvoice && (
                <button
                  onClick={handleConvertToInvoice}
                  className="btn-primary flex items-center space-x-2"
                >
                  <DocumentTextIcon className="w-4 h-4" />
                  <span>Convert to Invoice</span>
                </button>
              )}
              <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <EllipsisVerticalIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* What's Next Section */}
            {quote.status === 'DRAFT' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <StarIcon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-blue-900 font-medium mb-3">
                      Go ahead and email this quote to your customer or simply mark it as sent.
                    </p>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleSendQuote}
                        className="btn-primary text-sm"
                      >
                        Send Quote
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

            {/* Projects Section - Accordion */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setProjectsAccordionOpen(!projectsAccordionOpen)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <h3 className="text-sm font-semibold text-gray-900">Projects</h3>
                {projectsAccordionOpen ? (
                  <ChevronUpIcon className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                )}
              </button>
              
              {projectsAccordionOpen && (
                <div className="border-t border-gray-200">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                            PROJECT NAME
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                            DESCRIPTION
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                            BILLING METHOD
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                            RATE
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {quote.project ? (
                          <tr>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {quote.project.name}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-600">
                              {quote.project.description || '-'}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 text-left">
                              Hourly Rate
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                              ₹{Number(quote.project.hourlyRate).toFixed(2)}
                            </td>
                          </tr>
                        ) : (
                          <tr>
                            <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                              No projects associated with this quote
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Quote Preview - Render using template */}
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
                    title="Quote Preview"
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
                  />
                </div>
              </div>
            ) : (
              <div className="card bg-white relative overflow-hidden">
                {/* Draft Watermark */}
                {quote.status === 'DRAFT' && (
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
                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Test</p>
                    <p className="text-sm text-gray-600">Gujarat</p>
                    <p className="text-sm text-gray-600">India</p>
                    <p className="text-sm text-gray-600 mt-2">jayesh.prajapati@aipxperts.com</p>
                  </div>
                  <div className="text-right">
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">QUOTE</h2>
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-600">
                        <span className="font-semibold">#</span> {quote.quoteNumber}
                      </p>
                      <p className="text-gray-600">
                        <span className="font-semibold">Date:</span>{' '}
                        {quote.issueDate ? format(new Date(quote.issueDate), 'dd/MM/yyyy') : 'N/A'}
                      </p>
                      {quote.expiryDate && (
                        <p className="text-gray-600">
                          <span className="font-semibold">Expiry Date:</span>{' '}
                          {format(new Date(quote.expiryDate), 'dd/MM/yyyy')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bill To */}
                <div className="mb-8">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Bill To</h3>
                  <div className="text-sm text-gray-700">
                    <p className="font-semibold">{quote.contact?.name}</p>
                    {quote.contact?.billingAddress && (
                      <>
                        <p>{quote.contact.billingAddress}</p>
                        <p>
                          {quote.contact.billingCity}
                          {quote.contact.billingState && `, ${quote.contact.billingState}`}
                          {quote.contact.billingZipCode && ` ${quote.contact.billingZipCode}`}
                        </p>
                        <p>{quote.contact.billingCountry}</p>
                      </>
                    )}
                    {!quote.contact?.billingAddress && quote.contact?.address && (
                      <>
                        <p>{quote.contact.address}</p>
                        {quote.contact.city && <p>{quote.contact.city}</p>}
                        {quote.contact.state && <p>{quote.contact.state}</p>}
                        {quote.contact.zipCode && <p>{quote.contact.zipCode}</p>}
                        {quote.contact.country && <p>{quote.contact.country}</p>}
                      </>
                    )}
                  </div>
                </div>

                {/* Items Table */}
                <div className="mb-8">
                  <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-200">
                          #
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-200">
                          Item & Description
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase border-r border-gray-200">
                          Qty
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase border-r border-gray-200">
                          Rate
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {quote.items?.map((item: any, index: number) => {
                        const itemTotal = calculateItemTotal(item);
                        return (
                          <tr key={index}>
                            <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200">
                              {index + 1}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200">
                              <div>
                                <p className="font-medium">{item.name}</p>
                                {item.description && (
                                  <p className="text-gray-600 text-xs mt-1">{item.description}</p>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-right border-r border-gray-200">
                              {Number(item.quantity).toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-right border-r border-gray-200">
                              {formatCurrency(Number(item.rate))}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-right">
                              {formatCurrency(itemTotal)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Summary */}
                <div className="mb-8 flex justify-end">
                  <div className="w-80 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">Sub Total</span>
                      <span className="text-gray-900 font-semibold">{formatCurrency(subtotal)}</span>
                    </div>
                    {taxAmount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700">Tax</span>
                        <span className="text-gray-900 font-semibold">{formatCurrency(taxAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t-2 border-gray-300">
                      <span className="text-base font-bold text-gray-900">Total</span>
                      <span className="text-xl font-bold text-gray-900">{formatCurrency(total)}</span>
                    </div>
                    <div className="pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-600">
                        Total in Words: <span className="font-semibold">{numberToWords(total)}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {quote.notes && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Notes</h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{quote.notes}</p>
                  </div>
                )}

                {/* Terms & Conditions */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Terms & Conditions</h4>
                  <p className="text-sm text-gray-700">Standard terms and conditions apply.</p>
                </div>

                {/* Authorized Signature */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Authorized Signature</h4>
                  <div className="h-20 border-b-2 border-gray-300"></div>
                </div>

                {/* Template Info */}
                <div className="text-xs text-gray-500 border-t border-gray-200 pt-4">
                  PDF Template: <span className="text-primary-600 cursor-pointer hover:underline">'{quote.template?.name || 'Spreadsheet Template'}'</span>{' '}
                  <span className="text-primary-600 cursor-pointer hover:underline">Change</span>
                </div>
              </div>
              </div>
            )}

            {/* More Information */}
            <div className="card">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">More Information</h3>
              <div className="space-y-4">
                {quote.project && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Project</label>
                    <p className="text-sm text-gray-900">{quote.project.name}</p>
                  </div>
                )}
                {quote.paymentTerms && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Payment Terms</label>
                    <p className="text-sm text-gray-900">{quote.paymentTerms}</p>
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
          </div>
        </div>
      </div>

      {/* Status Change Confirmation Modal */}
      <ConfirmModal
        isOpen={statusChangeModalOpen}
        onClose={() => {
          setStatusChangeModalOpen(false);
          setPendingStatusChange(null);
        }}
        onConfirm={confirmStatusChange}
        title="Change Quote Status"
        message={`Are you sure you want to change status to ${pendingStatusChange}?`}
        confirmText="Confirm"
        cancelText="Cancel"
        confirmButtonColor="blue"
      />

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModalOpen}
        onClose={() => setAlertModalOpen(false)}
        title={alertModalConfig.title}
        message={alertModalConfig.message}
        type={alertModalConfig.type}
      />

      {/* Email Modal */}
      <EmailModal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        quoteId={id!}
        quoteNumber={quote.quoteNumber}
        contactEmail={quote.contact?.email}
        onSuccess={handleEmailSent}
      />
    </div>
  );
};

export default QuoteDetail;
