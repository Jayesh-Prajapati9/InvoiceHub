import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import {
  UserGroupIcon,
  DocumentTextIcon,
  ReceiptRefundIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ChevronRightIcon,
  CubeIcon,
  FolderIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

const StatCard = ({
  title,
  value,
  icon: Icon,
  change,
  link,
}: {
  title: string;
  value: string | number;
  icon: any;
  change?: string;
  link?: string;
}) => {
  const content = (
    <div className={`card group ${link ? 'cursor-pointer hover:border-gray-300' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-semibold text-gray-900 mb-2">{value}</p>
          {change && (
            <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
              <ArrowTrendingUpIcon className="w-5 h-5" />
              <span>{change}</span>
            </div>
          )}
        </div>
        <div className="p-3 bg-gray-100 rounded-lg">
          <Icon className="w-6 h-6 text-gray-600" />
        </div>
      </div>
    </div>
  );

  if (link) {
    return <Link to={link}>{content}</Link>;
  }

  return content;
};

const QuickActionCard = ({
  title,
  description,
  icon: Icon,
  link,
}: {
  title: string;
  description: string;
  icon: any;
  link: string;
}) => {
  return (
    <Link
      to={link}
      className="group block p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all duration-150"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors">
          <Icon className="w-6 h-6 text-gray-700" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900">{title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
        <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all" />
      </div>
    </Link>
  );
};

const Dashboard = () => {
  const { data: contactsData, isLoading: contactsLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const res = await api.get('/contacts?limit=1');
      return res.data.data;
    },
  });

  const { data: quotesData, isLoading: quotesLoading } = useQuery({
    queryKey: ['quotes', 'dashboard'],
    queryFn: async () => {
      const res = await api.get('/quotes?limit=1000');
      return res.data.data;
    },
  });

  const { data: invoicesData, isLoading: invoicesLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const res = await api.get('/invoices');
      return res.data.data;
    },
  });

  const { data: activitiesData, isLoading: activitiesLoading } = useQuery({
    queryKey: ['recentActivities'],
    queryFn: async () => {
      const res = await api.get('/dashboard/recent-activities?limit=5');
      return res.data.data;
    },
  });

  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects', 'dashboard', 'active'],
    queryFn: async () => {
      const res = await api.get('/projects?limit=1000');
      return res.data.data;
    },
  });

  // Get all active projects (for checking if any exist)
  const allActiveProjects = useMemo(() => {
    if (!projectsData?.projects) return [];
    return projectsData.projects.filter((p: any) => p.status === 'ACTIVE');
  }, [projectsData?.projects]);

  // Filter projects that have addToDashboard set to true and status is ACTIVE
  const activeProjects = useMemo(() => {
    if (!projectsData?.projects) return [];
    return projectsData.projects.filter((p: any) => p.status === 'ACTIVE' && p.addToDashboard === true);
  }, [projectsData?.projects]);

  const activeProjectIds = useMemo(() => {
    if (activeProjects.length === 0) return 'none';
    return activeProjects.map((p: any) => p.id).join(',');
  }, [activeProjects]);

  const { data: projectsWithHours } = useQuery({
    queryKey: ['projects', 'unbilled-hours', activeProjectIds],
    queryFn: async () => {
        const currentActiveProjects = projectsData?.projects?.filter((p: any) => p.status === 'ACTIVE' && p.addToDashboard === true) || [];
      if (currentActiveProjects.length === 0) return [];
      
      const projectsDataWithHours = await Promise.all(
        currentActiveProjects.map(async (project: any) => {
          try {
            const billableRes = await api.get(`/timesheets/project/${project.id}/billable`);
            const billableHours = billableRes.data.data.totalHours || 0;

            const invoicesRes = await api.get(`/invoices?projectId=${project.id}`);
            const quotesRes = await api.get(`/quotes?projectId=${project.id}`);
            
            const invoices = invoicesRes.data.data.invoices || [];
            const quotes = quotesRes.data.data.quotes || [];

            let billedHours = 0;
            const isTimesheetItem = (item: any) => {
              if (item.type && item.type.toUpperCase() === 'HEADER') return false;
              if (item.type && item.type.toUpperCase() === 'TIMESHEET') return true;
              if (item.name && typeof item.name === 'string') {
                const nameLower = item.name.toLowerCase();
                if (nameLower.includes('work on') || nameLower.startsWith('work on')) return true;
              }
              return false;
            };

            invoices.forEach((invoice: any) => {
              if (invoice.items && Array.isArray(invoice.items)) {
                invoice.items.forEach((item: any) => {
                  if (isTimesheetItem(item)) {
                    billedHours += Number(item.quantity) || 0;
                  }
                });
              }
            });

            quotes.forEach((quote: any) => {
              if (!quote.convertedToInvoice && !quote.invoiceId) {
                if (quote.items && Array.isArray(quote.items)) {
                  quote.items.forEach((item: any) => {
                    if (isTimesheetItem(item)) {
                      billedHours += Number(item.quantity) || 0;
                    }
                  });
                }
              }
            });

            const unbilledHours = Math.max(0, billableHours - billedHours);
            const hourlyRate = project.hourlyRate || 0;
            const unbilledAmount = unbilledHours * hourlyRate;
            
            // Calculate progress based on days (start date to end date)
            let progress = 0;
            if (project.startDate && project.endDate) {
              const startDate = new Date(project.startDate);
              const endDate = new Date(project.endDate);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              
              const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
              const daysElapsed = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
              
              if (totalDays > 0) {
                progress = (daysElapsed / totalDays) * 100;
              } else {
                progress = 100; // Same start and end date means completed
              }
              
              // If project has ended, show 100%, if not started yet, show 0%
              if (today > endDate) {
                progress = 100;
              } else if (today < startDate) {
                progress = 0;
              }
            } else if (billableHours > 0) {
              // Fallback to old calculation if dates are not available
              progress = (billedHours / billableHours) * 100;
            }

            return {
              ...project,
              billableHours,
              billedHours,
              unbilledHours,
              unbilledAmount,
              progress: Math.min(100, Math.max(0, progress)),
            };
          } catch (error) {
            return {
              ...project,
              billableHours: 0,
              billedHours: 0,
              unbilledHours: 0,
              unbilledAmount: 0,
              progress: 0,
            };
          }
        })
      );
      return projectsDataWithHours;
    },
    enabled: !!projectsData && activeProjectIds !== 'none' && activeProjects.length > 0,
  });

  const totalBilledHours = useMemo(() => {
    return projectsWithHours?.reduce((sum: number, p: any) => sum + (p.billedHours || 0), 0) || 0;
  }, [projectsWithHours]);

  const totalBilledExpenses = useMemo(() => {
    return projectsWithHours?.reduce((sum: number, p: any) => {
      const billedAmount = (p.billedHours || 0) * (p.hourlyRate || 0);
      return sum + billedAmount;
    }, 0) || 0;
  }, [projectsWithHours]);

  const formatHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const displayProjects = projectsWithHours || activeProjects;

  if (contactsLoading || quotesLoading || invoicesLoading || activitiesLoading || projectsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const contactsCount = contactsData?.pagination?.total || 0;
  const quotesCount = quotesData?.pagination?.total || 0;
  const invoices = invoicesData?.invoices || [];
  const pendingInvoices = invoices.filter((inv: any) => inv.status === 'SENT').length;
  const overdueInvoices = invoices.filter((inv: any) => inv.status === 'OVERDUE').length;
  const paidInvoices = invoices.filter((inv: any) => inv.status === 'PAID').length;
  const draftInvoices = invoices.filter((inv: any) => inv.status === 'DRAFT').length;

  const totalRevenue = invoices.reduce(
    (sum: number, inv: any) => sum + Number(inv.paidAmount || 0),
    0
  ) || 0;

  const quotes = quotesData?.quotes || [];
  const expiredQuotes = quotes.filter((q: any) => {
    if (q.status === 'SENT' && q.expiryDate) {
      const expiryDate = new Date(q.expiryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      expiryDate.setHours(0, 0, 0, 0);
      return expiryDate < today;
    }
    return false;
  }).length;
  
  const draftQuotes = quotes.filter((q: any) => q.status === 'DRAFT').length;
  const invoicedQuotes = quotes.filter((q: any) => 
    q.status === 'INVOICED' || q.convertedToInvoice === true || q.invoiceId
  ).length;
  
  const sentQuotes = quotes.filter((q: any) => {
    if (q.status === 'SENT') {
      if (q.expiryDate) {
        const expiryDate = new Date(q.expiryDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        expiryDate.setHours(0, 0, 0, 0);
        if (expiryDate < today) {
          return false;
        }
      }
      return true;
    }
    return false;
  }).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back! Here's an overview of your business.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Contacts"
          value={contactsCount}
          icon={UserGroupIcon}
          link="/contacts"
        />
        <StatCard
          title="Total Quotes"
          value={quotesCount}
          icon={DocumentTextIcon}
          link="/quotes"
        />
        <StatCard
          title="Total Revenue"
          value={new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(totalRevenue)}
          icon={CurrencyDollarIcon}
        />
      </div>

      {/* Quick Actions & Status Breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <QuickActionCard
              title="Create New Contact"
              description="Add a customer or vendor"
              icon={UserGroupIcon}
              link="/contacts/new"
            />
            <QuickActionCard
              title="Create New Quote"
              description="Send a quote to a customer"
              icon={DocumentTextIcon}
              link="/quotes/new"
            />
            <QuickActionCard
              title="Create New Invoice"
              description="Generate and send an invoice"
              icon={ReceiptRefundIcon}
              link="/invoices/new"
            />
            <QuickActionCard
              title="Create New Project"
              description="Start tracking a new project"
              icon={FolderIcon}
              link="/projects/new"
            />
          </div>
        </div>

        {/* Invoice Details */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Invoice Details</h2>
            <Link to="/invoices" className="text-xs font-medium text-gray-600 hover:text-gray-900">
              View all
            </Link>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between py-2.5 px-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2.5">
                <DocumentTextIcon className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-700">Draft</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{draftInvoices}</span>
            </div>
            <div className="flex items-center justify-between py-2.5 px-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2.5">
                <ClockIcon className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-700">Pending</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{pendingInvoices}</span>
            </div>
            <div className="flex items-center justify-between py-2.5 px-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2.5">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
                <span className="text-sm text-gray-700">Overdue</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{overdueInvoices}</span>
            </div>
            <div className="flex items-center justify-between py-2.5 px-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2.5">
                <CheckCircleIcon className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-700">Paid</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{paidInvoices}</span>
            </div>
          </div>
        </div>

        {/* Quote Details */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Quote Details</h2>
            <Link to="/quotes" className="text-xs font-medium text-gray-600 hover:text-gray-900">
              View all
            </Link>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between py-2.5 px-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2.5">
                <DocumentTextIcon className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-700">Draft</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{draftQuotes}</span>
            </div>
            <div className="flex items-center justify-between py-2.5 px-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2.5">
                <ClockIcon className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-700">Sent</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{sentQuotes}</span>
            </div>
            <div className="flex items-center justify-between py-2.5 px-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2.5">
                <CheckCircleIcon className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-700">Invoiced</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{invoicedQuotes}</span>
            </div>
            <div className="flex items-center justify-between py-2.5 px-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2.5">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
                <span className="text-sm text-gray-700">Expired</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{expiredQuotes}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Projects Widget */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-semibold text-gray-900">Projects</h2>
          <Link to="/projects" className="text-xs font-medium text-gray-600 hover:text-gray-900">
            View all
          </Link>
        </div>
        
        {/* Billed Summary */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs font-medium text-gray-500 mb-1">Total Billed Hours</p>
            <p className="text-xl font-semibold text-gray-900">{formatHours(totalBilledHours)}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs font-medium text-gray-500 mb-1">Total Billed Amount</p>
            <p className="text-xl font-semibold text-gray-900">
              {new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(totalBilledExpenses)}
            </p>
          </div>
        </div>

        {/* Projects List */}
        {displayProjects.length > 0 ? (
          <div className="space-y-2">
            {displayProjects.slice(0, 5).map((project: any) => {
              const progress = project.progress || 0;
              
              return (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="block p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative w-10 h-10 flex-shrink-0">
                      <svg className="w-10 h-10 transform -rotate-90">
                        <circle
                          cx="20"
                          cy="20"
                          r="16"
                          stroke="currentColor"
                          strokeWidth="3"
                          fill="none"
                          className="text-gray-200"
                        />
                        <circle
                          cx="20"
                          cy="20"
                          r="16"
                          stroke="currentColor"
                          strokeWidth="3"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 16}`}
                          strokeDashoffset={`${2 * Math.PI * 16 * (1 - progress / 100)}`}
                          className="text-gray-900"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-700 px-1 py-0.5">{Math.round(progress)}%</span>
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{project.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {project.contact?.name || 'Unknown'}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <FolderIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-500">
              {allActiveProjects.length > 0 
                ? 'No project is selected' 
                : 'No active projects'}
            </p>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Recent Activity</h2>
        {activitiesData && activitiesData.length > 0 ? (
          <div className="space-y-4">
            {activitiesData.map((activity: any) => {
              const getIcon = () => {
                switch (activity.type) {
                  case 'contact':
                    return UserGroupIcon;
                  case 'item':
                    return CubeIcon;
                  case 'quote':
                    return DocumentTextIcon;
                  case 'invoice':
                    return ReceiptRefundIcon;
                  case 'payment':
                    return CurrencyDollarIcon;
                  default:
                    return DocumentTextIcon;
                }
              };
              const Icon = getIcon();

              return (
                <div key={activity.id} className="flex items-start gap-3 pb-4 border-b border-gray-200 last:border-0 last:pb-0">
                  <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0">
                    <Icon className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.description}</p>
                    {activity.user && (
                      <p className="text-xs text-gray-500 mt-1">
                        by {activity.user.name || (activity.user.email ? activity.user.email.split('@')[0] : 'Unknown')}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-0.5">
                      {format(new Date(activity.createdAt), 'MMM dd, yyyy hh:mm a')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">No recent activity</h3>
            <p className="text-sm text-gray-500">Your recent actions will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
