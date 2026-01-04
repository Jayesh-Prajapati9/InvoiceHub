import * as fs from 'fs';
import * as path from 'path';

const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');

/**
 * Ensure templates directory exists
 */
function ensureTemplatesDir() {
  if (!fs.existsSync(TEMPLATES_DIR)) {
    fs.mkdirSync(TEMPLATES_DIR, { recursive: true });
  }
}

/**
 * Save template content to .hbs file
 * @param templateId - The template ID
 * @param content - The template HTML content
 */
export function saveTemplateFile(templateId: string, content: string): void {
  ensureTemplatesDir();
  const filePath = path.join(TEMPLATES_DIR, `${templateId}.hbs`);
  fs.writeFileSync(filePath, content, 'utf-8');
}

/**
 * Delete template .hbs file
 * @param templateId - The template ID
 */
export function deleteTemplateFile(templateId: string): void {
  const filePath = path.join(TEMPLATES_DIR, `${templateId}.hbs`);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

/**
 * Check if template file exists
 * @param templateId - The template ID
 */
export function templateFileExists(templateId: string): boolean {
  const filePath = path.join(TEMPLATES_DIR, `${templateId}.hbs`);
  return fs.existsSync(filePath);
}

/**
 * Get template file path
 * @param templateId - The template ID
 */
export function getTemplateFilePath(templateId: string): string {
  return path.join(TEMPLATES_DIR, `${templateId}.hbs`);
}

