import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const routeTitleMap: Record<string, string> = {
  '/': 'Dashboard',
  '/dashboard': 'Dashboard',
  '/contacts': 'Contacts',
  '/items': 'Items',
  '/quotes': 'Quotes',
  '/invoices': 'Invoices',
  '/projects': 'Projects',
  '/timesheets': 'Timesheets',
  '/templates': 'Templates',
  '/users': 'Users & Roles',
  '/settings': 'Settings',
};

const getPageTitle = (pathname: string): string => {
  // Remove trailing slash
  const cleanPath = pathname.replace(/\/$/, '');
  
  // Handle login and register first
  if (cleanPath === '/login') {
    return 'Login - Invoice Hub';
  }
  if (cleanPath === '/register') {
    return 'Register - Invoice Hub';
  }
  
  // Check for exact matches first
  if (routeTitleMap[cleanPath]) {
    return `${routeTitleMap[cleanPath]} - Invoice Hub`;
  }
  
  // Check for routes with IDs or actions
  const pathSegments = cleanPath.split('/').filter(Boolean);
  
  // Handle form pages (e.g., /contacts/new, /quotes/:id/edit)
  if (pathSegments.length >= 2) {
    const basePath = `/${pathSegments[0]}`;
    if (pathSegments[1] === 'new') {
      if (routeTitleMap[basePath]) {
        const singularName = routeTitleMap[basePath].slice(0, -1); // Remove 's' at the end
        return `New ${singularName} - Invoice Hub`;
      }
    } else if (pathSegments[1] === 'edit') {
      if (routeTitleMap[basePath]) {
        const singularName = routeTitleMap[basePath].slice(0, -1); // Remove 's' at the end
        return `Edit ${singularName} - Invoice Hub`;
      }
    } else if (pathSegments[1] === 'payment') {
      return 'Payment - Invoice Hub';
    }
  }
  
  // Handle detail pages (e.g., /contacts/:id, /quotes/:id)
  // These have 2 segments but the second is an ID (UUID format typically)
  if (pathSegments.length === 2) {
    const basePath = `/${pathSegments[0]}`;
    if (routeTitleMap[basePath]) {
      return `${routeTitleMap[basePath]} - Invoice Hub`;
    }
  }
  
  // Default fallback
  return 'Invoice Hub';
};

export const usePageTitle = () => {
  const location = useLocation();
  
  useEffect(() => {
    const title = getPageTitle(location.pathname);
    document.title = title;
  }, [location.pathname]);
};
