import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline';

interface DropdownOption {
  value: string;
  label: string;
}

interface Item {
  id: string;
  name: string;
  description?: string;
  rate?: number;
  taxRate?: number;
}

interface ItemSelectDropdownProps {
  // Support both patterns: options (for simple dropdowns) or items (for item selection)
  options?: DropdownOption[];
  items?: Item[];
  value: string;
  onChange?: (value: string) => void;
  onSelect?: (item: Item | null) => void;
  placeholder?: string;
  className?: string;
}

const ItemSelectDropdown = ({
  options,
  items,
  value,
  onChange,
  onSelect,
  placeholder = 'Custom Item',
  className = '',
}: ItemSelectDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownMenuRef = useRef<HTMLDivElement>(null);
  
  // Support both patterns
  const dropdownOptions = options || (items && Array.isArray(items) ? items.map(item => ({ value: item.id, label: item.name })) : []);
  const selectedOption = dropdownOptions?.find((opt) => opt.value === value);
  const selectedItem = items && Array.isArray(items) ? items.find((item) => item.id === value) : undefined;

  // Close dropdown when clicking outside and handle body scroll lock
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        dropdownMenuRef.current &&
        !dropdownMenuRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      // Prevent body scrolling when dropdown is open
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.body.style.overflow = originalStyle;
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  // Calculate dropdown position
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

  const updateDropdownPosition = () => {
    if (buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: buttonRect.bottom + 8, // Fixed positioning uses viewport coordinates
        left: buttonRect.left,
        width: buttonRect.width,
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition();
      
      // Update position on scroll and resize
      window.addEventListener('scroll', updateDropdownPosition, true);
      window.addEventListener('resize', updateDropdownPosition);
      
      return () => {
        window.removeEventListener('scroll', updateDropdownPosition, true);
        window.removeEventListener('resize', updateDropdownPosition);
      };
    }
  }, [isOpen]);

  return (
    <>
      <div ref={dropdownRef} className={`relative inline-block text-left w-full ${className}`}>
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="btn-secondary w-full flex items-center justify-between gap-2 py-2.5"
        >
          <span className="text-sm font-medium text-gray-700">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDownIcon className="w-4 h-4 text-gray-500 flex-shrink-0" aria-hidden="true" />
        </button>
      </div>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={dropdownMenuRef}
          className="fixed z-[9999] rounded-lg bg-white shadow-xl border border-gray-200"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`,
            maxHeight: '192px',
            overflowY: 'auto',
            overflowX: 'hidden',
            scrollbarWidth: 'thin',
            scrollbarColor: '#cbd5e1 #f1f1f1',
          }}
        >
          <div className="py-1">
            {/* Add "Custom Item" option */}
            <button
              type="button"
              onClick={() => {
                if (onSelect) {
                  onSelect(null);
                } else if (onChange) {
                  onChange('');
                }
                setIsOpen(false);
              }}
              className={`${
                !value ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'
              } flex items-center justify-between w-full px-4 py-2 text-sm transition-colors`}
            >
              <span className="font-medium">{placeholder}</span>
              {!value && (
                <CheckIcon className="w-5 h-5 text-gray-900" aria-hidden="true" />
              )}
            </button>
            
            {dropdownOptions && dropdownOptions.length > 0 && dropdownOptions.map((option) => {
              const isSelected = value === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    if (onSelect && items) {
                      const item = items.find(i => i.id === option.value);
                      onSelect(item || null);
                    } else if (onChange) {
                      onChange(option.value);
                    }
                    setIsOpen(false);
                  }}
                  className={`${
                    isSelected ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'
                  } flex items-center justify-between w-full px-4 py-2 text-sm transition-colors`}
                >
                  <span className="font-medium">{option.label}</span>
                  {isSelected && (
                    <CheckIcon className="w-5 h-5 text-gray-900" aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default ItemSelectDropdown;
