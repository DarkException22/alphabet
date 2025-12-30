/**
 * Attribute-based Component Binding
 * Uses data-alphabet-* attributes
 */

export class AttributeBinder {
  private componentRegistry: Map<string, any> = new Map();
  private attributePrefix = 'data-alphabet';
  private mutationObserver: MutationObserver;

  constructor() {
    this.mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.scanAndBind(node as HTMLElement);
            }
          });
        }
      });
    });
  }

  /**
   * Register a component
   */
  registerComponent(name: string, component: any): void {
    this.componentRegistry.set(name, component);
  }

  /**
   * Scan DOM and bind components
   */
  scanAndBind(root: HTMLElement | Document = document): void {
    // Find all elements with alphabet attributes
    const selector = `[${this.attributePrefix}-cmp], [${this.attributePrefix}-bind]`;
    const elements = root.querySelectorAll(selector);
    
    elements.forEach(element => {
      this.bindElement(element as HTMLElement);
    });

    // Observe future DOM changes
    if (root instanceof HTMLElement || root === document) {
      this.mutationObserver.observe(root, {
        childList: true,
        subtree: true
      });
    }
  }

  /**
   * Bind a single element
   */
  bindElement(element: HTMLElement): void {
    // Handle component binding
    const componentAttr = element.getAttribute(`${this.attributePrefix}-cmp`);
    if (componentAttr) {
      this.bindComponent(element, componentAttr);
    }

    // Handle data binding
    const bindAttr = element.getAttribute(`${this.attributePrefix}-bind`);
    if (bindAttr) {
      this.bindData(element, bindAttr);
    }

    // Handle event binding
    this.bindEvents(element);
  }

  /**
   * Bind component to element
   */
  private bindComponent(element: HTMLElement, componentName: string): void {
    const Component = this.componentRegistry.get(componentName);
    if (!Component) {
      console.warn(`Component "${componentName}" not found`);
      return;
    }

    // Extract props from data attributes
    const props: any = {};
    for (const attr of element.attributes) {
      if (attr.name.startsWith(`${this.attributePrefix}-prop-`)) {
        const propName = attr.name.replace(`${this.attributePrefix}-prop-`, '');
        props[propName] = this.parseAttributeValue(attr.value);
      }
    }

    // Create component instance
    let componentInstance;
    if (typeof Component === 'function') {
      componentInstance = new Component(props);
    } else {
      componentInstance = Component;
    }

    // Apply component to element
    this.applyComponent(element, componentInstance);
  }

  /**
   * Bind data to element
   */
  private bindData(element: HTMLElement, expression: string): void {
    // This would be connected to the reactive proxy system
    // For now, it's a placeholder
    console.log(`Binding data: ${expression} to element`, element);
  }

  /**
   * Bind events to element
   */
  private bindEvents(element: HTMLElement): void {
    for (const attr of element.attributes) {
      const eventMatch = attr.name.match(new RegExp(`^${this.attributePrefix}-on-([a-z]+)$`));
      if (eventMatch) {
        const eventName = eventMatch[1];
        const handlerExpression = attr.value;
        
        element.addEventListener(eventName, (event) => {
          this.executeEventHandler(element, handlerExpression, event);
        });
      }
    }
  }

  /**
   * Apply component instance to element
   */
  private applyComponent(element: HTMLElement, component: any): void {
    if (component.render) {
      const rendered = component.render();
      if (typeof rendered === 'string') {
        element.innerHTML = rendered;
      } else if (rendered instanceof HTMLElement) {
        element.innerHTML = '';
        element.appendChild(rendered);
      }
    }

    if (component.mount) {
      component.mount(element);
    }

    // Store component reference
    (element as any).__alphabet_component = component;
  }

  /**
   * Execute event handler expression
   */
  private executeEventHandler(element: HTMLElement, expression: string, event: Event): void {
    // Get component instance
    const component = (element as any).__alphabet_component;
    const context = component || window;
    
    // Simple expression evaluation
    try {
      if (expression.includes('(') && expression.endsWith(')')) {
        // Method call
        const methodName = expression.substring(0, expression.indexOf('('));
        const method = this.getProperty(context, methodName);
        if (typeof method === 'function') {
          method.call(context, event);
        }
      } else {
        // Property access or simple expression
        const result = this.evaluateExpression(expression, context);
        if (typeof result === 'function') {
          result.call(context, event);
        }
      }
    } catch (error) {
      console.error(`Error executing event handler "${expression}":`, error);
    }
  }

  /**
   * Parse attribute value (could be JSON, string, or expression)
   */
  private parseAttributeValue(value: string): any {
    // Try to parse as JSON
    try {
      return JSON.parse(value);
    } catch {
      // Not JSON, return as string
      return value;
    }
  }

  private getProperty(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  private evaluateExpression(expression: string, context: any): any {
    // Simple expression evaluation
    // In production, use a proper expression parser
    try {
      return new Function('context', `with(context) { return ${expression} }`)(context);
    } catch (error) {
      console.error(`Error evaluating expression "${expression}":`, error);
      return undefined;
    }
  }

  /**
   * Stop observing DOM changes
   */
  disconnect(): void {
    this.mutationObserver.disconnect();
  }
}

export const attributeBinder = new AttributeBinder();