/**
 * Utility SSR System
 * Server-side rendering for utilities
 */

export class UtilitySSR {
  private utilities: Map<string, SSRUtility> = new Map();
  private cache: Map<string, UtilitySSRResult> = new Map();

  /**
   * Register utility for SSR
   */
  register(name: string, utility: SSRUtility): void {
    this.utilities.set(name, utility);
  }

  /**
   * Render utility to string
   */
  async render(name: string, data: any = {}, context: any = {}): Promise<UtilitySSRResult> {
    const cacheKey = this.getCacheKey(name, data);
    
    // Check cache
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const utility = this.utilities.get(name);
    if (!utility) {
      throw new Error(`Utility "${name}" not found for SSR`);
    }

    try {
      let result: UtilitySSRResult = {
        html: '',
        data: {}
      };

      if (typeof utility === 'function') {
        // Functional utility
        const utilityResult = await utility(data, context);
        result = { ...result, ...utilityResult };
      } else if (utility.renderSSR) {
        // Object with renderSSR method
        const utilityResult = await utility.renderSSR(data, context);
        result = { ...result, ...utilityResult };
      } else {
        throw new Error(`Utility "${name}" doesn't support SSR`);
      }

      // Cache result
      this.cache.set(cacheKey, result);
      
      return result;
    } catch (error) {
      console.error(`Utility SSR failed for "${name}":`, error);
      
      return {
        html: `<!-- Utility SSR Error: ${name} -->`,
        data: {},
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Render multiple utilities
   */
  async renderAll(utilities: Array<{ name: string; data?: any }>, context: any = {}): Promise<UtilitySSRResult[]> {
    const results = await Promise.allSettled(
      utilities.map(async ({ name, data }) => {
        try {
          return await this.render(name, data, context);
        } catch (error) {
          console.error(`Failed to render utility "${name}":`, error);
          return {
            html: `<!-- Failed to render utility: ${name} -->`,
            data: {},
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );

    return results.map(result => 
      result.status === 'fulfilled' ? result.value : {
        html: '<!-- Rendering error -->',
        data: {},
        error: 'Promise rejected'
      }
    );
  }

  /**
   * Get utility data without rendering HTML
   */
  async getData(name: string, params: any = {}): Promise<any> {
    const utility = this.utilities.get(name);
    if (!utility) {
      throw new Error(`Utility "${name}" not found`);
    }

    try {
      if (typeof utility === 'function') {
        // Try to call as function
        const result = await utility(params, { ssr: false });
        return result.data || result;
      } else if (utility.getData) {
        // Object with getData method
        return await utility.getData(params);
      } else if (utility.data) {
        // Static data property
        return utility.data;
      }
      
      return {};
    } catch (error) {
      console.error(`Failed to get data from utility "${name}":`, error);
      return {};
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get all registered utility names
   */
  getUtilityNames(): string[] {
    return Array.from(this.utilities.keys());
  }

  /**
   * Check if utility is registered
   */
  hasUtility(name: string): boolean {
    return this.utilities.has(name);
  }

  /**
   * Remove utility from registry
   */
  removeUtility(name: string): boolean {
    const removed = this.utilities.delete(name);
    
    // Remove from cache
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${name}:`)) {
        this.cache.delete(key);
      }
    }
    
    return removed;
  }

  /**
   * Get utility instance
   */
  getUtility(name: string): SSRUtility | undefined {
    return this.utilities.get(name);
  }

  private getCacheKey(name: string, data: any): string {
    const dataString = JSON.stringify(data);
    return `${name}:${dataString}`;
  }
}

export type SSRUtility = 
  | ((data: any, context: any) => Promise<UtilitySSRResult> | UtilitySSRResult)
  | {
      renderSSR?: (data: any, context: any) => Promise<UtilitySSRResult> | UtilitySSRResult;
      getData?: (params: any) => Promise<any> | any;
      data?: any;
    };

export interface UtilitySSRResult {
  html: string;
  data: any;
  scripts?: string;
  styles?: string;
  error?: string;
}

export const utilitySSR = new UtilitySSR();