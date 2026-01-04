import Handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import { numberToWords } from './numberToWords';
import { templateFileExists } from './templateFileManager';

// Register custom helpers
Handlebars.registerHelper('eq', function(this: any, a: any, b: any, options?: any) {
  // Handle both regular helper calls and subexpressions
  if (options && typeof options === 'object' && 'fn' in options) {
    // Called as block helper: {{#eq a b}}...{{/eq}}
    return a === b ? options.fn(this) : (options.inverse ? options.inverse(this) : '');
  } else {
    // Called as subexpression: {{#if (eq a b)}}
    return a === b;
  }
});

// Cache for compiled templates
const templateCache: Map<string, HandlebarsTemplateDelegate> = new Map();

/**
 * Load and compile a Handlebars template from .hbs file
 */
function loadTemplate(templatePath: string, forceReload: boolean = false): HandlebarsTemplateDelegate {
  // Always clear cache to ensure fresh templates
  if (templateCache.has(templatePath)) {
    templateCache.delete(templatePath);
  }

  const fullPath = path.join(__dirname, '..', 'templates', templatePath);
  
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Template file not found: ${fullPath}`);
  }
  
  const templateContent = fs.readFileSync(fullPath, 'utf-8');
  
  try {
    const compiled = Handlebars.compile(templateContent, {
      strict: false, // Don't throw on undefined variables
      noEscape: false, // Escape HTML by default
      preventIndent: true, // Prevent indentation issues
    });
    
    // Clear cache if there's an error to force recompilation
    if (!compiled) {
      templateCache.delete(templatePath);
      throw new Error('Failed to compile Handlebars template');
    }
    
    templateCache.set(templatePath, compiled);
    return compiled;
  } catch (error: any) {
    throw error;
  }
}

/**
 * Prepare items for template rendering with proper indexing
 */
function prepareItems(items: any[]) {
  let itemIndex = 0;
  return items.map((item) => {
    const isHeader = item.type === 'HEADER';
    if (!isHeader) {
      itemIndex++;
    }
    
    return {
      ...item,
      itemIndex: isHeader ? '' : itemIndex,
      quantity: isHeader ? '' : Number(item.quantity).toFixed(2),
      rate: isHeader ? '' : formatCurrency(Number(item.rate)),
      amount: isHeader ? '' : formatCurrency(Number(item.quantity) * Number(item.rate)),
    };
  });
}

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
    id: string;
    name: string;
  };
  quote?: {
    id: string;
    quoteNumber: string;
    status: string;
  } | null;
}

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
    id: string;
    name: string;
  };
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
  templateHTML: string | null,
  invoiceData: InvoiceData,
  companyInfo: CompanyInfo = {}
): string => {
  // Use template ID to load the .hbs file, fallback to name-based detection
  let templateFile: string;
  const templateId = invoiceData.template?.id;
  
  if (templateId && templateFileExists(templateId)) {
    // Use template ID-based file
    templateFile = `${templateId}.hbs`;
  } else {
    // Fallback to name-based detection for backward compatibility
    templateFile = 'default-invoice.hbs';
    const templateName = invoiceData.template?.name?.toLowerCase() || '';
    const htmlContent = templateHTML?.toLowerCase() || '';
    
    if (templateName.includes('purple') || templateName.includes('elegant')) {
      templateFile = 'purple-elegant.hbs';
    } else if (templateName.includes('green') || templateName.includes('classic')) {
      templateFile = 'green-classic.hbs';
    } else if (templateName.includes('blue') || templateName.includes('modern')) {
      templateFile = 'blue-modern.hbs';
    } else if (htmlContent.includes('purple') || htmlContent.includes('#7c3aed')) {
      templateFile = 'purple-elegant.hbs';
    } else if (htmlContent.includes('green') || htmlContent.includes('#059669')) {
      templateFile = 'green-classic.hbs';
    } else if (htmlContent.includes('blue') || htmlContent.includes('#3b82f6')) {
      templateFile = 'blue-modern.hbs';
    }
  }

  const paidAmount = Number(invoiceData.paidAmount || 0);
  const remainingAmount = Number(invoiceData.total) - paidAmount;

  // Prepare template context
  const context = {
    // Company info
    companyName: companyInfo.name || 'Test',
    companyAddress: companyInfo.address || '',
    companyCity: companyInfo.city || 'Gujarat',
    companyState: companyInfo.state || '',
    companyZipCode: companyInfo.zipCode || '',
    companyCountry: companyInfo.country || 'India',
    companyEmail: companyInfo.email || 'jayesh.prajapati@aipxperts.com',
    
    // Invoice info
    // CRITICAL: Must be truthy string for Handlebars {{#if}} to work
    invoiceNumber: invoiceData.invoiceNumber ? String(invoiceData.invoiceNumber).trim() : '',
    quoteNumber: invoiceData.quote?.quoteNumber ? String(invoiceData.quote.quoteNumber).trim() : '',
    issueDate: formatDate(invoiceData.issueDate),
    dueDate: formatDate(invoiceData.dueDate),
    isDraft: invoiceData.status === 'DRAFT',
    
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
    paidAmount: paidAmount > 0 ? formatCurrency(paidAmount) : '',
    remainingAmount: remainingAmount > 0 ? formatCurrency(remainingAmount) : '',
    totalInWords: numberToWords(Number(invoiceData.total)),
    
    // Template name
    templateName: invoiceData.template?.name || 'Spreadsheet Template',
    
    // Notes
    notes: invoiceData.notes || '',
    
    // Quote info (if associated)
    quoteStatus: invoiceData.quote?.status || '',
    
    // Items with proper formatting
    items: prepareItems(invoiceData.items),
  };

  // Load and render template
  try {
    const template = loadTemplate(templateFile, false);
    const rendered = template(context);
    return rendered;
  } catch (error: any) {
    throw new Error(`Failed to render template: ${error.message}`);
  }
};

export const renderQuoteTemplate = (
  templateHTML: string | null,
  quoteData: QuoteData,
  companyInfo: CompanyInfo = {}
): string => {
  // Use template ID to load the .hbs file, fallback to name-based detection
  let templateFile: string;
  const templateId = quoteData.template?.id;
  
  if (templateId && templateFileExists(templateId)) {
    // Use template ID-based file
    templateFile = `${templateId}.hbs`;
  } else {
    // Fallback to name-based detection for backward compatibility
    templateFile = 'default-quote.hbs';
    const templateName = quoteData.template?.name?.toLowerCase() || '';
    const htmlContent = templateHTML?.toLowerCase() || '';
    
    if (templateName.includes('purple') || templateName.includes('elegant')) {
      templateFile = 'purple-elegant.hbs';
    } else if (templateName.includes('green') || templateName.includes('classic')) {
      templateFile = 'green-classic.hbs';
    } else if (templateName.includes('blue') || templateName.includes('modern')) {
      templateFile = 'blue-modern.hbs';
    } else if (htmlContent.includes('purple') || htmlContent.includes('#7c3aed')) {
      templateFile = 'purple-elegant.hbs';
    } else if (htmlContent.includes('green') || htmlContent.includes('#059669')) {
      templateFile = 'green-classic.hbs';
    } else if (htmlContent.includes('blue') || htmlContent.includes('#3b82f6')) {
      templateFile = 'blue-modern.hbs';
    }
  }

  // Prepare template context
  const context = {
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
    isDraft: quoteData.status === 'DRAFT',
    
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
    
    // Items with proper formatting
    items: prepareItems(quoteData.items),
  };

  // Load and render template
  try {
    const template = loadTemplate(templateFile);
    const rendered = template(context);
    return rendered;
  } catch (error: any) {
    console.error('Error rendering quote template:', error);
    console.error('Template file:', templateFile);
    console.error('Context keys:', Object.keys(context));
    throw new Error(`Failed to render template: ${error.message}`);
  }
};

