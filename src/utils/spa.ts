/**
 * SPA Utilities
 * Tools for building Single Page Applications
 */

export class SPA {
  private routes: Map<string, RouteHandler> = new Map();
  private middlewares: Middleware[] = [];
  private currentRoute: string = '';
  private routeHistory: string[] = [];
  private maxHistory: number = 50;

  /**
   * Initialize SPA
   */
  init(options: SPAOptions = {}): void {
    // Set up history handling
    window.addEventListener('popstate', this.handlePopState.bind(this));
    
    // Set up link interception
    if (options.interceptLinks !== false) {
      this.interceptLinks();
    }
    
    // Handle initial route
    this.handleRoute(window.location.pathname);
    
    console.log('SPA initialized');
  }

  /**
   * Define a route
   */
  route(path: string, handler: RouteHandler): void {
    this.routes.set(path, handler);
  }

  /**
   * Add middleware
   */
  use(middleware: Middleware): void {
    this.middlewares.push(middleware);
  }

  /**
   * Navigate to route
   */
  navigate(path: string, data: any = {}, options: NavigateOptions = {}): void {
    // Run middlewares
    const middlewareResult = this.runMiddlewares('before', path, data);
    if (middlewareResult === false) {
      console.log('Navigation blocked by middleware');
      return;
    }

    // Update URL
    if (options.replace) {
      window.history.replaceState(data, '', path);
    } else {
      window.history.pushState(data, '', path);
    }

    // Handle route
    this.handleRoute(path, data);

    // Run after middlewares
    this.runMiddlewares('after', path, data);
  }

  /**
   * Get current route
   */
  getCurrentRoute(): string {
    return this.currentRoute;
  }

  /**
   * Get route history
   */
  getHistory(): string[] {
    return [...this.routeHistory];
  }

  /**
   * Go back in history
   */
  back(): void {
    window.history.back();
  }

  /**
   * Go forward in history
   */
  forward(): void {
    window.history.forward();
  }

  /**
   * Clear route history
   */
  clearHistory(): void {
    this.routeHistory = [];
  }

  /**
   * Create a link handler
   */
  createLinkHandler(element: HTMLElement, path: string, data: any = {}): () => void {
    return () => {
      this.navigate(path, data);
    };
  }

  /**
   * Handle route
   */
  private async handleRoute(path: string, data: any = {}): Promise<void> {
    this.currentRoute = path;
    
    // Add to history
    this.routeHistory.push(path);
    if (this.routeHistory.length > this.maxHistory) {
      this.routeHistory.shift();
    }

    // Find matching route
    let handler: RouteHandler | undefined;
    let params: RouteParams = {};

    for (const [routePattern, routeHandler] of this.routes.entries()) {
      const match = this.matchRoute(routePattern, path);
      if (match) {
        handler = routeHandler;
        params = match.params;
        break;
      }
    }

    if (handler) {
      try {
        await handler(params, data);
      } catch (error) {
        console.error(`Error handling route ${path}:`, error);
        
        // Fallback to 404
        this.handle404(path);
      }
    } else {
      this.handle404(path);
    }
  }

  /**
   * Match route pattern
   */
  private matchRoute(pattern: string, path: string): { params: RouteParams } | null {
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');
    
    if (patternParts.length !== pathParts.length) {
      return null;
    }

    const params: RouteParams = {};
    
    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i];
      const pathPart = pathParts[i];
      
      if (patternPart.startsWith(':')) {
        // Parameter
        const paramName = patternPart.slice(1);
        params[paramName] = pathPart;
      } else if (patternPart !== pathPart) {
        // Static part doesn't match
        return null;
      }
    }
    
    return { params };
  }

  /**
   * Handle 404
   */
  private handle404(path: string): void {
    const handler = this.routes.get('404');
    if (handler) {
      handler({}, { path });
    } else {
      console.warn(`No route found for: ${path}`);
      document.body.innerHTML = `<h1>404</h1><p>Page not found: ${path}</p>`;
    }
  }

  /**
   * Handle popstate (back/forward)
   */
  private handlePopState(event: PopStateEvent): void {
    const path = window.location.pathname;
    const data = event.state || {};
    this.handleRoute(path, data);
  }

  /**
   * Intercept link clicks
   */
  private interceptLinks(): void {
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a');
      
      if (link && link.href && link.href.startsWith(window.location.origin)) {
        event.preventDefault();
        const path = new URL(link.href).pathname;
        this.navigate(path);
      }
    });
  }

  /**
   * Run middlewares
   */
  private runMiddlewares(type: 'before' | 'after', path: string, data: any): boolean | void {
    for (const middleware of this.middlewares) {
      try {
        const result = middleware(type, path, data);
        if (type === 'before' && result === false) {
          return false;
        }
      } catch (error) {
        console.error('Middleware error:', error);
      }
    }
    return true;
  }

  /**
   * Create route table for navigation
   */
  createRouteTable(routes: Record<string, string>): RouteTable {
    const table: RouteTable = {};
    
    for (const [name, path] of Object.entries(routes)) {
      table[name] = {
        path,
        navigate: (data: any = {}, options: NavigateOptions = {}) => {
          this.navigate(path, data, options);
        },
        link: (data: any = {}) => {
          const url = new URL(path, window.location.origin);
          Object.entries(data).forEach(([key, value]) => {
            url.searchParams.set(key, String(value));
          });
          return url.toString();
        }
      };
    }
    
    return table;
  }
}

export interface SPAOptions {
  interceptLinks?: boolean;
  maxHistory?: number;
}

export interface NavigateOptions {
  replace?: boolean;
  silent?: boolean;
}

export interface RouteParams {
  [key: string]: string;
}

export type RouteHandler = (params: RouteParams, data: any) => void | Promise<void>;
export type Middleware = (type: 'before' | 'after', path: string, data: any) => boolean | void | Promise<boolean | void>;

export interface RouteTable {
  [name: string]: {
    path: string;
    navigate: (data?: any, options?: NavigateOptions) => void;
    link: (data?: any) => string;
  };
}

export const spa = new SPA();