import { ReactNode } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    to: string;
  };
  children?: ReactNode;
}

const PageHeader = ({ title, description, action, children }: PageHeaderProps) => {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
          {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
        </div>
        <div className="flex items-center gap-3">
          {children}
          {action && (
            <Link to={action.to} className="btn-primary inline-flex items-center gap-2">
              <PlusIcon className="w-5 h-5" />
              <span>{action.label}</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default PageHeader;
