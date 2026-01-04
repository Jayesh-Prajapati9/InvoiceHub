import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePageTitle } from '../../hooks/usePageTitle';
import {
  HomeIcon,
  UserGroupIcon,
  CubeIcon,
  DocumentTextIcon,
  ReceiptRefundIcon,
  FolderIcon,
  ClockIcon,
  DocumentDuplicateIcon,
  UsersIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  Cog6ToothIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  UserGroupIcon as UserGroupIconSolid,
  CubeIcon as CubeIconSolid,
  DocumentTextIcon as DocumentTextIconSolid,
  ReceiptRefundIcon as ReceiptRefundIconSolid,
  FolderIcon as FolderIconSolid,
  ClockIcon as ClockIconSolid,
  DocumentDuplicateIcon as DocumentDuplicateIconSolid,
  UsersIcon as UsersIconSolid,
} from '@heroicons/react/24/solid';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Set dynamic page title
  usePageTitle();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: HomeIcon, iconSolid: HomeIconSolid },
    { path: '/contacts', label: 'Contacts', icon: UserGroupIcon, iconSolid: UserGroupIconSolid },
    { path: '/items', label: 'Items', icon: CubeIcon, iconSolid: CubeIconSolid },
    { path: '/quotes', label: 'Quotes', icon: DocumentTextIcon, iconSolid: DocumentTextIconSolid },
    { path: '/invoices', label: 'Invoices', icon: ReceiptRefundIcon, iconSolid: ReceiptRefundIconSolid },
    { path: '/projects', label: 'Projects', icon: FolderIcon, iconSolid: FolderIconSolid },
    { path: '/timesheets', label: 'Timesheets', icon: ClockIcon, iconSolid: ClockIconSolid },
    { path: '/templates', label: 'Templates', icon: DocumentDuplicateIcon, iconSolid: DocumentDuplicateIconSolid },
    ...(user?.role === 'ADMIN' ? [{ path: '/users', label: 'Users & Roles', icon: UsersIcon, iconSolid: UsersIconSolid }] : []),
  ];

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-200"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 bg-white border-r border-gray-200 transform transition-all duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0 shadow-xl z-50 w-64' : '-translate-x-full w-64'
        } ${
          sidebarCollapsed && !sidebarOpen ? 'lg:w-16 lg:translate-x-0' : 'lg:w-64 lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className={`flex items-center border-b border-gray-200 ${sidebarCollapsed && !sidebarOpen ? 'lg:flex-col lg:py-3 lg:space-y-2 lg:h-auto' : 'justify-between h-16'}`}>
            {sidebarCollapsed && !sidebarOpen ? (
              <>
                <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center lg:mx-auto">
                  <span className="text-white font-bold text-xs">IH</span>
                </div>
                <button
                  onClick={() => setSidebarCollapsed(false)}
                  className="hidden lg:flex text-gray-500 hover:text-gray-700 p-1 rounded-md hover:bg-gray-100 transition-colors"
                  title="Expand sidebar"
                >
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center space-x-3 px-6">
                  <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xs">IH</span>
                  </div>
                  <span className="text-base font-semibold text-gray-900">Invoice Hub</span>
                </div>
                <div className="flex items-center gap-2 px-2">
                  <button
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className="hidden lg:flex text-gray-500 hover:text-gray-700 p-1 rounded-md hover:bg-gray-100 transition-colors"
                    title="Collapse sidebar"
                  >
                    <ChevronLeftIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="lg:hidden text-gray-500 hover:text-gray-700 p-1 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Navigation */}
          <nav className={`flex-1 py-4 space-y-1 overflow-y-auto ${sidebarCollapsed && !sidebarOpen ? 'lg:px-2' : 'px-3'}`}>
            {menuItems.map((item) => {
              const Icon = isActive(item.path) ? item.iconSolid : item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`group flex items-center gap-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    sidebarCollapsed && !sidebarOpen ? 'lg:justify-center lg:px-0' : 'px-3'
                  } ${
                    active
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  title={sidebarCollapsed && !sidebarOpen ? item.label : ''}
                >
                  <Icon className="w-6 h-6 flex-shrink-0" />
                  {(!sidebarCollapsed || sidebarOpen) && (
                    <span>{item.label}</span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className={`border-t border-gray-200 ${sidebarCollapsed && !sidebarOpen ? 'lg:p-2' : 'p-4'}`}>
            {(!sidebarCollapsed || sidebarOpen) ? (
              <>
                <div className="flex items-center space-x-3 mb-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold text-xs">
                      {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{user?.name || 'User'}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <button
                    onClick={() => navigate('/settings')}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      location.pathname === '/settings'
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Cog6ToothIcon className="w-5 h-5" />
                    <span>Settings</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ArrowRightOnRectangleIcon className="w-5 h-5" />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-1">
                <button
                  onClick={() => navigate('/settings')}
                  className="w-full flex items-center justify-center py-2 text-sm font-medium rounded-lg transition-colors text-gray-700 hover:bg-gray-100"
                  title="Settings"
                >
                  <Cog6ToothIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Logout"
                >
                  <ArrowRightOnRectangleIcon className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className={`transition-all duration-200 ${sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'}`}>
        {/* Top bar - only show on mobile */}
        <header className="lg:hidden sticky top-0 z-20 bg-white border-b border-gray-200">
          <div className="flex items-center h-14 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-600 hover:text-gray-900 p-2 rounded-md hover:bg-gray-100 transition-colors"
            >
              <Bars3Icon className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
