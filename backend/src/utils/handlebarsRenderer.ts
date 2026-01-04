/**
 * Handlebars-like template renderer
 * Properly handles conditionals, loops, and variable replacement
 */

interface RenderContext {
  [key: string]: any;
}

/**
 * Process conditionals: {{#if condition}}...{{else}}...{{/if}}
 */
function processConditionals(template: string, context: RenderContext): string {
  let result = template;
  
  // Process nested conditionals from innermost to outermost
  let maxIterations = 20; // Prevent infinite loops
  let iteration = 0;
  
  while (result.includes('{{#if') && iteration < maxIterations) {
    iteration++;
    
    // Find the innermost conditional block (non-greedy match)
    const ifMatch = result.match(/\{\{#if\s+([^}]+)\}\}([\s\S]*?)(?:\{\{#else\}\}([\s\S]*?))?\{\{\/if\}\}/);
    
    if (!ifMatch) break;
    
    const [fullMatch, condition, ifContent, elseContent = ''] = ifMatch;
    
    // Skip (eq type "HEADER") conditionals - these are handled in loops
    if (condition.includes('(eq type')) {
      // Remove the conditional wrapper but keep content
      result = result.replace(fullMatch, ifContent + (elseContent || ''));
      continue;
    }
    
    const conditionValue = evaluateCondition(condition.trim(), context);
    
    // Replace the conditional with the appropriate content
    result = result.replace(fullMatch, conditionValue ? ifContent : elseContent);
  }
  
  return result;
}

/**
 * Evaluate a condition (e.g., "invoiceNumber", "isDraft", "(eq type \"HEADER\")")
 */
function evaluateCondition(condition: string, context: RenderContext): boolean {
  // Handle (eq type "HEADER") syntax
  const eqMatch = condition.match(/\(eq\s+(\w+)\s+"([^"]+)"\)/);
  if (eqMatch) {
    const [, key, value] = eqMatch;
    return context[key] === value;
  }
  
  // Handle simple variable checks
  const value = context[condition];
  if (value === undefined || value === null) return false;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value !== '' && value !== 'false' && value !== '0';
  if (typeof value === 'number') return value !== 0;
  return true;
}

/**
 * Process loops: {{#each items}}...{{/each}}
 */
function processLoops(template: string, context: RenderContext, itemRenderer: (item: any, index: number, isHeader: boolean) => string): string {
  let result = template;
  let maxIterations = 10;
  let iteration = 0;
  
  // Process all loops (handle nested loops)
  while (result.includes('{{#each') && iteration < maxIterations) {
    iteration++;
    
    const eachMatch = result.match(/\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/);
    if (!eachMatch) break;
    
    const [fullMatch, arrayKey, loopTemplate] = eachMatch;
    const items = context[arrayKey] || [];
    
    if (!Array.isArray(items)) {
      result = result.replace(fullMatch, '');
      continue;
    }
    
    // Process each item - handle conditionals within the loop template
    const itemsHTML = items.map((item: any, index: number) => {
      const isHeader = item.type === 'HEADER';
      
      // If using itemRenderer, it handles the rendering
      // But we need to process conditionals in the template first
      let itemTemplate = loopTemplate;
      
      // Handle {{#if (eq type "HEADER")}} conditionals within the loop
      if (itemTemplate.includes('{{#if (eq type "HEADER")}}')) {
        if (isHeader) {
          // Extract the if part (header content)
          const headerMatch = itemTemplate.match(/\{\{#if\s*\(eq\s+type\s+"HEADER"\)\}\}([\s\S]*?)(?:\{\{#else\}\}|$)/);
          if (headerMatch && headerMatch[1]) {
            itemTemplate = headerMatch[1];
          } else {
            // Remove the entire conditional
            itemTemplate = itemTemplate.replace(/\{\{#if\s*\(eq\s+type\s+"HEADER"\)\}\}([\s\S]*?)\{\{\/if\}\}/g, '');
          }
        } else {
          // Extract the else part (item content)
          const elseMatch = itemTemplate.match(/\{\{#if\s*\(eq\s+type\s+"HEADER"\)\}\}([\s\S]*?)\{\{#else\}\}([\s\S]*?)\{\{\/if\}\}/);
          if (elseMatch && elseMatch[2]) {
            itemTemplate = elseMatch[2];
          } else {
            // Remove the entire conditional
            itemTemplate = itemTemplate.replace(/\{\{#if\s*\(eq\s+type\s+"HEADER"\)\}\}([\s\S]*?)\{\{\/if\}\}/g, '');
          }
        }
      }
      
      // If template has conditionals, process them with item context
      const itemContext = { ...context, type: item.type, name: item.name, description: item.description, quantity: item.quantity, rate: item.rate, amount: Number(item.quantity) * Number(item.rate) };
      itemTemplate = processConditionals(itemTemplate, itemContext);
      
      // Replace variables in item template
      itemTemplate = replaceVariables(itemTemplate, itemContext);
      
      // If itemRenderer is provided, use it (it handles the full rendering)
      // Otherwise, return the processed template
      if (itemRenderer) {
        return itemRenderer(item, index, isHeader);
      }
      
      return itemTemplate;
    }).join('');
    
    result = result.replace(fullMatch, itemsHTML);
  }
  
  return result;
}

/**
 * Replace variables: {{variable}}
 */
function replaceVariables(template: string, context: RenderContext): string {
  let result = template;
  
  // Replace all variables
  Object.entries(context).forEach(([key, value]) => {
    const stringValue = value === null || value === undefined ? '' : String(value);
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, stringValue);
  });
  
  // Clean up any remaining variables (replace with empty string)
  result = result.replace(/\{\{[^}]+\}\}/g, '');
  
  return result;
}

/**
 * Render a template with the given context
 */
export function renderTemplate(
  template: string,
  context: RenderContext,
  itemRenderer: (item: any, index: number, isHeader: boolean) => string
): string {
  let result = template;
  
  // Step 1: Process loops first (they contain conditionals and variables)
  result = processLoops(result, context, itemRenderer);
  
  // Step 2: Process conditionals
  result = processConditionals(result, context);
  
  // Step 3: Replace variables
  result = replaceVariables(result, context);
  
  // Step 4: Final cleanup - remove any remaining template syntax
  result = result.replace(/\{\{#if[^}]*\}\}([\s\S]*?)\{\{\/if\}\}/g, '');
  result = result.replace(/\{\{#each[^}]*\}\}([\s\S]*?)\{\{\/each\}\}/g, '');
  result = result.replace(/\{\{#else\}\}/g, '');
  result = result.replace(/\{\{[^}]+\}\}/g, '');
  
  return result;
}

