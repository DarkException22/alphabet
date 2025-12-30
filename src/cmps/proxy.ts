/**
 * Proxy-based Reactive System
 * Enables direct property observation without Virtual DOM
 */

export type ObserverCallback<T = any> = (value: T, oldValue: T) => void;

export class ReactiveProxy {
  private observers: Map<string, Set<ObserverCallback>> = new Map();
  private target: any;
  private proxy: any;

  constructor(target: any = {}) {
    this.target = this.deepClone(target);
    this.proxy = this.createProxy(this.target);
  }

  /**
   * Create reactive proxy
   */
  private createProxy(target: any, path: string = ''): any {
    if (typeof target !== 'object' || target === null) {
      return target;
    }

    return new Proxy(target, {
      get: (obj, prop: string) => {
        const value = obj[prop];
        
        // Return nested proxy for objects
        if (typeof value === 'object' && value !== null) {
          return this.createProxy(value, path ? `${path}.${prop}` : prop);
        }
        
        return value;
      },

      set: (obj, prop: string, value) => {
        const oldValue = obj[prop];
        
        // Handle arrays specially
        if (Array.isArray(obj)) {
          const arrayProxy = this.createArrayProxy(obj, path);
          return arrayProxy[prop] = value;
        }

        // Set the value
        obj[prop] = value;

        // Notify observers
        const fullPath = path ? `${path}.${prop}` : prop;
        this.notify(fullPath, value, oldValue);

        // Notify parent observers too
        if (path) {
          this.notify(path, obj, obj);
        }

        return true;
      },

      deleteProperty: (obj, prop: string) => {
        const oldValue = obj[prop];
        const deleted = delete obj[prop];
        
        if (deleted) {
          const fullPath = path ? `${path}.${prop}` : prop;
          this.notify(fullPath, undefined, oldValue);
        }

        return deleted;
      }
    });
  }

  /**
   * Special proxy for arrays
   */
  private createArrayProxy(array: any[], path: string): any {
    const arrayMethods = ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse'];
    
    return new Proxy(array, {
      get: (obj, prop: string) => {
        if (arrayMethods.includes(prop)) {
          return (...args: any[]) => {
            const oldArray = [...obj];
            const result = (obj as any)[prop](...args);
            
            // Notify array changes
            this.notify(path, obj, oldArray);
            
            // Notify for new items
            if (prop === 'push' || prop === 'unshift') {
              args.forEach((arg, index) => {
                const itemPath = `${path}[${prop === 'push' ? obj.length - args.length + index : index}]`;
                this.notify(itemPath, arg, undefined);
              });
            }
            
            return result;
          };
        }
        return obj[prop];
      }
    });
  }

  /**
   * Observe property changes
   */
  observe(path: string, callback: ObserverCallback): () => void {
    if (!this.observers.has(path)) {
      this.observers.set(path, new Set());
    }
    
    this.observers.get(path)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.observers.get(path)?.delete(callback);
    };
  }

  /**
   * Set reactive value
   */
  set(path: string, value: any): void {
    const keys = path.split('.');
    let current = this.proxy;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      const arrayMatch = key.match(/^(\w+)\[(\d+)\]$/);
      
      if (arrayMatch) {
        const [, arrayName, index] = arrayMatch;
        if (!current[arrayName]) {
          current[arrayName] = [];
        }
        if (!current[arrayName][index]) {
          current[arrayName][index] = {};
        }
        current = current[arrayName][index];
      } else {
        if (!current[key] || typeof current[key] !== 'object') {
          current[key] = {};
        }
        current = current[key];
      }
    }
    
    const lastKey = keys[keys.length - 1];
    current[lastKey] = value;
  }

  /**
   * Get reactive value
   */
  get(path: string): any {
    return path.split('.').reduce((obj, key) => {
      const arrayMatch = key.match(/^(\w+)\[(\d+)\]$/);
      
      if (arrayMatch) {
        const [, arrayName, index] = arrayMatch;
        return obj?.[arrayName]?.[index];
      }
      
      return obj?.[key];
    }, this.proxy);
  }

  /**
   * Get the entire reactive object
   */
  getProxy(): any {
    return this.proxy;
  }

  /**
   * Get the raw target object (non-reactive)
   */
  getTarget(): any {
    return this.target;
  }

  private notify(path: string, value: any, oldValue: any): void {
    const observers = this.observers.get(path);
    if (observers) {
      observers.forEach(callback => {
        try {
          callback(value, oldValue);
        } catch (error) {
          console.error(`Error in observer for path "${path}":`, error);
        }
      });
    }
  }

  private deepClone(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.deepClone(item));
    }
    
    const cloned: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = this.deepClone(obj[key]);
      }
    }
    
    return cloned;
  }
}

export function reactive<T extends object>(target: T): T {
  const proxy = new ReactiveProxy(target);
  return proxy.getProxy();
}