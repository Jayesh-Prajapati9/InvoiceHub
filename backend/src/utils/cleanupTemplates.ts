import prisma from '../config/database';
import { deleteTemplateFile } from './templateFileManager';

/**
 * Cleanup duplicate templates - keep only the 4 default templates
 * Spreadsheet Template, Blue Modern, Green Classic, Purple Elegant
 */
export async function cleanupDuplicateTemplates() {
  try {
    console.log('🧹 Cleaning up duplicate templates...');
    
    // Get all templates
    const allTemplates = await prisma.template.findMany();
    
    // Templates to keep (by name)
    const templatesToKeep = [
      'Spreadsheet Template',
      'Blue Modern',
      'Green Classic',
      'Purple Elegant'
    ];
    
    // Find templates to delete
    const templatesToDelete = allTemplates.filter(
      template => !templatesToKeep.includes(template.name)
    );
    
    console.log(`Found ${templatesToDelete.length} duplicate templates to delete`);
    
    // Delete each duplicate template
    for (const template of templatesToDelete) {
      // Delete the .hbs file first
      deleteTemplateFile(template.id);
      
      // Delete from database
      await prisma.template.delete({
        where: { id: template.id }
      });
      
      console.log(`✓ Deleted template: ${template.name} (${template.id})`);
    }
    
    // Ensure we have exactly one of each default template
    const remainingTemplates = await prisma.template.findMany();
    console.log(`\n✅ Cleanup complete! Remaining templates: ${remainingTemplates.length}`);
    remainingTemplates.forEach(t => {
      console.log(`  - ${t.name} (${t.id})`);
    });
    
    return remainingTemplates;
  } catch (error: any) {
    console.error('❌ Error cleaning up templates:', error);
    throw error;
  }
}

