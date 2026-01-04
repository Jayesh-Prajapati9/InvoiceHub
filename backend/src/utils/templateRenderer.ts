import { numberToWords } from './numberToWords';
                                                                                                                                                                                                                                                                                                                                                            import { renderTemplate } from './handlebarsRenderer';

interface QuoteData {
  quoteNumber: string;
  issueDate: Date | string;
  expiryDate?: Date | string | null;
  status: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  notes?: string;
  contact: {
    name: string;
    address?: string;
    billingAddress?: string;
    city?: string;
    billingCity?: string;
    state?: string;
    billingState?: string;
    zipCode?: string;
    billingZipCode?: string;
    country?: string;
    billingCountry?: string;
  };
  items: Array<{
    name: string;
    description?: string;
    quantity: number;
    rate: number;
    type?: 'ITEM' | 'HEADER';
  }>;
  template?: {
    name: string;
  };
}

interface InvoiceData {
  invoiceNumber: string;
  issueDate: Date | string;
  dueDate: Date | string;
  status: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  paidAmount?: number;
  notes?: string;
  contact: {
    name: string;
    address?: string;
    billingAddress?: string;
    city?: string;
    billingCity?: string;
    state?: string;
    billingState?: string;
    zipCode?: string;
    billingZipCode?: string;
    country?: string;
    billingCountry?: string;
  };
  items: Array<{
    name: string;
    description?: string;
    quantity: number;
    rate: number;
    type?: 'ITEM' | 'HEADER';
  }>;
  template?: {
    name: string;
  };
  quote?: {
    id: string;
    quoteNumber: string;
    status: string;
  } | null;
}

interface CompanyInfo {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  email?: string;
}

export const renderInvoiceTemplate = (
  templateHTML: string,
  invoiceData: InvoiceData,
  companyInfo: CompanyInfo = {}
): string => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const paidAmount = Number(invoiceData.paidAmount || 0);
  const remainingAmount = Number(invoiceData.total) - paidAmount;

  // Prepare template variables
  const variables: Record<string, string> = {
    // Company info
    companyName: companyInfo.name || 'Test',
    companyAddress: companyInfo.address || '',
    companyCity: companyInfo.city || 'Gujarat',
    companyState: companyInfo.state || '',
    companyZipCode: companyInfo.zipCode || '',
    companyCountry: companyInfo.country || 'India',
    companyEmail: companyInfo.email || 'jayesh.prajapati@aipxperts.com',
    
    // Invoice info (for templates that work with both invoices and quotes)
    invoiceNumber: invoiceData.invoiceNumber || '',
    quoteNumber: invoiceData.quote?.quoteNumber || '',
    issueDate: formatDate(invoiceData.issueDate),
    dueDate: formatDate(invoiceData.dueDate),
    isDraft: invoiceData.status === 'DRAFT' ? 'true' : '',
    
    // Contact info
    contactName: invoiceData.contact.name,
    billingAddress: invoiceData.contact.billingAddress || invoiceData.contact.address || '',
    billingCity: invoiceData.contact.billingCity || invoiceData.contact.city || '',
    billingState: invoiceData.contact.billingState || invoiceData.contact.state || '',
    billingZipCode: invoiceData.contact.billingZipCode || invoiceData.contact.zipCode || '',
    billingCountry: invoiceData.contact.billingCountry || invoiceData.contact.country || '',
    
    // Totals
    subtotal: formatCurrency(Number(invoiceData.subtotal)),
    taxAmount: formatCurrency(Number(invoiceData.taxAmount)),
    total: formatCurrency(Number(invoiceData.total)),
    paidAmount: formatCurrency(paidAmount),
    remainingAmount: formatCurrency(remainingAmount),
    totalInWords: numberToWords(Number(invoiceData.total)),
    
    // Template name
    templateName: invoiceData.template?.name || 'Spreadsheet Template',
    
    // Notes
    notes: invoiceData.notes || '',
    
    // Quote info (if associated)
    quoteStatus: invoiceData.quote?.status || '',
  };

  // Create item renderer function
  let itemIndex = 0; // Track actual item index (excluding headers)
  
  const itemRenderer = (item: any, index: number, isHeader: boolean) => {
    if (isHeader) {
      // For headers, render as a simple header row with template-specific styling
      const headerBgColor = templateHTML.includes('purple') || templateHTML.includes('Purple') ? '#faf5ff' : 
                            templateHTML.includes('green') || templateHTML.includes('Green') ? '#d1fae5' : 
                            '#eff6ff';
      const headerTextColor = templateHTML.includes('purple') || templateHTML.includes('Purple') ? '#6d28d9' : 
                             templateHTML.includes('green') || templateHTML.includes('Green') ? '#047857' : 
                             '#1e40af';
      return `<tr class="header-row"><td colspan="5" style="font-weight: bold; font-size: 12px; padding: 8px; background-color: ${headerBgColor}; color: ${headerTextColor};">${item.name}</td></tr>`;
    } else {
      // For regular items
      itemIndex++;
      const itemAmount = Number(item.quantity) * Number(item.rate);
      
      return `
        <tr>
          <td>${itemIndex}</td>
          <td>
            <strong>${item.name || ''}</strong>
            ${item.description ? `<br><small style="color: #6b7280;">${item.description}</small>` : ''}
          </td>
          <td class="text-right">${Number(item.quantity).toFixed(2)}</td>
          <td class="text-right">${formatCurrency(Number(item.rate))}</td>
          <td class="text-right">${formatCurrency(itemAmount)}</td>
        </tr>
      `;
    }
  };
  
  // Reset itemIndex for the renderer
  itemIndex = 0;
  
  // Prepare context for template rendering
  const templateContext: any = {
    ...variables,
    items: invoiceData.items,
  };
  
  // Use the new renderer
  let rendered = renderTemplate(templateHTML, templateContext, itemRenderer);
  
  // Final cleanup: Ensure all date fields are properly replaced
  const dueDateValue = formatDate(invoiceData.dueDate) || formatDate(invoiceData.issueDate) || '';
  rendered = rendered.replace(/\{\{dueDate\}\}/g, dueDateValue);
  
  const issueDateValue = formatDate(invoiceData.issueDate) || '';
  rendered = rendered.replace(/\{\{issueDate\}\}/g, issueDateValue);

  return rendered;
};

