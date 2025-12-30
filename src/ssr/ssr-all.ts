/**
 * Complete SSR System
 * Handles server-side rendering with client-side hydration
 */

export class SSR {
  private components: Map<string, any> = new Map();
  private utils: Map<string, any> = new Map();
  private options: SSROptions;
  private cache: Map<string, SSRResult> = new Map();
  private isServer: boolean;

  constructor(options: SSROptions = {}) {
    this.options = {
      cache: true,
      cacheTTL: 300000, // 5 minutes
      minify: true,
      inlineStyles: true,
      ...options
    };
    
    this.isServer = typeof window === 'undefined';
  }

  /**
   * Render complete application
   */
  async render(app: any, url: string, initialState: any = {}): Promise<SSRResult> {
    const cacheKey = this.getCacheKey(url, initialState);
    
    // Check cache
    if (this.options.cache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < (this.options.cacheTTL || 0)) {
        return cached;
      }
    }

    try {
      // Server-side rendering
      let html = '';
      let css = '';
      let scripts = '';
      let stateScript = '';

      if (this.isServer) {
        // Render components
        const componentHtml = await this.renderComponents(app);
        
        // Render utilities
        const utilityHtml = await this.renderUtilities(app);
        
        // Build HTML structure
        html = this.buildHTML({
          title: app.title || 'Alphabet App',
          content: componentHtml + utilityHtml,
          styles: css,
          scripts,
          initialState
        });
        
        // Minify if enabled
        if (this.options.minify) {
          html = this.minifyHTML(html);
        }
      } else {
        // Client-side fallback
        html = '<div id="app">Client-side rendering fallback</div>';
      }

      const result: SSRResult = {
        html,
        css,
        scripts,
        state: initialState,
        timestamp: Date.now()
      };

      // Cache result
      if (this.options.cache) {
        this.cache.set(cacheKey, result);
      }

      return result;
    } catch (error) {
      console.error('SSR rendering failed:', error);
      
      // Return error fallback
      return {
        html: '<div id="app">SSR rendering failed</div>',
        css: '',
        scripts: '',
        state: initialState,
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Hydrate client-side
   */
  hydrate(app: any, elementId: string = 'app'): void {
    if (this.isServer) {
      console.warn('Hydration should only be called on the client');
      return;
    }

    const appElement = document.getElementById(elementId);
    if (!appElement) {
      console.error(`Element #${elementId} not found for hydration`);
      return;
    }

    try {
      // Extract initial state
      const stateScript = document.getElementById('alphabet-initial-state');
      let initialState = {};
      
      if (stateScript?.textContent) {
        try {
          initialState = JSON.parse(stateScript.textContent);
        } catch (e) {
          console.warn('Failed to parse initial state', e);
        }
      }

      // Initialize app with state
      if (app.init) {
        app.init(initialState);
      }

      // Attach event listeners
      this.attachEventListeners(appElement, app);

      // Mark as hydrated
      appElement.setAttribute('data-hydrated', 'true');
      
      console.log('Application hydrated successfully');
    } catch (error) {
      console.error('Hydration failed:', error);
    }
  }

  /**
   * Register component for SSR
   */
  registerComponent(name: string, component: any): void {
    this.components.set(name, component);
  }

  /**
   * Register utility for SSR
   */
  registerUtility(name: string, utility: any): void {
    this.utils.set(name, utility);
  }

  /**
   * Clear SSR cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): CacheStats {
    return {
      size: this.cache.size,
      hits: 0, // You'd need to track this
      misses: 0 // You'd need to track this
    };
  }

  private async renderComponents(app: any): Promise<string> {
    let html = '';
    
    for (const [name, component] of this.components.entries()) {
      try {
        if (component.renderSSR) {
          const componentHtml = await component.renderSSR(app.state || {});
          html += componentHtml;
        } else if (component.render) {
          const componentHtml = component.render(app.state || {});
          html += componentHtml;
        }
      } catch (error) {
        console.error(`Error rendering component ${name}:`, error);
        html += `<!-- Error rendering component: ${name} -->`;
      }
    }
    
    return html;
  }

  private async renderUtilities(app: any): Promise<string> {
    let html = '';
    
    for (const [name, utility] of this.utils.entries()) {
      try {
        if (utility.renderSSR) {
          const utilityHtml = await utility.renderSSR(app.state || {});
          html += utilityHtml;
        }
      } catch (error) {
        console.error(`Error rendering utility ${name}:`, error);
      }
    }
    
    return html;
  }

  private buildHTML(options: BuildHTMLOptions): string {
    const { title, content, styles, scripts, initialState } = options;
    
    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
          ${styles ? `<style>${styles}</style>` : ''}
          ${this.options.inlineStyles ? this.getInlineStyles() : ''}
        </head>
        <body>
          <div id="app">${content}</div>
          ${scripts ? `<script>${scripts}</script>` : ''}
          ${this.getStateScript(initialState)}
          ${this.getHydrationScript()}
        </body>
      </html>
    `;
  }

  private getInlineStyles(): string {
    return `
      <style>
        /* Basic reset */
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        /* SSR loading state */
        [data-ssr] { opacity: 0; transition: opacity 0.3s; }
        [data-ssr].loaded { opacity: 1; }
      </style>
    `;
  }

  private getStateScript(state: any): string {
    const stateJSON = JSON.stringify(state).replace(/</g, '\\u003c');
    return `
      <script id="alphabet-initial-state" type="application/json">
        ${stateJSON}
      </script>
    `;
  }

  private getHydrationScript(): string {
    return `
      <script>
        // Auto-hydration when DOM is ready
        if (typeof window !== 'undefined') {
          document.addEventListener('DOMContentLoaded', function() {
            if (window.Alphabet && window.Alphabet.SSR) {
              window.Alphabet.SSR.hydrate(window.__ALPHABET_APP__, 'app');
            }
          });
        }
      </script>
    `;
  }

  private minifyHTML(html: string): string {
    return html
      .replace(/\s+/g, ' ')
      .replace(/>\s+</g, '><')
      .replace(/\s+>/g, '>')
      .replace(/<\s+/g, '<')
      .trim();
  }

  private getCacheKey(url: string, state: any): string {
    const stateString = JSON.stringify(state);
    return `${url}:${stateString}`;
  }

  private attachEventListeners(element: HTMLElement, app: any): void {
    // Attach click handlers
    const clickElements = element.querySelectorAll('[data-alphabet-click]');
    clickElements.forEach(el => {
      const handlerName = el.getAttribute('data-alphabet-click');
      if (handlerName && app[handlerName]) {
        el.addEventListener('click', app[handlerName].bind(app));
      }
    });

    // Attach input handlers
    const inputElements = element.querySelectorAll('[data-alphabet-input]');
    inputElements.forEach(el => {
      const handlerName = el.getAttribute('data-alphabet-input');
      if (handlerName && app[handlerName]) {
        el.addEventListener('input', app[handlerName].bind(app));
      }
    });

    // Mark as interactive
    element.setAttribute('data-interactive', 'true');
  }
}

export interface SSROptions {
  cache?: boolean;
  cacheTTL?: number;
  minify?: boolean;
  inlineStyles?: boolean;
}

export interface SSRResult {
  html: string;
  css: string;
  scripts: string;
  state: any;
  timestamp: number;
  error?: string;
}

export interface BuildHTMLOptions {
  title: string;
  content: string;
  styles?: string;
  scripts?: string;
  initialState?: any;
}

export interface CacheStats {
  size: number;
  hits: number;
  misses: number;
}

export const ssr = new SSR();