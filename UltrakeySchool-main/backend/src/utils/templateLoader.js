import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Load email template from file and replace placeholders
 * @param {string} templateName - Name of the template file (without .html extension)
 * @param {object} data - Data object with key-value pairs to replace in template
 * @returns {string} Processed HTML template with replaced placeholders
 */
export const loadEmailTemplate = (templateName, data = {}) => {
  try {
    const templatePath = path.join(__dirname, '../templates/emails', `${templateName}.html`);
    
    // Check if template file exists
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template file not found: ${templatePath}`);
    }
    
    // Read template file
    let template = fs.readFileSync(templatePath, 'utf-8');
    
    // Replace placeholders with data
    // Handle {{placeholder}} syntax
    for (const [key, value] of Object.entries(data)) {
      const placeholder = `{{${key}}}`;
      const regex = new RegExp(placeholder, 'g');
      template = template.replace(regex, value !== undefined ? value : '');
    }
    
    // Handle Handlebars-style conditionals (simple implementation)
    template = template.replace(/{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g, (match, key, content) => {
      return data[key] ? content : '';
    });
    
    // Handle Handlebars-style loops (simple implementation)
    template = template.replace(/{{#each\s+(\w+)}}([\s\S]*?){{\/each}}/g, (match, key, content) => {
      if (data[key] && Array.isArray(data[key])) {
        return data[key].map(item => {
          let itemContent = content;
          for (const [itemKey, itemValue] of Object.entries(item)) {
            const placeholder = `{{${itemKey}}}`;
            const regex = new RegExp(placeholder, 'g');
            itemContent = itemContent.replace(regex, itemValue !== undefined ? itemValue : '');
          }
          return itemContent;
        }).join('');
      }
      return '';
    });
    
    return template;
  } catch (error) {
    console.error(`Error loading template ${templateName}:`, error);
    throw error;
  }
};

/**
 * Get list of available email templates
 * @returns {string[]} Array of template names
 */
export const getAvailableTemplates = () => {
  try {
    const templatesDir = path.join(__dirname, '../templates/emails');
    const files = fs.readdirSync(templatesDir);
    return files.filter(file => file.endsWith('.html')).map(file => file.replace('.html', ''));
  } catch (error) {
    console.error('Error reading templates directory:', error);
    return [];
  }
};

/**
 * Check if a template exists
 * @param {string} templateName - Name of the template
 * @returns {boolean} True if template exists
 */
export const templateExists = (templateName) => {
  try {
    const templatePath = path.join(__dirname, '../templates/emails', `${templateName}.html`);
    return fs.existsSync(templatePath);
  } catch (error) {
    return false;
  }
};

export default {
  loadEmailTemplate,
  getAvailableTemplates,
  templateExists
};