export const renderQuoteTemplate = (
  templateHTML: string,
  quoteData: QuoteData,
  companyInfo: CompanyInfo = {}
): string => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Prepare template variables
  const variables: Record<string, string> = {
    // Company info
    companyName: companyInfo.name || 'Test',
    companyAddress: companyInfo.address || '',
    companyCity: companyInfo.city || 'Gujarat',
    companyState: companyInfo.state || '',
    companyZipCode: companyInfo.zipCode || '',
    companyCountry: companyInfo.country || 'India',
    companyEmail: companyInfo.email || 'jayesh.prajapati@aipxperts.com',
    
    // Quote info
    quoteNumber: quoteData.quoteNumber || '',
    issueDate: formatDate(quoteData.issueDate),
    expiryDate: formatDate(quoteData.expiryDate),
    isDraft: quoteData.status === 'DRAFT' ? 'true' : '',
    
    // Contact info
    contactName: quoteData.contact.name,
    billingAddress: quoteData.contact.billingAddress || quoteData.contact.address || '',
    billingCity: quoteData.contact.billingCity || quoteData.contact.city || '',
    billingState: quoteData.contact.billingState || quoteData.contact.state || '',
    billingZipCode: quoteData.contact.billingZipCode || quoteData.contact.zipCode || '',
    billingCountry: quoteData.contact.billingCountry || quoteData.contact.country || '',
    
    // Totals
    subtotal: formatCurrency(Number(quoteData.subtotal)),
    taxAmount: formatCurrency(Number(quoteData.taxAmount)),
    total: formatCurrency(Number(quoteData.total)),
    totalInWords: numberToWords(Number(quoteData.total)),
    
    // Template name
    templateName: quoteData.template?.name || 'Spreadsheet Template',
    
    // Notes
    notes: quoteData.notes || '',
  };

  // Create item renderer function
  let itemIndex = 0; // Track actual item index (excluding headers)
  
  const itemRenderer = (item: any, index: number, isHeader: boolean) => {
    if (isHeader) {
      // For headers, render as a simple header row with template-specific styling
      const headerBgColor = templateHTML.includes('purple') || templateHTML.includes('Purple') ? '#faf5ff' : 
                            templateHTML.includes('green') || templateHTML.includes('Green') ? '#d1fae5' : 
                            '#eff6ff';
      const headerTextColor = templateHTML.includes('purple') || templateHTML.includes('Purple') ? '#6d28d9' : 
                             templateHTML.includes('green') || templateHTML.includes('Green') ? '#047857' : 
                             '#1e40af';
      return `<tr class="header-row"><td colspan="5" style="font-weight: bold; font-size: 12px; padding: 8px; background-color: ${headerBgColor}; color: ${headerTextColor};">${item.name}</td></tr>`;
    } else {
      // For regular items
      itemIndex++;
      const itemAmount = Number(item.quantity) * Number(item.rate);
      
      return `
        <tr>
          <td>${itemIndex}</td>
          <td>
            <strong>${item.name || ''}</strong>
            ${item.description ? `<br><small style="color: #6b7280;">${item.description}</small>` : ''}
          </td>
          <td class="text-right">${Number(item.quantity).toFixed(2)}</td>
          <td class="text-right">${formatCurrency(Number(item.rate))}</td>
          <td class="text-right">${formatCurrency(itemAmount)}</td>
        </tr>
      `;
    }
  };
  
  // Reset itemIndex for the renderer
  itemIndex = 0;
  
  // Prepare context for template rendering
  const templateContext: any = {
    ...variables,
    items: quoteData.items,
  };
  
  // Use the new renderer
  let rendered = renderTemplate(templateHTML, templateContext, itemRenderer);
  
  // Final cleanup: Ensure all date fields are properly replaced
  let expiryDateValue = '';
  if (quoteData.expiryDate) {
    expiryDateValue = formatDate(quoteData.expiryDate);
  }
  if (!expiryDateValue && quoteData.issueDate) {
    expiryDateValue = formatDate(quoteData.issueDate);
  }
  if (!expiryDateValue) {
    expiryDateValue = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
  
  rendered = rendered.replace(/\{\{expiryDate\}\}/gi, expiryDateValue);
  
  const issueDateValue = formatDate(quoteData.issueDate) || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  rendered = rendered.replace(/\{\{issueDate\}\}/g, issueDateValue);

  return rendered;
};
