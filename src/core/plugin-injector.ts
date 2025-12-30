/**
 * Plugin Injector System for Alphabet Framework
 * Dynamic plugin injection with minification support
 */

export interface Plugin {
  name: string;
  version: string;
  main: string;
  dependencies?: string[];
  install: (context: PluginContext) => void | Promise<void>;
  uninstall?: () => void;
}

export interface PluginContext {
  app: any;
  config: any;
  utils: any;
  modularity: any;
}

export class PluginInjector {
  private plugins: Map<string, Plugin> = new Map();
  private loaded: Map<string, any> = new Map();
  private context: PluginContext;

  constructor(context: PluginContext) {
    this.context = context;
  }

  /**
   * Inject a plugin dynamically
   */
  async inject(pluginPath: string, options: any = {}): Promise<boolean> {
    try {
      // Dynamic import
      const module = await import(/* webpackIgnore: true */ pluginPath);
      const plugin = module.default || module;
      
      if (!plugin.name || !plugin.install) {
        throw new Error('Invalid plugin structure');
      }

      // Check dependencies
      if (plugin.dependencies) {
        for (const dep of plugin.dependencies) {
          if (!this.plugins.has(dep)) {
            console.warn(`Dependency "${dep}" not found for plugin "${plugin.name}"`);
          }
        }
      }

      // Minify plugin code if it's a string
      if (typeof plugin.code === 'string' && options.minify !== false) {
        plugin.code = this.minifyCode(plugin.code);
      }

      // Store plugin
      this.plugins.set(plugin.name, plugin);
      
      // Install plugin
      await plugin.install(this.context);
      
      console.log(`Plugin "${plugin.name}" injected successfully`);
      return true;
    } catch (error) {
      console.error(`Failed to inject plugin from ${pluginPath}:`, error);
      return false;
    }
  }

  /**
   * Inject multiple plugins
   */
  async injectAll(pluginPaths: string[]): Promise<void> {
    const results = await Promise.allSettled(
      pluginPaths.map(path => this.inject(path))
    );
    
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Failed to inject plugin ${pluginPaths[index]}:`, result.reason);
      }
    });
  }

  /**
   * Simple code minifier
   */
  private minifyCode(code: string): string {
    // Basic minification - remove comments and whitespace
    return code
      .replace(/\/\*[\s\S]*?\*\//g, '')  // Multi-line comments
      .replace(/\/\/.*$/gm, '')          // Single-line comments
      .replace(/\s+/g, ' ')              // Multiple spaces to single space
      .replace(/^\s+|\s+$/gm, '')        // Trim lines
      .replace(/\s*([{}();:,])\s*/g, '$1'); // Remove spaces around punctuation
  }

  /**
   * Get all injected plugins
   */
  getPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get a specific plugin
   */
  getPlugin(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * Remove a plugin
   */
  removePlugin(name: string): boolean {
    const plugin = this.plugins.get(name);
    if (plugin) {
      if (plugin.uninstall) {
        plugin.uninstall();
      }
      return this.plugins.delete(name);
    }
    return false;
  }

  /**
   * Clear all plugins
   */
  clear(): void {
    for (const plugin of this.plugins.values()) {
      if (plugin.uninstall) {
        plugin.uninstall();
      }
    }
    this.plugins.clear();
    this.loaded.clear();
  }
}