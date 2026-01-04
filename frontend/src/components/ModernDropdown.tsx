import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline';

interface DropdownOption {
  value: string;
  label: string;
}

interface ModernDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  icon?: React.ReactNode;
  name?: string; // For react-hook-form compatibility
  disabled?: boolean;
}

const ModernDropdown = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  className = '',
  icon,
  name,
  disabled = false,
}: ModernDropdownProps) => {
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <Menu as="div" className={`relative inline-block text-left w-full ${className}`}>
      <div>
        <Menu.Button 
          className={`w-full flex items-center justify-between gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors duration-200 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={disabled}
        >
          <div className="flex items-center gap-2 flex-1">
            {icon && <span className="flex-shrink-0">{icon}</span>}
            <span className="text-sm font-medium text-gray-700">
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </div>
          <ChevronDownIcon className="w-5 h-5 text-gray-500 flex-shrink-0" aria-hidden="true" />
        </Menu.Button>
      </div>
      {/* Hidden input for react-hook-form */}
      {name && (
        <input type="hidden" name={name} value={value} />
      )}

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute left-0 right-0 z-50 mt-2 w-full origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none max-h-48 overflow-y-auto overscroll-contain" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f1f1' }}>
          <div className="py-1" style={{ pointerEvents: 'auto' }}>
            {options.map((option) => {
              const isSelected = value === option.value;
              return (
                <Menu.Item key={option.value}>
                  {({ active }) => (
                    <button
                      type="button"
                      onClick={() => onChange(option.value)}
                      className={`${
                        active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                      } ${
                        isSelected ? 'bg-primary-50 text-primary-700' : ''
                      } flex items-center justify-between w-full px-4 py-2 text-sm transition-colors`}
                    >
                      <span className="font-medium">{option.label}</span>
                      {isSelected && (
                        <CheckIcon className="w-6 h-6 text-primary-600" aria-hidden="true" />
                      )}
                    </button>
                  )}
                </Menu.Item>
              );
            })}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

export default ModernDropdown;


