import { numberToWords } from './numberToWords';

interface QuoteData {
  quoteNumber: string;
  issueDate: Date | string;
  expiryDate?: Date | string | null;
  status: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  notes?: string | null;
  contact: {
    name: string;
    company?: string | null;
    billingAddress?: string | null;
    billingCity?: string | null;
    billingState?: string | null;
    billingZipCode?: string | null;
    billingCountry?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    zipCode?: string | null;
    country?: string | null;
  };
  items: Array<{
    name: string;
    description?: string | null;
    quantity: number;
    rate: number;
    taxRate: number;
  }>;
  template?: {
    name: string;
    content: string;
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

/**
 * Render a quote using the template HTML (Frontend version)
 * This is a simplified version that works on the frontend
 */
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
    // Organization info (using dot notation for template)
    'organization.name': companyInfo.name || 'Test',
    'organization.city': companyInfo.city || 'Gujarat',
    'organization.country': companyInfo.country || 'India',
    'organization.email': companyInfo.email || 'jayesh.prajapati@aipxperts.com',
    
    // Company info (for older template format - default template uses these)
    companyName: companyInfo.name || 'Test',
    companyAddress: companyInfo.address || '',
    companyCity: companyInfo.city || 'Gujarat',
    companyState: companyInfo.state || '',
    companyZipCode: companyInfo.zipCode || '',
    companyCountry: companyInfo.country || 'India',
    companyEmail: companyInfo.email || 'jayesh.prajapati@aipxperts.com',
    
    // Quote info
    quoteNumber: quoteData.quoteNumber || '',
    issueDate: formatDate(quoteData.issueDate) || '',
    // Since expiryDate is now required, always format it (fallback to issueDate if somehow missing)
    expiryDate: (() => {
      const expiry = formatDate(quoteData.expiryDate);
      if (expiry) return expiry;
      const issue = formatDate(quoteData.issueDate);
      return issue || '';
    })(),
    status_DRAFT: quoteData.status === 'DRAFT' ? 'true' : '',
    taxAmount_gt_0: Number(quoteData.taxAmount) > 0 ? 'true' : '',
    
    // Contact info (using dot notation)
    'contact.name': quoteData.contact.name,
    'contact.company': quoteData.contact.company || '',
    'contact.billingAddress': quoteData.contact.billingAddress || '',
    'contact.billingCity': quoteData.contact.billingCity || '',
    'contact.billingState': quoteData.contact.billingState || '',
    'contact.billingZipCode': quoteData.contact.billingZipCode || '',
    'contact.billingCountry': quoteData.contact.billingCountry || '',
    'contact.address': quoteData.contact.address || '',
    'contact.city': quoteData.contact.city || '',
    'contact.state': quoteData.contact.state || '',
    'contact.zipCode': quoteData.contact.zipCode || '',
    'contact.country': quoteData.contact.country || '',
    
    // Contact info (for older template format - default template uses these)
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

  // Simple template replacement (for Handlebars-like syntax)
  let rendered = templateHTML;
  
  // Fix spacing: reduce body padding from 40px to 20px (or any large padding)
  rendered = rendered.replace(/padding:\s*40px/gi, 'padding: 20px');
  rendered = rendered.replace(/padding:\s*30px/gi, 'padding: 20px');
  
  // FIRST: Handle conditionals that need to be removed/processed BEFORE variable replacement
  // Since expiryDate is now required, always show it (remove conditional wrapper)
  rendered = rendered.replace(/\{\{#if expiryDate\}\}([\s\S]*?)\{\{\/if\}\}/g, '$1');
  
  // Remove any "Change" link from template footer (strip <a> tags with "Change" text)
  rendered = rendered.replace(/<a[^>]*>\s*Change\s*<\/a>/gi, '');
  
  // NOW: Replace simple variables {{variable}} - escape special regex characters in key
  Object.entries(variables).forEach(([key, value]) => {
    // Escape special regex characters in the key
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\{\\{${escapedKey}\\}\\}`, 'g');
    const replacement = value === null || value === undefined ? '' : String(value);
    rendered = rendered.replace(regex, replacement);
  });

  // Handle conditional blocks {{#if condition}}...{{/if}}
  // For status_DRAFT
  if (quoteData.status === 'DRAFT') {
    rendered = rendered.replace(/\{\{#if status_DRAFT\}\}([\s\S]*?)\{\{\/if\}\}/g, '$1');
  } else {
    rendered = rendered.replace(/\{\{#if status_DRAFT\}\}([\s\S]*?)\{\{\/if\}\}/g, '');
  }

  // Handle isDraft (for older template format)
  if (quoteData.status === 'DRAFT') {
    rendered = rendered.replace(/\{\{#if isDraft\}\}([\s\S]*?)\{\{\/if\}\}/g, '$1');
  } else {
    rendered = rendered.replace(/\{\{#if isDraft\}\}([\s\S]*?)\{\{\/if\}\}/g, '');
  }

  // Handle taxAmount_gt_0
  if (Number(quoteData.taxAmount) > 0) {
    rendered = rendered.replace(/\{\{#if taxAmount_gt_0\}\}([\s\S]*?)\{\{\/if\}\}/g, '$1');
  } else {
    rendered = rendered.replace(/\{\{#if taxAmount_gt_0\}\}([\s\S]*?)\{\{\/if\}\}/g, '');
  }

  // Handle taxAmount (for older template format)
  if (Number(quoteData.taxAmount) > 0) {
    rendered = rendered.replace(/\{\{#if taxAmount\}\}([\s\S]*?)\{\{\/if\}\}/g, '$1');
  } else {
    rendered = rendered.replace(/\{\{#if taxAmount\}\}([\s\S]*?)\{\{\/if\}\}/g, '');
  }

  // Handle items loop {{#each items}}...{{/each}}
  const itemsMatch = rendered.match(/\{\{#each items\}\}([\s\S]*?)\{\{\/each\}\}/);
  if (itemsMatch && quoteData.items && quoteData.items.length > 0) {
    const itemTemplate = itemsMatch[1];
    const itemsHTML = quoteData.items.map((item, index) => {
      const itemAmount = Number(item.quantity) * Number(item.rate) * (1 + Number(item.taxRate) / 100);
      let itemHTML = itemTemplate
        .replace(/\{\{@index\}\}/g, String(index + 1))
        .replace(/\{\{name\}\}/g, item.name || '')
        .replace(/\{\{description\}\}/g, item.description || '')
        .replace(/\{\{quantity\}\}/g, Number(item.quantity).toFixed(2))
        .replace(/\{\{rate\}\}/g, formatCurrency(Number(item.rate)))
        .replace(/\{\{amount\}\}/g, formatCurrency(itemAmount));
      
      // Handle conditional description
      if (item.description) {
        itemHTML = itemHTML.replace(/\{\{#if description\}\}([\s\S]*?)\{\{\/if\}\}/g, '$1');
      } else {
        itemHTML = itemHTML.replace(/\{\{#if description\}\}([\s\S]*?)\{\{\/if\}\}/g, '');
      }
      
      return itemHTML;
    }).join('');
    
    rendered = rendered.replace(/\{\{#each items\}\}([\s\S]*?)\{\{\/each\}\}/, itemsHTML);
  }


  // Handle quoteNumber conditional
  if (variables.quoteNumber && quoteData.quoteNumber) {
    rendered = rendered.replace(/\{\{#if quoteNumber\}\}([\s\S]*?)\{\{\/if\}\}/g, '$1');
  } else {
    rendered = rendered.replace(/\{\{#if quoteNumber\}\}([\s\S]*?)\{\{\/if\}\}/g, '');
  }

  if (variables.notes) {
    rendered = rendered.replace(/\{\{#if notes\}\}([\s\S]*?)\{\{\/if\}\}/g, '$1');
  } else {
    rendered = rendered.replace(/\{\{#if notes\}\}([\s\S]*?)\{\{\/if\}\}/g, '');
  }

  // Handle contact address conditionals
  if (quoteData.contact?.billingAddress) {
    rendered = rendered.replace(/\{\{#if contact.billingAddress\}\}([\s\S]*?)\{\{\/if\}\}/g, '$1');
    rendered = rendered.replace(/\{\{#else if contact.address\}\}([\s\S]*?)\{\{\/else if\}\}/g, '');
  } else if (quoteData.contact?.address) {
    rendered = rendered.replace(/\{\{#if contact.billingAddress\}\}([\s\S]*?)\{\{\/if\}\}/g, '');
    rendered = rendered.replace(/\{\{#else if contact.address\}\}([\s\S]*?)\{\{\/else if\}\}/g, '$1');
  } else {
    rendered = rendered.replace(/\{\{#if contact.billingAddress\}\}([\s\S]*?)\{\{\/if\}\}/g, '');
    rendered = rendered.replace(/\{\{#else if contact.address\}\}([\s\S]*?)\{\{\/else if\}\}/g, '');
  }

  if (quoteData.contact?.company) {
    rendered = rendered.replace(/\{\{#if contact.company\}\}([\s\S]*?)\{\{\/if\}\}/g, '$1');
  } else {
    rendered = rendered.replace(/\{\{#if contact.company\}\}([\s\S]*?)\{\{\/if\}\}/g, '');
  }

  // CRITICAL: Force replace expiryDate - do this to ensure it's always replaced
  // Get the actual expiryDate value from quoteData, with fallback to issueDate
  let expiryDateValue = '';
  if (quoteData.expiryDate) {
    expiryDateValue = formatDate(quoteData.expiryDate);
  }
  if (!expiryDateValue && quoteData.issueDate) {
    expiryDateValue = formatDate(quoteData.issueDate);
  }
  // If still empty, use today's date as last resort
  if (!expiryDateValue) {
    expiryDateValue = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
  
  // Replace ALL instances of {{expiryDate}} - use global replace with all case variations
  // Do this multiple passes to catch any edge cases
  for (let i = 0; i < 5; i++) {
    rendered = rendered.replace(/\{\{expiryDate\}\}/gi, expiryDateValue);
    rendered = rendered.replace(/\{\{EXPIRYDATE\}\}/g, expiryDateValue);
    rendered = rendered.replace(/\{\{ExpiryDate\}\}/g, expiryDateValue);
    if (!rendered.includes('{{expiryDate}}') && !rendered.includes('{{EXPIRYDATE}}') && !rendered.includes('{{ExpiryDate}}')) {
      break;
    }
  }
  
  // Also ensure issueDate is replaced
  const issueDateValue = formatDate(quoteData.issueDate) || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  while (rendered.includes('{{issueDate}}')) {
    rendered = rendered.replace(/\{\{issueDate\}\}/g, issueDateValue);
  }

  return rendered;
};

interface InvoiceData {
  invoiceNumber: string;
  issueDate: Date | string;
  dueDate?: Date | string | null;
  status: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  paidAmount?: number;
  notes?: string | null;
  contact: {
    name: string;
    billingAddress?: string | null;
    billingCity?: string | null;
    billingState?: string | null;
    billingZipCode?: string | null;
    billingCountry?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    zipCode?: string | null;
    country?: string | null;
  };
  items: Array<{
    type?: 'ITEM' | 'HEADER';
    name: string;
    description?: string | null;
    quantity: number;
    rate: number;
    taxRate: number;
  }>;
  template?: {
    name: string;
    content: string;
  } | null;
  quote?: {
    id: string;
    quoteNumber: string;
    status: string;
  } | null;
}

/**
 * Render an invoice using the template HTML (Frontend version)
 * Similar to renderQuoteTemplate but for invoices
 */
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
    
    // Invoice info
    invoiceNumber: invoiceData.invoiceNumber,
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
    quoteNumber: invoiceData.quote?.quoteNumber || '',
    quoteStatus: invoiceData.quote?.status || '',
  };

  // Simple template replacement (for Handlebars-like syntax)
  let rendered = templateHTML;
  
  // Fix spacing: reduce body padding from 40px to 20px (or any large padding)
  rendered = rendered.replace(/padding:\s*40px/gi, 'padding: 20px');
  rendered = rendered.replace(/padding:\s*30px/gi, 'padding: 20px');
  
  // FIRST: Handle conditionals that need to be removed/processed BEFORE variable replacement
  // Since dueDate is now required, always show it (remove conditional wrapper)
  rendered = rendered.replace(/\{\{#if dueDate\}\}([\s\S]*?)\{\{\/if\}\}/g, '$1');
  
  // Remove any "Change" link from template footer (strip <a> tags with "Change" text)
  rendered = rendered.replace(/<a[^>]*>\s*Change\s*<\/a>/gi, '');

  // Handle conditional blocks {{#if condition}}...{{/if}}
  // For isDraft
  if (invoiceData.status === 'DRAFT') {
    rendered = rendered.replace(/\{\{#if isDraft\}\}([\s\S]*?)\{\{\/if\}\}/g, '$1');
  } else {
    rendered = rendered.replace(/\{\{#if isDraft\}\}([\s\S]*?)\{\{\/if\}\}/g, '');
  }
  
  // NOW: Replace simple variables {{variable}} - escape special regex characters in key
  Object.entries(variables).forEach(([key, value]) => {
    // Escape special regex characters in the key
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\{\\{${escapedKey}\\}\\}`, 'g');
    const replacement = value === null || value === undefined ? '' : String(value);
    rendered = rendered.replace(regex, replacement);
  });

  // Handle items loop {{#each items}}...{{/each}}
  const itemsMatch = rendered.match(/\{\{#each items\}\}([\s\S]*?)\{\{\/each\}\}/);
  if (itemsMatch && invoiceData.items && invoiceData.items.length > 0) {
    const itemTemplate = itemsMatch[1];
    let itemIndex = 0; // Track actual item index (excluding headers)
    const itemsHTML = invoiceData.items.map((item) => {
      const isHeader = item.type === 'HEADER';
      
      if (isHeader) {
        // For headers, render a special row that spans all columns
        return `<tr class="header-row" style="background-color: #f5f5f5;"><td colspan="5" style="font-weight: bold; font-size: 16px; padding: 12px;">${item.name}</td></tr>`;
      } else {
        // For regular items
        itemIndex++;
        const itemAmount = Number(item.quantity) * Number(item.rate) * (1 + Number(item.taxRate) / 100);
        let itemHTML = itemTemplate
          .replace(/\{\{@index\}\}/g, String(itemIndex))
          .replace(/\{\{name\}\}/g, item.name || '')
          .replace(/\{\{description\}\}/g, item.description || '')
          .replace(/\{\{quantity\}\}/g, Number(item.quantity).toFixed(2))
          .replace(/\{\{rate\}\}/g, formatCurrency(Number(item.rate)))
          .replace(/\{\{amount\}\}/g, formatCurrency(itemAmount));
        
        // Handle conditional description
        if (item.description) {
          itemHTML = itemHTML.replace(/\{\{#if description\}\}([\s\S]*?)\{\{\/if\}\}/g, '$1');
        } else {
          itemHTML = itemHTML.replace(/\{\{#if description\}\}([\s\S]*?)\{\{\/if\}\}/g, '');
        }
        
        return itemHTML;
      }
    }).join('');
    
    rendered = rendered.replace(/\{\{#each items\}\}([\s\S]*?)\{\{\/each\}\}/, itemsHTML);
  }


  if (variables.taxAmount && Number(invoiceData.taxAmount) > 0) {
    rendered = rendered.replace(/\{\{#if taxAmount\}\}([\s\S]*?)\{\{\/if\}\}/g, '$1');
  } else {
    rendered = rendered.replace(/\{\{#if taxAmount\}\}([\s\S]*?)\{\{\/if\}\}/g, '');
  }

  if (variables.notes) {
    rendered = rendered.replace(/\{\{#if notes\}\}([\s\S]*?)\{\{\/if\}\}/g, '$1');
  } else {
    rendered = rendered.replace(/\{\{#if notes\}\}([\s\S]*?)\{\{\/if\}\}/g, '');
  }

  if (paidAmount > 0) {
    rendered = rendered.replace(/\{\{#if paidAmount\}\}([\s\S]*?)\{\{\/if\}\}/g, '$1');
  } else {
    rendered = rendered.replace(/\{\{#if paidAmount\}\}([\s\S]*?)\{\{\/if\}\}/g, '');
  }

  if (remainingAmount > 0) {
    rendered = rendered.replace(/\{\{#if remainingAmount\}\}([\s\S]*?)\{\{\/if\}\}/g, '$1');
  } else {
    rendered = rendered.replace(/\{\{#if remainingAmount\}\}([\s\S]*?)\{\{\/if\}\}/g, '');
  }

  // Handle quote association
  if (invoiceData.quote && invoiceData.quote.quoteNumber) {
    rendered = rendered.replace(/\{\{#if quoteNumber\}\}([\s\S]*?)\{\{\/if\}\}/g, '$1');
  } else {
    rendered = rendered.replace(/\{\{#if quoteNumber\}\}([\s\S]*?)\{\{\/if\}\}/g, '');
  }

  // Final cleanup: Force replace required date fields to ensure they're always displayed
  // Since dueDate is now required, always replace it with formatted date
  const dueDateValue = formatDate(invoiceData.dueDate) || formatDate(invoiceData.issueDate) || '';
  rendered = rendered.replace(/\{\{dueDate\}\}/g, dueDateValue);
  
  // Also ensure issueDate is replaced
  const issueDateValue = formatDate(invoiceData.issueDate) || '';
  rendered = rendered.replace(/\{\{issueDate\}\}/g, issueDateValue);

  return rendered;
};

