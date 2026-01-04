import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import ModernDropdown from '../../components/ModernDropdown';
import { useAuth } from '../../contexts/AuthContext';
import {
  ArrowLeftIcon,
  PencilIcon,
  ClockIcon,
  FolderIcon,
  UserIcon,
  CurrencyDollarIcon,
  EllipsisVerticalIcon,
  PlusIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  TrashIcon,
  CheckCircleIcon,
  CalendarIcon,
  DocumentTextIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subDays, subWeeks, subMonths, subQuarters, subYears, isWithinInterval, parseISO } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'timesheet' | 'invoice'>('overview');
  const [chartView, setChartView] = useState<'projectHours' | 'profitability'>('projectHours');
  const [timeRange, setTimeRange] = useState('week');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('all');
  const [quoteStatusFilter, setQuoteStatusFilter] = useState('all');

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const res = await api.get(`/projects/${id}`);
      return res.data.data;
    },
  });

  const { data: timesheetsData } = useQuery({
    queryKey: ['project-timesheets', id],
    queryFn: async () => {
      const res = await api.get(`/timesheets?projectId=${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });

  const { data: billableData } = useQuery({
    queryKey: ['project-billable', id],
    queryFn: async () => {
      const res = await api.get(`/timesheets/project/${id}/billable`);
      return res.data.data;
    },
    enabled: !!id,
  });

  const { data: invoicesData } = useQuery({
    queryKey: ['invoices', 'project', id],
    queryFn: async () => {
      const res = await api.get('/invoices?limit=100');
      return res.data.data;
    },
    enabled: !!id,
  });

  const { data: quotesData } = useQuery({
    queryKey: ['quotes', 'project', id],
    queryFn: async () => {
      const res = await api.get('/quotes?limit=100');
      return res.data.data;
    },
    enabled: !!id,
  });

  // Filter invoices and quotes by projectId
  const projectInvoices = invoicesData?.invoices?.filter((inv: any) => inv.projectId === id) || [];
  const projectQuotes = quotesData?.quotes?.filter((quote: any) => quote.projectId === id) || [];

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

  const formatDate = (date: string | Date) => {
    return format(new Date(date), 'dd/MM/yyyy');
  };

  const getInvoiceStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'text-green-600';
      case 'SENT':
        return 'text-blue-600';
      case 'OVERDUE':
        return 'text-red-600';
      case 'DRAFT':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  const getQuoteStatusColor = (status: string) => {
    switch (status) {
      case 'SENT':
        return 'text-blue-600';
      case 'ACCEPTED':
        return 'text-green-600';
      case 'INVOICED':
        return 'text-purple-600';
      case 'REJECTED':
        return 'text-red-600';
      case 'EXPIRED':
        return 'text-orange-600';
      case 'DRAFT':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  // Filter invoices and quotes by status
  const filteredInvoices = invoiceStatusFilter === 'all' 
    ? projectInvoices 
    : projectInvoices.filter((inv: any) => inv.status === invoiceStatusFilter);
  
  const filteredQuotes = quoteStatusFilter === 'all'
    ? projectQuotes
    : projectQuotes.filter((quote: any) => quote.status === quoteStatusFilter);

  // Calculate hours statistics
  const calculateHours = () => {
    const allTimesheets = timesheetsData?.timesheets || [];
    const billableTimesheets = billableData?.timesheets || [];

    const loggedHours = allTimesheets.reduce((sum: number, ts: any) => sum + Number(ts.hours), 0);
    const billableHours = billableTimesheets.reduce((sum: number, ts: any) => sum + Number(ts.hours), 0);
    const hourlyRate = project?.hourlyRate || 0;

    // Calculate billed hours from TIMESHEET items in invoices and quotes
    let billedHours = 0;
    
    // Helper function to check if an item is a timesheet item
    const isTimesheetItem = (item: any) => {
      // Skip HEADER items
      if (item.type && item.type.toUpperCase() === 'HEADER') {
        return false;
      }
      
      // Check type field first (most reliable)
      if (item.type && item.type.toUpperCase() === 'TIMESHEET') {
        return true;
      }
      
      // Fallback: Check if name indicates it's a timesheet entry
      // Timesheet items are typically named "Work on [date]"
      if (item.name && typeof item.name === 'string') {
        const nameLower = item.name.toLowerCase();
        if (nameLower.includes('work on') || nameLower.startsWith('work on')) {
          return true;
        }
      }
      
      return false;
    };
    
    // Sum hours from TIMESHEET items in project invoices
    projectInvoices.forEach((invoice: any) => {
      if (invoice.items && Array.isArray(invoice.items)) {
        invoice.items.forEach((item: any) => {
          if (isTimesheetItem(item)) {
            const hours = Number(item.quantity) || 0;
            billedHours += hours;
          }
        });
      }
    });
    
    // Sum hours from TIMESHEET items in project quotes that haven't been converted to invoices
    // (to avoid double counting - if a quote is converted, its hours are already in the invoice)
    projectQuotes.forEach((quote: any) => {
      // Only count quote hours if it hasn't been converted to an invoice
      if (!quote.convertedToInvoice && !quote.invoiceId) {
        if (quote.items && Array.isArray(quote.items)) {
          quote.items.forEach((item: any) => {
            if (isTimesheetItem(item)) {
              const hours = Number(item.quantity) || 0;
              billedHours += hours;
            }
          });
        }
      }
    });
    
    const unbilledHours = billableHours - billedHours;

    return {
      loggedHours,
      billableHours,
      billedHours,
      unbilledHours,
      loggedAmount: loggedHours * hourlyRate,
      billableAmount: billableHours * hourlyRate,
      billedAmount: billedHours * hourlyRate,
      unbilledAmount: unbilledHours * hourlyRate,
    };
  };

  const formatHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  // Calculate hours first (needed by calculateUserStats)
  const hours = calculateHours();

  // Calculate user statistics from timesheets
  const calculateUserStats = () => {
    const allTimesheets = timesheetsData?.timesheets || [];
    const billableTimesheets = billableData?.timesheets || [];
    
    // Group timesheets by user (userId or customUserName)
    const userMap = new Map<string, {
      name: string;
      email?: string;
      loggedHours: number;
      billableHours: number;
      billedHours: number;
    }>();

    // Process all timesheets
    allTimesheets.forEach((ts: any) => {
      const userKey = ts.userId || ts.customUserName || 'unknown';
      // Check if userId is a contact (has contact info) or a user
      const userName = ts.customUserName || ts.contact?.name || ts.user?.name || 'Unknown User';
      const userEmail = ts.contact?.email || ts.user?.email;
      
      if (!userMap.has(userKey)) {
        userMap.set(userKey, {
          name: userName,
          email: userEmail,
          loggedHours: 0,
          billableHours: 0,
          billedHours: 0,
        });
      }
      
      const userStat = userMap.get(userKey)!;
      userStat.loggedHours += Number(ts.hours) || 0;
    });

    // Process billable timesheets
    billableTimesheets.forEach((ts: any) => {
      const userKey = ts.userId || ts.customUserName || 'unknown';
      if (userMap.has(userKey)) {
        const userStat = userMap.get(userKey)!;
        userStat.billableHours += Number(ts.hours) || 0;
      }
    });

    // Calculate billed hours per user from invoice/quote items
    const userBilledHours = new Map<string, number>();
    
    projectInvoices.forEach((invoice: any) => {
      if (invoice.items && Array.isArray(invoice.items)) {
        invoice.items.forEach((item: any) => {
          const isTimesheetItem = item.type && item.type.toUpperCase() === 'TIMESHEET';
          if (isTimesheetItem) {
            // For now, we'll distribute billed hours proportionally
            // In a real scenario, you'd need to track which timesheet entries were billed
            const hours = Number(item.quantity) || 0;
            // This is a simplified approach - you might want to track this better
          }
        });
      }
    });

    // For now, we'll calculate billed hours proportionally based on billable hours
    const totalBillableHours = billableTimesheets.reduce((sum: number, ts: any) => sum + Number(ts.hours), 0);
    const totalBilledHours = hours.billedHours;
    
    userMap.forEach((userStat, userKey) => {
      if (totalBillableHours > 0) {
        userStat.billedHours = (userStat.billableHours / totalBillableHours) * totalBilledHours;
      }
    });

    return Array.from(userMap.values());
  };

  const userStats = calculateUserStats();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Calculate chart data based on time range and chart view
  const chartData = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    // Determine date range based on timeRange
    switch (timeRange) {
      case 'week':
        startDate = startOfWeek(now, { weekStartsOn: 1 });
        endDate = now; // End at current date, not end of week
        break;
      case 'month':
        startDate = startOfMonth(now);
        endDate = now; // End at current date, not end of month (history is in past)
        break;
      case 'quarter':
        // Show past 4 months from now (from 3 months ago to now = 4 months total)
        startDate = startOfMonth(subMonths(now, 3));
        endDate = now; // End at current date (history is in past, not future)
        break;
      case 'year':
        startDate = startOfYear(now);
        endDate = now; // End at current date, not end of year
        break;
      default: // 'all'
        startDate = new Date(0); // Beginning of time
        endDate = now;
    }

    // Create date map for the range
    const dateMap = new Map<string, { billable: number; unbilled: number; billed: number }>();
    const dateKeyMap = new Map<string, Date>(); // Store actual date objects for sorting
    
    // Initialize all dates in range with zero values
    const dates: Date[] = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    dates.forEach(date => {
      const dateKey = format(date, 'dd MMM');
      dateMap.set(dateKey, { billable: 0, unbilled: 0, billed: 0 });
      dateKeyMap.set(dateKey, date); // Store the actual date object for sorting
    });

    // Process billable timesheets
    const billableTimesheets = billableData?.timesheets || [];
    billableTimesheets.forEach((ts: any) => {
      const tsDate = new Date(ts.date);
      if (isWithinInterval(tsDate, { start: startDate, end: endDate })) {
        const dateKey = format(tsDate, 'dd MMM');
        const hours = Number(ts.hours) || 0;
        const existing = dateMap.get(dateKey) || { billable: 0, unbilled: 0, billed: 0 };
        existing.billable += hours;
        dateMap.set(dateKey, existing);
      }
    });

    // Process billed hours from invoices and quotes
    const isTimesheetItem = (item: any) => {
      if (item.type && item.type.toUpperCase() === 'HEADER') return false;
      if (item.type && item.type.toUpperCase() === 'TIMESHEET') return true;
      if (item.name && typeof item.name === 'string') {
        const nameLower = item.name.toLowerCase();
        if (nameLower.includes('work on') || nameLower.startsWith('work on')) return true;
      }
      return false;
    };

    // Process invoices
    projectInvoices.forEach((invoice: any) => {
      const invoiceDate = new Date(invoice.issueDate);
      if (isWithinInterval(invoiceDate, { start: startDate, end: endDate })) {
        if (invoice.items && Array.isArray(invoice.items)) {
          invoice.items.forEach((item: any) => {
            if (isTimesheetItem(item)) {
              const hours = Number(item.quantity) || 0;
              const dateKey = format(invoiceDate, 'dd MMM');
              if (!dateKeyMap.has(dateKey)) {
                dateKeyMap.set(dateKey, invoiceDate);
              }
              const existing = dateMap.get(dateKey) || { billable: 0, unbilled: 0, billed: 0 };
              existing.billed += hours;
              dateMap.set(dateKey, existing);
            }
          });
        }
      }
    });

    // Process quotes (only non-converted ones)
    projectQuotes.forEach((quote: any) => {
      if (!quote.convertedToInvoice && !quote.invoiceId) {
        const quoteDate = new Date(quote.issueDate);
        if (isWithinInterval(quoteDate, { start: startDate, end: endDate })) {
          if (quote.items && Array.isArray(quote.items)) {
            quote.items.forEach((item: any) => {
              if (isTimesheetItem(item)) {
                const hours = Number(item.quantity) || 0;
                const dateKey = format(quoteDate, 'dd MMM');
                if (!dateKeyMap.has(dateKey)) {
                  dateKeyMap.set(dateKey, quoteDate);
                }
                const existing = dateMap.get(dateKey) || { billable: 0, unbilled: 0, billed: 0 };
                existing.billed += hours;
                dateMap.set(dateKey, existing);
              }
            });
          }
        }
      }
    });

    // Calculate unbilled hours
    dateMap.forEach((value, key) => {
      value.unbilled = value.billable - value.billed;
    });

    // Convert to array and format for chart, sorted by date
    // Use the stored date objects from dateKeyMap for accurate sorting
    const chartDataArray = Array.from(dateMap.entries())
      .map(([dateKey, values]) => {
        // Get the actual date object we stored earlier, or parse it if not found
        let dateObj = dateKeyMap.get(dateKey);
        if (!dateObj) {
          // Fallback: parse the date key (shouldn't happen, but just in case)
          const dateParts = dateKey.split(' ');
          const day = parseInt(dateParts[0]);
          const monthStr = dateParts[1];
          const monthMap: { [key: string]: number } = {
            'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
            'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
          };
          const month = monthMap[monthStr] || 0;
          dateObj = new Date(now.getFullYear(), month, day);
        }
        
        return {
          date: dateKey,
          dateObj,
          'Billable Hours': Number(values.billable.toFixed(2)),
          'Unbilled Hours': Number(values.unbilled.toFixed(2)),
          'Billed Hours': Number(values.billed.toFixed(2)),
        };
      })
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
      .map(({ dateObj, ...rest }) => rest); // Remove dateObj from final data

    return chartDataArray;
  }, [timeRange, billableData, projectInvoices, projectQuotes]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Project not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/projects')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate(`/projects/${id}/edit`)}
            className="btn-secondary flex items-center space-x-2"
          >
            <PencilIcon className="w-4 h-4" />
            <span>Edit</span>
          </button>
          <button
            onClick={() => navigate(`/timesheets/new?projectId=${id}`)}
            className="btn-primary flex items-center space-x-2"
          >
            <ClockIcon className="w-4 h-4" />
            <span style={{ width: 'max-content' }}>Log Time</span>
          </button>
          <ModernDropdown
            options={[
              { value: 'quote', label: 'Create Quote' },
              { value: 'invoice', label: 'Create Invoice' },
            ]}
            value=""
            onChange={(value) => {
              if (value === 'quote') {
                navigate(`/quotes/new?projectId=${id}`);
              } else if (value === 'invoice') {
                navigate(`/invoices/new?projectId=${id}`);
              }
            }}
            placeholder="New Transaction"
            className="w-48"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {(['overview', 'timesheet', 'invoice'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Project Information and Chart - Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-[35%_65%] gap-6">
            {/* Project Information */}
            <div className="card">
              <div className="flex flex-col">
                <div className="flex items-start space-x-4 mb-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <FolderIcon className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900 mb-1">{project.name}</h2>
                    <div className="flex items-center space-x-2 mt-2">
                      <UserIcon className="w-5 h-5 text-gray-500" />
                      <span 
                        onClick={() => project.contact?.id && navigate(`/contacts/${project.contact.id}`)}
                        className="text-base text-primary-600 hover:underline cursor-pointer font-medium"
                      >
                        {project.contact?.name}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4 pt-4 border-t border-gray-200">
                  <div className="flex items-start">
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Project Code</div>
                      <div className="text-base font-medium text-gray-900">{project.id.slice(0, 8).toUpperCase()}</div>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Billing Method</div>
                      <div className="text-base font-medium text-gray-900">Hourly Rate Per Project</div>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Rate Per Hour</div>
                      <div className="text-base font-medium text-gray-900">{formatCurrency(Number(project.hourlyRate))}</div>
                    </div>
                  </div>
                  {project.startDate && (
                    <div className="flex items-start">
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Start Date</div>
                        <div className="flex items-center space-x-2">
                          <CalendarIcon className="w-5 h-5 text-gray-400" />
                          <span className="text-base font-medium text-gray-900">{formatDate(project.startDate)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  {project.endDate && (
                    <div className="flex items-start">
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">End Date</div>
                        <div className="flex items-center space-x-2">
                          <CalendarIcon className="w-5 h-5 text-gray-400" />
                          <span className="text-base font-medium text-gray-900">{formatDate(project.endDate)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Quotes & Invoices Counts */}
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Quotes & Invoices</div>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <DocumentTextIcon className="w-5 h-5 text-gray-400" />
                        <span className="text-base font-medium text-gray-900">Quotes: {projectQuotes.length}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <DocumentTextIcon className="w-5 h-5 text-gray-400" />
                        <span className="text-base font-medium text-gray-900">Invoices: {projectInvoices.length}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Dashboard Watchlist</div>
                      <div className="flex items-center space-x-2">
                        <StarIcon className={`w-5 h-5 ${project?.addToDashboard ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'}`} />
                        <span className={`text-base font-medium ${project?.addToDashboard ? 'text-gray-900' : 'text-gray-500'}`}>
                          {project?.addToDashboard ? 'Selected' : 'Not Selected'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Project Hours & Profitability Summary */}
            <div className="card flex flex-col">
              <div className="flex items-center justify-between mb-6">
              <div className="flex space-x-4 border-b border-gray-200">
                <button
                  onClick={() => setChartView('projectHours')}
                  className={`py-2 px-1 border-b-2 text-sm font-medium transition-colors ${
                    chartView === 'projectHours'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Project Hours
                </button>
                <button
                  onClick={() => setChartView('profitability')}
                  className={`py-2 px-1 border-b-2 text-sm font-medium transition-colors ${
                    chartView === 'profitability'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Profitability Summary
                </button>
              </div>
              <ModernDropdown
                options={[
                  { value: 'week', label: 'This Week' },
                  { value: 'month', label: 'This Month' },
                  { value: 'quarter', label: 'This Quarter' },
                  { value: 'year', label: 'This Year' },
                  { value: 'all', label: 'All Time' },
                ]}
                value={timeRange}
                onChange={(value) => setTimeRange(value)}
                placeholder="Select time range"
              />
              </div>

              {/* Chart */}
              <div className="h-80 mb-6 flex-shrink-0">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: '#6b7280' }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#6b7280' }}
                      label={{ value: 'Hours', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                    />
                    <Tooltip
                      formatter={(value: number) => [`${value.toFixed(2)} hrs`, '']}
                      labelStyle={{ color: '#374151', fontWeight: 'bold' }}
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                      }}
                    />
                    <Legend />
                    {chartView === 'projectHours' ? (
                      <>
                        <Bar dataKey="Billable Hours" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Unbilled Hours" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      </>
                    ) : (
                      <Bar dataKey="Billed Hours" fill="#10b981" radius={[4, 4, 0, 0]} />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200">
                  <p className="text-gray-400 text-sm">No data available for the selected time range</p>
                </div>
              )}
              </div>

              {/* Hours Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Logged Hours</div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{formatHours(hours.loggedHours)}</div>
                <div className="text-sm text-gray-500">{formatCurrency(hours.loggedAmount)}</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Billable Hours</div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{formatHours(hours.billableHours)}</div>
                <div className="text-sm text-gray-500">{formatCurrency(hours.billableAmount)}</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Billed Hours</div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{formatHours(hours.billedHours)}</div>
                <div className="text-sm text-gray-500">{formatCurrency(hours.billedAmount)}</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Unbilled Hours</div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{formatHours(hours.unbilledHours)}</div>
                <div className="text-sm text-gray-500">{formatCurrency(hours.unbilledAmount)}</div>
              </div>
              </div>
            </div>
          </div>

          {/* Users Section */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Users</h3>
              <button
                onClick={() => navigate(`/timesheets/new?projectId=${id}`)}
                className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center space-x-1"
              >
                <PlusIcon className="w-4 h-4" />
                <span>Add User</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      NAME
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      LOGGED HOURS
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      BILLED HOURS
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      UNBILLED HOURS
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {userStats.length > 0 ? (
                    userStats.map((userStat, index) => {
                      const unbilledHours = userStat.billableHours - userStat.billedHours;
                      return (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{userStat.name}</div>
                              {userStat.email && (
                                <div className="text-sm text-gray-500">{userStat.email}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatHours(userStat.loggedHours)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatHours(userStat.billedHours)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatHours(unbilledHours)}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                        No timesheet entries found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'timesheet' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Timesheet Entries</h2>
          </div>

          <div className="table-container">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Hours
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Billable
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {timesheetsData?.timesheets?.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <ClockIcon className="h-8 w-8 text-gray-400" />
                          </div>
                          <h3 className="text-sm font-semibold text-gray-900 mb-1">No timesheets found</h3>
                          <p className="text-sm text-gray-500">No time entries have been logged for this project yet.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    timesheetsData?.timesheets?.map((timesheet: any) => {
                      // Get user name: prioritize customUserName, then contact, then user
                      let userName = 'Unknown User';
                      let userEmail: string | undefined;
                      
                      if (timesheet.customUserName && timesheet.customUserName.trim()) {
                        userName = timesheet.customUserName;
                      } else if (timesheet.contact?.name) {
                        userName = timesheet.contact.name;
                        userEmail = timesheet.contact.email;
                      } else if (timesheet.user?.name) {
                        userName = timesheet.user.name;
                        userEmail = timesheet.user.email;
                      }
                      
                      return (
                        <tr key={timesheet.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{userName}</div>
                              {userEmail && (
                                <div className="text-sm text-gray-500">{userEmail}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600">
                              {new Date(timesheet.date).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-900">{timesheet.hours} hrs</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {timesheet.billable ? (
                              <span className="badge badge-success inline-flex items-center">
                                <CheckCircleIcon className="w-4 h-4 mr-1" />
                                Billable
                              </span>
                            ) : (
                              <span className="badge badge-gray">Non-billable</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-600 max-w-xs truncate">
                              {timesheet.description || <span className="text-gray-400">-</span>}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'invoice' && (
        <div className="space-y-4">
          {/* Invoices Section */}
          <div className="card">
            <button
              onClick={() => toggleSection('invoices')}
              className="w-full flex items-center justify-between py-2 hover:bg-gray-50 -mx-4 px-4 rounded-t-lg transition-colors"
            >
              <h3 className="text-base font-semibold text-gray-900">Invoices</h3>
              <div className="flex items-center space-x-2">
                {expandedSections.has('invoices') && (
                  <div onClick={(e) => e.stopPropagation()}>
                    <ModernDropdown
                      options={[
                        { value: 'all', label: 'Status: All' },
                        { value: 'DRAFT', label: 'Draft' },
                        { value: 'SENT', label: 'Sent' },
                        { value: 'PAID', label: 'Paid' },
                        { value: 'OVERDUE', label: 'Overdue' },
                      ]}
                      value={invoiceStatusFilter}
                      onChange={(value) => setInvoiceStatusFilter(value)}
                      placeholder="Status: All"
                      className="w-40"
                    />
                  </div>
                )}
                {expandedSections.has('invoices') ? (
                  <ChevronUpIcon className="w-5 h-5 text-gray-600" />
                ) : (
                  <ChevronDownIcon className="w-5 h-5 text-gray-600" />
                )}
              </div>
            </button>

            {expandedSections.has('invoices') && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        DATE
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        INVOICE#
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        REFERENCE#
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        PROJECT FEE
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        AMOUNT
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        BALANCE DUE
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        STATUS
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                          No invoices found
                        </td>
                      </tr>
                    ) : (
                      filteredInvoices.map((invoice: any) => {
                        const balanceDue = Number(invoice.total) - Number(invoice.paidAmount || 0);
                        return (
                          <tr key={invoice.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(invoice.issueDate)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Link
                                to={`/invoices/${invoice.id}`}
                                className="text-sm text-primary-600 hover:text-primary-900 hover:underline"
                              >
                                {invoice.invoiceNumber}
                              </Link>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {invoice.quote?.quoteNumber || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(Number(invoice.total))}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(Number(invoice.total))}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(balanceDue)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`text-sm font-medium ${getInvoiceStatusColor(invoice.status)}`}>
                                {invoice.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
                {filteredInvoices.length > 0 && (
                  <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                    <span>Total Count: {filteredInvoices.length}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quotes Section */}
          <div className="card">
            <button
              onClick={() => toggleSection('quotes')}
              className="w-full flex items-center justify-between py-2 hover:bg-gray-50 -mx-4 px-4 rounded-t-lg transition-colors"
            >
              <h3 className="text-base font-semibold text-gray-900">Quotes</h3>
              <div className="flex items-center space-x-2">
                {expandedSections.has('quotes') && (
                  <div onClick={(e) => e.stopPropagation()}>
                    <ModernDropdown
                      options={[
                        { value: 'all', label: 'Status: All' },
                        { value: 'DRAFT', label: 'Draft' },
                        { value: 'SENT', label: 'Sent' },
                        { value: 'ACCEPTED', label: 'Accepted' },
                        { value: 'INVOICED', label: 'Invoiced' },
                        { value: 'REJECTED', label: 'Rejected' },
                        { value: 'EXPIRED', label: 'Expired' },
                      ]}
                      value={quoteStatusFilter}
                      onChange={(value) => setQuoteStatusFilter(value)}
                      placeholder="Status: All"
                      className="w-40"
                    />
                  </div>
                )}
                {expandedSections.has('quotes') ? (
                  <ChevronUpIcon className="w-5 h-5 text-gray-600" />
                ) : (
                  <ChevronDownIcon className="w-5 h-5 text-gray-600" />
                )}
              </div>
            </button>

            {expandedSections.has('quotes') && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        DATE
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        QUOTE#
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        REFERENCE#
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        AMOUNT
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        STATUS
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredQuotes.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                          No quotes found
                        </td>
                      </tr>
                    ) : (
                      filteredQuotes.map((quote: any) => (
                        <tr key={quote.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(quote.issueDate)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Link
                              to={`/quotes/${quote.id}`}
                              className="text-sm text-primary-600 hover:text-primary-900 hover:underline"
                            >
                              {quote.quoteNumber}
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {quote.invoice?.invoiceNumber || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(Number(quote.total))}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-sm font-medium ${getQuoteStatusColor(quote.status)}`}>
                              {quote.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                {filteredQuotes.length > 0 && (
                  <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                    <span>Total Count: {filteredQuotes.length}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;

