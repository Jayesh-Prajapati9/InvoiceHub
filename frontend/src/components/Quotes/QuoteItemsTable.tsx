import { UseFieldArrayReturn, UseFormRegister, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import ItemSelectDropdown from '../ItemSelectDropdown';

interface QuoteItem {
  itemId?: string;
  name: string;
  description?: string;
  quantity: number;
  rate: number;
  taxRate: number;
}

interface QuoteItemsTableProps {
  fields: UseFieldArrayReturn<any, 'items'>;
  register: UseFormRegister<any>;
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
  items: any[];
  onItemSelect: (index: number, item: any) => void;
}

const QuoteItemsTable = ({ fields, register, watch, setValue, items, onItemSelect }: QuoteItemsTableProps) => {
  // Watch the items array for real-time updates
  const watchedItems = watch('items') || [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const calculateItemTotal = (item: QuoteItem | any, index: number) => {
    // Use watched values for real-time calculation
    const watchedItem = watchedItems[index] || item;
    const quantity = Number(watchedItem?.quantity || 0);
    const rate = Number(watchedItem?.rate || 0);
    const taxRate = Number(watchedItem?.taxRate || 0);
    const amount = quantity * rate;
    const tax = (amount * taxRate) / 100;
    return amount + tax;
  };

  const calculateSubtotal = () => {
    return watchedItems.reduce((sum: number, item: any) => {
      // Skip headers in calculations
      if (item?.type === 'HEADER') return sum;
      const quantity = Number(item?.quantity || 0);
      const rate = Number(item?.rate || 0);
      return sum + (quantity * rate);
    }, 0);
  };

  const calculateTax = () => {
    return watchedItems.reduce((sum: number, item: any) => {
      // Skip headers in calculations
      if (item?.type === 'HEADER') return sum;
      const quantity = Number(item?.quantity || 0);
      const rate = Number(item?.rate || 0);
      const taxRate = Number(item?.taxRate || 0);
      const amount = quantity * rate;
      return sum + (amount * taxRate) / 100;
    }, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  return (
    <div className="mt-6">
      <div className="bg-white shadow rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                ITEM
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                QTY
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                RATE
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                TAX %
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                TOTAL
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                ACTIONS
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {fields.fields.map((field, index) => {
              const item = fields.fields[index];
              const currentItemId = watch(`items.${index}.itemId`) || '';
              const itemType = watch(`items.${index}.type`) || 'ITEM';
              const isTimesheet = itemType === 'TIMESHEET';
              const isHeader = itemType === 'HEADER';
              const isReadOnly = isTimesheet || isHeader;
              
              return (
                <tr key={field.id} className={`hover:bg-gray-50 transition-colors ${isHeader ? 'bg-gray-100' : ''} ${isReadOnly ? 'bg-gray-50' : ''}`}>
                  <td className="px-6 py-4" colSpan={isHeader ? 6 : 1}>
                    {isHeader ? (
                      <div>
                        <input
                          {...register(`items.${index}.name`)}
                          placeholder="Add New Header"
                          className="input-field text-sm w-full font-semibold text-gray-900 bg-transparent border-0 focus:ring-0 focus:border-b-2 focus:border-gray-900"
                        />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {!isReadOnly && (
                          <div className="relative z-10">
                            <ItemSelectDropdown
                              items={items || []}
                              value={currentItemId}
                              onSelect={(selectedItem) => {
                                if (selectedItem) {
                                  setValue(`items.${index}.itemId`, selectedItem.id);
                                  setValue(`items.${index}.name`, selectedItem.name);
                                  setValue(`items.${index}.description`, selectedItem.description || '');
                                  setValue(`items.${index}.rate`, Number(selectedItem.rate));
                                  setValue(`items.${index}.taxRate`, Number(selectedItem.taxRate));
                                  onItemSelect(index, selectedItem);
                                } else {
                                  setValue(`items.${index}.itemId`, '');
                                }
                              }}
                              placeholder="Type or click to select an item"
                            />
                          </div>
                        )}
                        <input
                          {...register(`items.${index}.name`)}
                          placeholder="Item name"
                          disabled={isReadOnly}
                          className={`input-field text-sm w-full ${isReadOnly ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''}`}
                        />
                        {isTimesheet && watchedItems[index]?.description && (
                          <p className="text-xs text-gray-500 mt-1">{watchedItems[index].description}</p>
                        )}
                      </div>
                    )}
                  </td>
                  {!isHeader && (
                    <>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                          disabled={isReadOnly}
                          className={`input-field text-sm w-20 ${isReadOnly ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''}`}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          {...register(`items.${index}.rate`, { valueAsNumber: true })}
                          disabled={isReadOnly}
                          className={`input-field text-sm w-28 ${isReadOnly ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''}`}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          {...register(`items.${index}.taxRate`, { valueAsNumber: true })}
                          disabled={isReadOnly}
                          className={`input-field text-sm w-20 ${isReadOnly ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''}`}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(calculateItemTotal(item, index))}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {!isReadOnly && (
                          <button
                            type="button"
                            onClick={() => fields.remove(index)}
                            className="text-red-600 hover:text-red-900 text-sm font-medium transition-colors"
                          >
                            Remove
                          </button>
                        )}
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <div className="w-80 bg-gray-50 border border-gray-200 p-6 rounded-lg">
          <div className="flex justify-between mb-3">
            <span className="text-sm text-gray-600">Subtotal:</span>
            <span className="text-sm font-medium text-gray-900">{formatCurrency(calculateSubtotal())}</span>
          </div>
          <div className="flex justify-between mb-3">
            <span className="text-sm text-gray-600">Tax:</span>
            <span className="text-sm font-medium text-gray-900">{formatCurrency(calculateTax())}</span>
          </div>
          <div className="flex justify-between pt-3 border-t border-gray-300">
            <span className="text-base font-semibold text-gray-900">Total:</span>
            <span className="text-base font-semibold text-primary-600">{formatCurrency(calculateTotal())}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuoteItemsTable;
