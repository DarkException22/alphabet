/**
 * Template Binder System
 * Supports {{ }} syntax for component binding
 */

export class Binder {
  private markers: Map<string, HTMLElement[]> = new Map();
  private componentCache: Map<string, any> = new Map();

  /**
   * Parse template and bind components
   */
  bind(template: string, context: any): string {
    const regex = /\{\{\s*([^}]+)\s*\}\}/g;
    
    return template.replace(regex, (match, expression) => {
      try {
        const value = this.evaluateExpression(expression.trim(), context);
        return value !== undefined ? String(value) : '';
      } catch (error) {
        console.error(`Error evaluating expression "${expression}":`, error);
        return '';
      }
    });
  }

  /**
   * Bind to existing DOM elements
   */
  bindToDOM(rootElement: HTMLElement, context: any): void {
    const elements = rootElement.querySelectorAll('[data-bind]');
    
    elements.forEach(element => {
      const expression = element.getAttribute('data-bind');
      if (expression) {
        this.bindElement(element, expression, context);
      }
    });

    // Also handle inline {{ }} in text nodes
    this.bindTextNodes(rootElement, context);
  }

  /**
   * Register a component for binding
   */
  registerComponent(name: string, component: any): void {
    this.componentCache.set(name, component);
  }

  /**
   * Get a component by name
   */
  getComponent(name: string): any {
    return this.componentCache.get(name);
  }

  private bindElement(element: HTMLElement, expression: string, context: any): void {
    const value = this.evaluateExpression(expression, context);
    
    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
      (element as HTMLInputElement).value = value || '';
      
      // Two-way binding
      element.addEventListener('input', (event) => {
        this.updateContext(context, expression, (event.target as HTMLInputElement).value);
      });
    } else {
      element.textContent = value !== undefined ? String(value) : '';
    }
  }

  private bindTextNodes(element: Node, context: any): void {
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null
    );

    let node: Node | null;
    while ((node = walker.nextNode())) {
      if (node.textContent && /\{\{.*\}\}/.test(node.textContent)) {
        const newText = this.bind(node.textContent, context);
        node.textContent = newText;
      }
    }
  }

  private evaluateExpression(expression: string, context: any): any {
    // Check if it's a component reference
    if (this.componentCache.has(expression)) {
      return this.componentCache.get(expression);
    }

    // Check if it's a method call
    if (expression.includes('(') && expression.includes(')')) {
      return this.evaluateMethodCall(expression, context);
    }

    // Simple property access
    return this.getProperty(context, expression);
  }

  private evaluateMethodCall(expression: string, context: any): any {
    const methodMatch = expression.match(/^([^(]+)\(([^)]*)\)$/);
    if (!methodMatch) return undefined;

    const methodName = methodMatch[1].trim();
    const argsString = methodMatch[2];
    const args = argsString ? argsString.split(',').map(arg => {
      const trimmed = arg.trim();
      // Check if it's a string literal
      if (trimmed.startsWith("'") && trimmed.endsWith("'") || 
          trimmed.startsWith('"') && trimmed.endsWith('"')) {
        return trimmed.slice(1, -1);
      }
      // Check if it's a number
      if (!isNaN(Number(trimmed))) {
        return Number(trimmed);
      }
      // Otherwise treat as property reference
      return this.getProperty(context, trimmed);
    }) : [];

    const method = this.getProperty(context, methodName);
    if (typeof method === 'function') {
      return method.apply(context, args);
    }

    return undefined;
  }

  private getProperty(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  private updateContext(context: any, path: string, value: any): void {
    const keys = path.split('.');
    let current = context;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]] || typeof current[keys[i]] !== 'object') {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
  }
}

export const binder = new Binder();