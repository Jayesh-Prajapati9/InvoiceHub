import { Link } from 'react-router-dom';
import { MapPinIcon } from '@heroicons/react/24/outline';

interface AddressSectionProps {
  contact: any;
}

const AddressSection = ({ contact }: AddressSectionProps) => {
  const hasBillingAddress =
    contact.billingAddress ||
    contact.billingCity ||
    contact.billingState ||
    contact.billingZipCode ||
    contact.billingCountry;

  const hasShippingAddress =
    contact.shippingAddress ||
    contact.shippingCity ||
    contact.shippingState ||
    contact.shippingZipCode ||
    contact.shippingCountry;

  const formatAddress = (type: 'billing' | 'shipping') => {
    const parts = [];
    if (type === 'billing') {
      if (contact.billingAddress) parts.push(contact.billingAddress);
      if (contact.billingCity) parts.push(contact.billingCity);
      if (contact.billingState) parts.push(contact.billingState);
      if (contact.billingZipCode) parts.push(contact.billingZipCode);
      if (contact.billingCountry) parts.push(contact.billingCountry);
    } else {
      if (contact.shippingAddress) parts.push(contact.shippingAddress);
      if (contact.shippingCity) parts.push(contact.shippingCity);
      if (contact.shippingState) parts.push(contact.shippingState);
      if (contact.shippingZipCode) parts.push(contact.shippingZipCode);
      if (contact.shippingCountry) parts.push(contact.shippingCountry);
    }
    return parts.length > 0 ? parts.join(', ') : null;
  };

  return (
    <div className="card">
      <div className="flex items-center space-x-2 mb-4">
        <MapPinIcon className="w-5 h-5 text-primary-600" />
        <h3 className="text-sm font-semibold text-gray-900">Address</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Billing Address</h4>
          {hasBillingAddress ? (
            <p className="text-sm text-gray-600">{formatAddress('billing')}</p>
          ) : (
            <div>
              <p className="text-sm text-gray-500 mb-1">No Billing Address</p>
              <Link
                to={`/contacts/${contact.id}/edit?tab=address`}
                className="text-sm text-primary-600 hover:text-primary-900 font-medium"
              >
                New Address
              </Link>
            </div>
          )}
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Shipping Address</h4>
          {hasShippingAddress ? (
            <p className="text-sm text-gray-600">{formatAddress('shipping')}</p>
          ) : (
            <div>
              <p className="text-sm text-gray-500 mb-1">No Shipping Address</p>
              <Link
                to={`/contacts/${contact.id}/edit?tab=address`}
                className="text-sm text-primary-600 hover:text-primary-900 font-medium"
              >
                New Address
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddressSection;

