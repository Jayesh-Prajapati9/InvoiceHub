import { InformationCircleIcon, XMarkIcon, ExclamationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'info' | 'error' | 'success' | 'warning';
  buttonText?: string;
}

const AlertModal = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  buttonText = 'OK',
}: AlertModalProps) => {
  if (!isOpen) return null;

  const iconConfig = {
    info: {
      icon: InformationCircleIcon,
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    error: {
      icon: ExclamationCircleIcon,
      bgColor: 'bg-red-100',
      iconColor: 'text-red-600',
    },
    success: {
      icon: CheckCircleIcon,
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600',
    },
    warning: {
      icon: ExclamationCircleIcon,
      bgColor: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
    },
  };

  const config = iconConfig[type];
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative transform overflow-hidden rounded-lg bg-white shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>

          {/* Content */}
          <div className="bg-white px-6 pb-8 pt-8 sm:p-10 sm:pb-10">
            <div className="sm:flex sm:items-start">
              <div className={`mx-auto flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full ${config.bgColor} sm:mx-0 sm:h-12 sm:w-12`}>
                <Icon className={`h-7 w-7 ${config.iconColor} sm:h-6 sm:w-6`} />
              </div>
              <div className="mt-4 text-center sm:ml-6 sm:mt-0 sm:text-left">
                <h3 className="text-lg font-semibold leading-6 text-gray-900">
                  {title}
                </h3>
                <div className="mt-4">
                  <p className="text-base text-gray-500 leading-relaxed">{message}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-gray-50 px-6 py-5 sm:flex sm:flex-row-reverse sm:px-8">
            <button
              type="button"
              onClick={onClose}
              className={`inline-flex w-full justify-center rounded-md px-4 py-2.5 text-base font-semibold text-white shadow-sm sm:ml-3 sm:w-auto ${
                type === 'error' 
                  ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                  : type === 'success'
                  ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                  : type === 'warning'
                  ? 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
                  : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
              }`}
            >
              {buttonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;

