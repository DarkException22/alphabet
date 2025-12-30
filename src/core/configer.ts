/**
 * Configuration System for Alphabet Framework
 * YAML-based configuration with DevOps friendliness
 */

import * as yaml from 'yaml';

export interface AlphabetConfig {
  app: {
    name: string;
    version: string;
    mode: 'development' | 'production' | 'testing';
  };
  server: {
    port: number;
    host: string;
    ssr: boolean;
    spa: boolean;
  };
  build: {
    minify: boolean;
    sourcemaps: boolean;
    target: 'es5' | 'es2015' | 'esnext';
  };
  plugins: string[];
  routes?: Record<string, any>;
  features?: Record<string, boolean>;
}

export class Configer {
  private config: AlphabetConfig;
  private configPath: string;
  private watchers: Set<(config: AlphabetConfig) => void> = new Set();

  constructor(defaultConfig: Partial<AlphabetConfig> = {}) {
    this.config = {
      app: {
        name: 'Alphabet App',
        version: '1.0.0',
        mode: 'development',
        ...defaultConfig.app
      },
      server: {
        port: 3000,
        host: 'localhost',
        ssr: true,
        spa: true,
        ...defaultConfig.server
      },
      build: {
        minify: false,
        sourcemaps: true,
        target: 'es2015',
        ...defaultConfig.build
      },
      plugins: [],
      ...defaultConfig
    };
  }

  /**
   * Load configuration from YAML file
   */
  async loadFromFile(filePath: string): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        // Browser environment
        const response = await fetch(filePath);
        const yamlContent = await response.text();
        this.config = { ...this.config, ...yaml.parse(yamlContent) };
      } else {
        // Node.js environment
        const fs = await import('fs');
        const yamlContent = fs.readFileSync(filePath, 'utf8');
        this.config = { ...this.config, ...yaml.parse(yamlContent) };
      }
      
      this.configPath = filePath;
      this.notifyWatchers();
      console.log(`Configuration loaded from ${filePath}`);
    } catch (error) {
      console.error(`Failed to load config from ${filePath}:`, error);
    }
  }

  /**
   * Save configuration to YAML file
   */
  async saveToFile(filePath?: string): Promise<void> {
    const path = filePath || this.configPath;
    if (!path) {
      throw new Error('No file path specified');
    }

    try {
      const yamlContent = yaml.stringify(this.config);
      
      if (typeof window !== 'undefined') {
        // Browser environment - can't save directly
        console.warn('Cannot save files directly in browser');
      } else {
        // Node.js environment
        const fs = await import('fs');
        fs.writeFileSync(path, yamlContent, 'utf8');
      }
      
      console.log(`Configuration saved to ${path}`);
    } catch (error) {
      console.error(`Failed to save config to ${path}:`, error);
    }
  }

  /**
   * Get configuration value
   */
  get<T = any>(path: string, defaultValue?: T): T {
    const keys = path.split('.');
    let value: any = this.config;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return defaultValue as T;
      }
    }
    
    return value as T;
  }

  /**
   * Set configuration value
   */
  set(path: string, value: any): void {
    const keys = path.split('.');
    let current: any = this.config;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
    this.notifyWatchers();
  }

  /**
   * Watch for configuration changes
   */
  watch(callback: (config: AlphabetConfig) => void): () => void {
    this.watchers.add(callback);
    return () => {
      this.watchers.delete(callback);
    };
  }

  /**
   * Get entire configuration
   */
  getAll(): AlphabetConfig {
    return { ...this.config };
  }

  /**
   * Merge with partial configuration
   */
  merge(partialConfig: Partial<AlphabetConfig>): void {
    this.config = this.deepMerge(this.config, partialConfig);
    this.notifyWatchers();
  }

  /**
   * Reset to default configuration
   */
  reset(): void {
    this.config = {
      app: {
        name: 'Alphabet App',
        version: '1.0.0',
        mode: 'development'
      },
      server: {
        port: 3000,
        host: 'localhost',
        ssr: true,
        spa: true
      },
      build: {
        minify: false,
        sourcemaps: true,
        target: 'es2015'
      },
      plugins: []
    };
    this.notifyWatchers();
  }

  private notifyWatchers(): void {
    for (const watcher of this.watchers) {
      try {
        watcher(this.config);
      } catch (error) {
        console.error('Error in config watcher:', error);
      }
    }
  }

  private deepMerge(target: any, source: any): any {
    const output = { ...target };
    
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            output[key] = source[key];
          } else {
            output[key] = this.deepMerge(target[key], source[key]);
          }
        } else {
          output[key] = source[key];
        }
      });
    }
    
    return output;
  }

  private isObject(item: any): boolean {
    return item && typeof item === 'object' && !Array.isArray(item);
  }
}