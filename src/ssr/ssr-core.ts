/**
 * Core SSR System
 * Server-side rendering for Alphabet core
 */

export class CoreSSR {
  private coreModules: Map<string, any> = new Map();
  private renderedCache: Map<string, CoreSSRResult> = new Map();

  /**
   * Register core module for SSR
   */
  registerModule(name: string, module: any): void {
    this.coreModules.set(name, module);
  }

  /**
   * Render core to string
   */
  async render(modules: string[] = [], options: CoreSSROptions = {}): Promise<CoreSSRResult> {
    const cacheKey = this.getCacheKey(modules, options);
    
    // Check cache
    if (options.cache !== false && this.renderedCache.has(cacheKey)) {
      return this.renderedCache.get(cacheKey)!;
    }

    const result: CoreSSRResult = {
      html: '',
      scripts: '',
      styles: '',
      modules: {}
    };

    try {
      // Render each module
      for (const moduleName of modules) {
        const module = this.coreModules.get(moduleName);
        if (!module) {
          console.warn(`Core module "${moduleName}" not found`);
          continue;
        }

        if (module.renderSSR) {
          const moduleResult = await module.renderSSR(options);
          result.modules[moduleName] = moduleResult;
          
          if (moduleResult.html) result.html += moduleResult.html;
          if (moduleResult.scripts) result.scripts += moduleResult.scripts;
          if (moduleResult.styles) result.styles += moduleResult.styles;
        }
      }

      // Add core initialization script
      result.scripts += this.getCoreInitScript(modules);

      // Cache result
      if (options.cache !== false) {
        this.renderedCache.set(cacheKey, result);
      }

      return result;
    } catch (error) {
      console.error('Core SSR failed:', error);
      
      return {
        ...result,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get core module
   */
  getModule(name: string): any {
    return this.coreModules.get(name);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.renderedCache.clear();
  }

  /**
   * Get initialization script for core modules
   */
  private getCoreInitScript(modules: string[]): string {
    const modulesJSON = JSON.stringify(modules);
    
    return `
      <script>
        // Alphabet Core SSR Initialization
        (function() {
          window.__ALPHABET_CORE_MODULES__ = ${modulesJSON};
          
          // Initialize modules when DOM is ready
          document.addEventListener('DOMContentLoaded', function() {
            if (window.Alphabet && window.Alphabet.initCoreModules) {
              window.Alphabet.initCoreModules(window.__ALPHABET_CORE_MODULES__);
            }
          });
        })();
      </script>
    `;
  }

  private getCacheKey(modules: string[], options: CoreSSROptions): string {
    const optionsString = JSON.stringify(options);
    const modulesString = modules.sort().join(',');
    return `${modulesString}:${optionsString}`;
  }
}

export interface CoreSSROptions {
  cache?: boolean;
  minify?: boolean;
  [key: string]: any;
}

export interface CoreSSRResult {
  html: string;
  scripts: string;
  styles: string;
  modules: Record<string, any>;
  error?: string;
}

export const coreSSR = new CoreSSR();