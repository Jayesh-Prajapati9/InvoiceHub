import prisma from '../config/database';
import { getDefaultQuoteTemplateHTML } from './defaultQuoteTemplate';
import { getDefaultInvoiceTemplateHTML } from './defaultInvoiceTemplate';
import { getBlueModernTemplateHTML } from './templates/blueModernTemplate';
import { getGreenClassicTemplateHTML } from './templates/greenClassicTemplate';
import { getPurpleElegantTemplateHTML } from './templates/purpleElegantTemplate';
import { saveTemplateFile } from './templateFileManager';

/**
 * Get the default quote template
 * @deprecated Use getDefaultTemplate() instead - it returns whichever template is marked as default
 */
export const getDefaultQuoteTemplate = async () => {
  return getDefaultTemplate();
};

/**
 * Get the default template (any template marked as isDefault)
 * This uses whichever template the user has set as default
 */
export const getDefaultTemplate = async () => {
  // Find any template marked as default
  let defaultTemplate = await prisma.template.findFirst({
    where: { 
      isDefault: true,
    },
  });

  // If no default template exists, create one with default HTML content
  if (!defaultTemplate) {
    const defaultHTML = getDefaultInvoiceTemplateHTML();
    defaultTemplate = await prisma.template.create({
      data: {
        name: 'Invoice Template',
        description: 'Default invoice template',
        content: defaultHTML,
        isDefault: true,
      },
    });
    // Save to .hbs file
    saveTemplateFile(defaultTemplate.id, defaultHTML);
  }

  return defaultTemplate;
};

/**
 * Get the default invoice template
 * @deprecated Use getDefaultTemplate() instead - it returns whichever template is marked as default
 */
export const getDefaultInvoiceTemplate = async () => {
  return getDefaultTemplate();
};


/**
 * Initialize all templates (default + additional templates)
 * This ensures all templates are available for both invoices and quotes
 */
export const initializeAllTemplates = async () => {
  // First, unset all existing defaults
  await prisma.template.updateMany({
    where: { isDefault: true },
    data: { isDefault: false },
  });

  const templates = [
    {
      name: 'Spreadsheet Template',
      description: 'Default clean template',
      content: getDefaultQuoteTemplateHTML(),
      isDefault: true,
    },
    {
      name: 'Blue Modern',
      description: 'Modern template with blue accent colors',
      content: getBlueModernTemplateHTML(),
      isDefault: false,
    },
    {
      name: 'Green Classic',
      description: 'Classic template with green accent colors',
      content: getGreenClassicTemplateHTML(),
      isDefault: false,
    },
    {
      name: 'Purple Elegant',
      description: 'Elegant template with purple accent colors',
      content: getPurpleElegantTemplateHTML(),
      isDefault: false,
    },
  ];

  for (const templateData of templates) {
    const existing = await prisma.template.findFirst({
      where: { name: templateData.name },
    });

    if (!existing) {
      const created = await prisma.template.create({
        data: templateData,
      });
      // Save to .hbs file
      saveTemplateFile(created.id, templateData.content);
    } else {
      // Update existing template with latest content
      const updated = await prisma.template.update({
        where: { id: existing.id },
        data: {
          content: templateData.content,
          description: templateData.description,
          isDefault: templateData.isDefault,
        },
      });
      // Update .hbs file
      saveTemplateFile(updated.id, templateData.content);
    }
  }

  // Ensure only one default template exists
  const defaultTemplates = await prisma.template.findMany({
    where: { isDefault: true },
  });

  if (defaultTemplates.length > 1) {
    // Keep only the first one as default
    for (let i = 1; i < defaultTemplates.length; i++) {
      await prisma.template.update({
        where: { id: defaultTemplates[i].id },
        data: { isDefault: false },
      });
    }
  }
};

