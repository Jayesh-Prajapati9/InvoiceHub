import prisma from '../config/database';
import { saveTemplateFile } from './templateFileManager';

/**
 * Sync all templates in database to .hbs files
 * This ensures all existing templates have their .hbs files created
 */
export async function syncAllTemplateFiles() {
  try {
    const templates = await prisma.template.findMany();
    
    console.log(`Syncing ${templates.length} templates to .hbs files...`);
    
    for (const template of templates) {
      if (template.content) {
        saveTemplateFile(template.id, template.content);
        console.log(`✓ Created ${template.id}.hbs for template: ${template.name}`);
      } else {
        console.log(`⚠ Skipping template ${template.id} (${template.name}) - no content`);
      }
    }
    
    console.log('Template file sync completed!');
  } catch (error: any) {
    console.error('Error syncing template files:', error);
    throw error;
  }
}

