/**
 * Modularity System for Alphabet Framework
 * Enables modular architecture and dependency management
 */

export interface Module {
  name: string;
  version: string;
  dependencies?: string[];
  init?: () => void | Promise<void>;
  destroy?: () => void;
}

export class Modularity {
  private modules: Map<string, Module> = new Map();
  private initialized: Set<string> = new Set();

  /**
   * Register a new module
   */
  register(module: Module): void {
    if (this.modules.has(module.name)) {
      console.warn(`Module "${module.name}" is already registered`);
      return;
    }
    
    this.modules.set(module.name, module);
    console.log(`Module "${module.name}" registered successfully`);
  }

  /**
   * Initialize a module and its dependencies
   */
  async init(moduleName: string): Promise<void> {
    if (this.initialized.has(moduleName)) {
      return;
    }

    const module = this.modules.get(moduleName);
    if (!module) {
      throw new Error(`Module "${moduleName}" not found`);
    }

    // Initialize dependencies first
    if (module.dependencies) {
      for (const dep of module.dependencies) {
        await this.init(dep);
      }
    }

    // Initialize the module itself
    if (module.init) {
      await module.init();
    }

    this.initialized.add(moduleName);
    console.log(`Module "${moduleName}" initialized`);
  }

  /**
   * Get all registered modules
   */
  getAllModules(): Module[] {
    return Array.from(this.modules.values());
  }

  /**
   * Check if a module is registered
   */
  hasModule(name: string): boolean {
    return this.modules.has(name);
  }

  /**
   * Remove a module
   */
  remove(name: string): boolean {
    if (this.modules.has(name)) {
      const module = this.modules.get(name);
      if (module?.destroy) {
        module.destroy();
      }
      this.initialized.delete(name);
      return this.modules.delete(name);
    }
    return false;
  }

  /**
   * Clear all modules
   */
  clear(): void {
    for (const [name, module] of this.modules) {
      if (module.destroy) {
        module.destroy();
      }
    }
    this.modules.clear();
    this.initialized.clear();
  }
}

// Singleton instance
export const modularity = new Modularity();