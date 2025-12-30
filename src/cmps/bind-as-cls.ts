/**
 * Class-based Component Binding
 * Components bound via HTML class attribute
 */

export class ClassBinder {
  private classPrefix = 'alphabet';
  private componentRegistry: Map<string, any> = new Map();
  private styleRegistry: Map<string, string> = new Map();

  constructor() {
    this.injectGlobalStyles();
  }

  /**
   * Register a component class
   */
  registerComponent(className: string, component: any, styles?: string): void {
    const fullClassName = `${this.classPrefix}-${className}`;
    this.componentRegistry.set(fullClassName, component);
    
    if (styles) {
      this.styleRegistry.set(fullClassName, styles);
      this.injectComponentStyles(fullClassName, styles);
    }
  }

  /**
   * Bind all components in the document
   */
  bindAll(root: HTMLElement | Document = document): void {
    const elements = root.querySelectorAll('[class]');
    
    elements.forEach(element => {
      this.bindElement(element as HTMLElement);
    });

    // Watch for DOM changes
    this.observeDOM(root);
  }

  /**
   * Bind a single element
   */
  bindElement(element: HTMLElement): void {
    const classNames = element.className.split(' ');
    
    classNames.forEach(className => {
      if (this.componentRegistry.has(className)) {
        this.initializeComponent(element, className);
      }
    });
  }

  /**
   * Initialize component on element
   */
  private initializeComponent(element: HTMLElement, className: string): void {
    const Component = this.componentRegistry.get(className);
    if (!Component) return;

    // Check if already initialized
    if ((element as any).__alphabet_class_component?.[className]) {
      return;
    }

    // Extract configuration from data attributes
    const config: any = {};
    for (const attr of element.attributes) {
      if (attr.name.startsWith('data-')) {
        const key = attr.name.replace('data-', '');
        config[key] = this.parseConfigValue(attr.value);
      }
    }

    // Create component instance
    let componentInstance;
    try {
      if (typeof Component === 'function') {
        componentInstance = new Component(config);
      } else if (typeof Component === 'object') {
        componentInstance = { ...Component, ...config };
      } else {
        componentInstance = Component;
      }

      // Store instance reference
      if (!(element as any).__alphabet_class_component) {
        (element as any).__alphabet_class_component = {};
      }
      (element as any).__alphabet_class_component[className] = componentInstance;

      // Initialize component
      if (componentInstance.init) {
        componentInstance.init(element);
      }

      if (componentInstance.mount) {
        componentInstance.mount(element);
      }

      console.log(`Component "${className}" initialized on`, element);
    } catch (error) {
      console.error(`Error initializing component "${className}":`, error);
    }
  }

  /**
   * Parse configuration value
   */
  private parseConfigValue(value: string): any {
    // Try to parse as JSON
    if (value.startsWith('{') || value.startsWith('[')) {
      try {
        return JSON.parse(value);
      } catch {
        // Not valid JSON, continue
      }
    }

    // Try to parse as number
    if (!isNaN(Number(value)) && value.trim() !== '') {
      return Number(value);
    }

    // Try to parse as boolean
    if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') {
      return value.toLowerCase() === 'true';
    }

    // Return as string
    return value;
  }

  /**
   * Inject global styles
   */
  private injectGlobalStyles(): void {
    if (typeof document === 'undefined') return;

    const styleId = 'alphabet-class-binder-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .alphabet-component {
        position: relative;
        box-sizing: border-box;
      }
      
      .alphabet-component::before {
        content: 'A';
        position: absolute;
        top: 2px;
        left: 2px;
        font-size: 8px;
        opacity: 0.3;
        pointer-events: none;
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * Inject component-specific styles
   */
  private injectComponentStyles(className: string, css: string): void {
    if (typeof document === 'undefined') return;

    const styleId = `alphabet-style-${className}`;
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = css;

    document.head.appendChild(style);
  }

  /**
   * Observe DOM for new elements
   */
  private observeDOM(root: HTMLElement | Document): void {
    if (typeof MutationObserver === 'undefined') return;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.bindElement(node as HTMLElement);
              
              // Also bind children
              const children = (node as HTMLElement).querySelectorAll('[class]');
              children.forEach(child => this.bindElement(child as HTMLElement));
            }
          });
        }
        
        // Handle class changes
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          this.bindElement(mutation.target as HTMLElement);
        }
      });
    });

    observer.observe(root instanceof Document ? root.body : root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });
  }

  /**
   * Get all registered component names
   */
  getComponentNames(): string[] {
    return Array.from(this.componentRegistry.keys());
  }

  /**
   * Check if a component is registered
   */
  hasComponent(className: string): boolean {
    return this.componentRegistry.has(className);
  }

  /**
   * Remove a component registration
   */
  removeComponent(className: string): boolean {
    const removed = this.componentRegistry.delete(className);
    this.styleRegistry.delete(className);
    return removed;
  }
}

export const classBinder = new ClassBinder();