/**
 * Component SSR System
 * Server-side rendering for individual components
 */

export class ComponentSSR {
  private componentRegistry: Map<string, SSRComponent> = new Map();
  private cache: Map<string, string> = new Map();

  /**
   * Register component for SSR
   */
  register(name: string, component: SSRComponent): void {
    this.componentRegistry.set(name, component);
  }

  /**
   * Render component to string
   */
  async render(name: string, props: any = {}, context: any = {}): Promise<string> {
    const cacheKey = this.getCacheKey(name, props);
    
    // Check cache
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const component = this.componentRegistry.get(name);
    if (!component) {
      throw new Error(`Component "${name}" not found for SSR`);
    }

    try {
      let html = '';
      
      if (typeof component === 'function') {
        // Functional component
        html = await component(props, context);
      } else if (component.renderSSR) {
        // Class component with renderSSR method
        html = await component.renderSSR(props, context);
      } else if (component.render) {
        // Class component with render method
        const instance = new component(props);
        html = instance.render(props);
      } else {
        throw new Error(`Component "${name}" doesn't support SSR`);
      }

      // Cache result
      this.cache.set(cacheKey, html);
      
      return html;
    } catch (error) {
      console.error(`SSR failed for component "${name}":`, error);
      return `<!-- SSR Error: ${name} -->`;
    }
  }

  /**
   * Render multiple components
   */
  async renderAll(components: Array<{ name: string; props?: any }>, context: any = {}): Promise<string> {
    const renders = await Promise.allSettled(
      components.map(async ({ name, props }) => {
        try {
          return await this.render(name, props, context);
        } catch (error) {
          console.error(`Failed to render component "${name}":`, error);
          return `<!-- Failed to render: ${name} -->`;
        }
      })
    );

    return renders
      .map(result => result.status === 'fulfilled' ? result.value : '<!-- Rendering error -->')
      .join('\n');
  }

  /**
   * Clear component cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get all registered component names
   */
  getComponentNames(): string[] {
    return Array.from(this.componentRegistry.keys());
  }

  /**
   * Check if component is registered for SSR
   */
  hasComponent(name: string): boolean {
    return this.componentRegistry.has(name);
  }

  /**
   * Remove component from registry
   */
  removeComponent(name: string): boolean {
    const removed = this.componentRegistry.delete(name);
    
    // Remove from cache
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${name}:`)) {
        this.cache.delete(key);
      }
    }
    
    return removed;
  }

  /**
   * Get component instance
   */
  getComponent(name: string): SSRComponent | undefined {
    return this.componentRegistry.get(name);
  }

  private getCacheKey(name: string, props: any): string {
    const propsString = JSON.stringify(props);
    return `${name}:${propsString}`;
  }
}

export type SSRComponent = 
  | ((props: any, context: any) => string | Promise<string>)
  | { 
      new (props: any): any;
      renderSSR?: (props: any, context: any) => string | Promise<string>;
      render?: (props: any) => string;
    }
  | { renderSSR: (props: any, context: any) => string | Promise<string> };

export const componentSSR = new ComponentSSR();