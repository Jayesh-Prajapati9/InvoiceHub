import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import {
  DocumentTextIcon,
  ReceiptRefundIcon,
  FolderIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

interface TransactionsListProps {
  contactId: string;
}

interface TransactionSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  items: any[];
  newRoute: string;
}

const TransactionsList = ({ contactId }: TransactionsListProps) => {
  const navigate = useNavigate();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['invoices', 'quotes', 'projects'])
  );

  const { data: invoicesData, isLoading: invoicesLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const res = await api.get('/invoices?limit=100');
      return res.data.data;
    },
  });

  const { data: quotesData, isLoading: quotesLoading } = useQuery({
    queryKey: ['quotes'],
    queryFn: async () => {
      const res = await api.get('/quotes?limit=100');
      return res.data.data;
    },
  });

  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await api.get('/projects?limit=100');
      return res.data.data;
    },
  });

  // Filter by contactId on frontend
  const invoices = invoicesData?.invoices?.filter((inv: any) => inv.contactId === contactId) || [];
  const quotes = quotesData?.quotes?.filter((quote: any) => quote.contactId === contactId) || [];
  const projects = projectsData?.projects?.filter((proj: any) => proj.contactId === contactId) || [];

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: string | Date) => {
    return format(new Date(date), 'dd MMM yyyy');
  };

  const getStatusBadge = (status: string) => {
    const statusClass =
      status === 'PAID' || status === 'ACCEPTED' || status === 'ACTIVE'
        ? 'bg-green-100 text-green-800'
        : status === 'OVERDUE' || status === 'REJECTED' || status === 'CANCELLED'
        ? 'bg-red-100 text-red-800'
        : status === 'SENT' || status === 'COMPLETED'
        ? 'bg-blue-100 text-blue-800'
        : status === 'ON_HOLD'
        ? 'bg-yellow-100 text-yellow-800'
        : 'bg-gray-100 text-gray-800';

    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusClass}`}>
        {status}
      </span>
    );
  };

  if (invoicesLoading || quotesLoading || projectsLoading) {
    return <LoadingSpinner size="md" />;
  }

  const sections: TransactionSection[] = [
    {
      id: 'invoices',
      title: 'Invoices',
      icon: <ReceiptRefundIcon className="w-5 h-5 text-primary-600" />,
      items: invoices.map((inv: any) => ({
        ...inv,
        type: 'invoice',
        number: inv.invoiceNumber,
        date: inv.issueDate,
        amount: Number(inv.total),
        balanceDue: Number(inv.total) - Number(inv.paidAmount || 0),
        status: inv.status,
      })),
      newRoute: `/invoices/new?contactId=${contactId}`,
    },
    {
      id: 'quotes',
      title: 'Quotes',
      icon: <DocumentTextIcon className="w-5 h-5 text-blue-600" />,
      items: quotes.map((quote: any) => ({
        ...quote,
        type: 'quote',
        number: quote.quoteNumber,
        date: quote.issueDate,
        amount: Number(quote.total),
        status: quote.status,
      })),
      newRoute: `/quotes/new?contactId=${contactId}`,
    },
    {
      id: 'projects',
      title: 'Projects',
      icon: <FolderIcon className="w-5 h-5 text-purple-600" />,
      items: projects.map((proj: any) => ({
        ...proj,
        type: 'project',
        number: proj.name,
        date: proj.startDate || proj.createdAt,
        amount: 0, // Projects don't have amounts directly
        status: proj.status,
      })),
      newRoute: `/projects/new?contactId=${contactId}`,
    },
  ];

  const renderSection = (section: TransactionSection) => {
    const isExpanded = expandedSections.has(section.id);
    const hasItems = section.items.length > 0;

    return (
      <div key={section.id} className="bg-white border border-gray-200 rounded-lg mb-2">
        {/* Section Header */}
        <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
          <button
            onClick={() => toggleSection(section.id)}
            className="flex items-center space-x-2 flex-1 text-left"
          >
            {isExpanded ? (
              <ChevronDownIcon className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRightIcon className="w-4 h-4 text-gray-500" />
            )}
            {section.icon}
            <span className="font-semibold text-gray-900">{section.title}</span>
            {hasItems && (
              <span className="text-sm text-gray-500">({section.items.length})</span>
            )}
          </button>
          <button
            onClick={() => navigate(section.newRoute)}
            className="btn-primary flex items-center space-x-1 px-3 py-1.5 text-sm"
          >
            <PlusIcon className="w-4 h-4" />
            <span>New</span>
          </button>
        </div>

        {/* Section Content */}
        {isExpanded && (
          <div className="p-4">
            {!hasItems ? (
              <div className="text-center py-8 text-gray-500">
                <p>There are no {section.title.toLowerCase()} - Add New</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        {section.id === 'invoices' ? 'Invoice Number' : section.id === 'quotes' ? 'Quote Number' : 'Project Name'}
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Date
                      </th>
                      {section.id !== 'projects' && (
                        <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Amount
                        </th>
                      )}
                      {section.id === 'invoices' && (
                        <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Balance Due
                        </th>
                      )}
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {section.items
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((item: any) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Link
                              to={`/${section.id === 'invoices' ? 'invoices' : section.id === 'quotes' ? 'quotes' : 'projects'}/${item.id}`}
                              className="text-sm text-primary-600 hover:text-primary-900 font-medium"
                            >
                              {item.number}
                            </Link>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-sm text-gray-600">
                              {formatDate(item.date)}
                            </span>
                          </td>
                          {section.id !== 'projects' && (
                            <td className="px-4 py-3 whitespace-nowrap text-right">
                              <span className="text-sm font-medium text-gray-900">
                                {formatCurrency(item.amount)}
                              </span>
                            </td>
                          )}
                          {section.id === 'invoices' && (
                            <td className="px-4 py-3 whitespace-nowrap text-right">
                              <span className="text-sm font-medium text-gray-900">
                                {formatCurrency(item.balanceDue)}
                              </span>
                            </td>
                          )}
                          <td className="px-4 py-3 whitespace-nowrap">
                            {getStatusBadge(item.status)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return <div className="space-y-2">{sections.map(renderSection)}</div>;
};

export default TransactionsList;

