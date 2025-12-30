/**
 * Reactive Update System
 * Handles efficient DOM updates for reactive elements
 */

export class ReactiveUpdate {
  private updateHandlers: Map<string, UpdateHandler[]> = new Map();
  private scheduledUpdates: Map<HTMLElement, UpdateTask> = new Map();
  private rafId: number | null = null;
  private batchMode = false;
  private batchQueue: UpdateTask[] = [];

  /**
   * Register update handler for element type
   */
  registerHandler(elementSelector: string, handler: UpdateHandler): void {
    if (!this.updateHandlers.has(elementSelector)) {
      this.updateHandlers.set(elementSelector, []);
    }
    this.updateHandlers.get(elementSelector)!.push(handler);
  }

  /**
   * Schedule an update for an element
   */
  scheduleUpdate(element: HTMLElement, changes: DOMChanges, priority: UpdatePriority = 'normal'): void {
    const task: UpdateTask = {
      element,
      changes,
      priority,
      timestamp: Date.now()
    };

    if (this.batchMode) {
      this.batchQueue.push(task);
    } else {
      this.scheduledUpdates.set(element, task);
      this.requestUpdate();
    }
  }

  /**
   * Start batch mode
   */
  startBatch(): void {
    this.batchMode = true;
    this.batchQueue = [];
  }

  /**
   * End batch mode and apply all updates
   */
  endBatch(): void {
    this.batchMode = false;
    
    // Group updates by element
    const grouped = new Map<HTMLElement, DOMChanges>();
    
    this.batchQueue.forEach(task => {
      if (!grouped.has(task.element)) {
        grouped.set(task.element, {});
      }
      
      const existing = grouped.get(task.element)!;
      grouped.set(task.element, { ...existing, ...task.changes });
    });
    
    // Apply grouped updates
    grouped.forEach((changes, element) => {
      this.scheduledUpdates.set(element, {
        element,
        changes,
        priority: 'normal',
        timestamp: Date.now()
      });
    });
    
    this.batchQueue = [];
    this.requestUpdate();
  }

  /**
   * Apply immediate update (high priority)
   */
  updateImmediate(element: HTMLElement, changes: DOMChanges): void {
    this.applyUpdate(element, changes);
  }

  /**
   * Request update via requestAnimationFrame
   */
  private requestUpdate(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
    }
    
    this.rafId = requestAnimationFrame(() => {
      this.processUpdates();
      this.rafId = null;
    });
  }

  /**
   * Process all scheduled updates
   */
  private processUpdates(): void {
    // Sort by priority and timestamp
    const tasks = Array.from(this.scheduledUpdates.values())
      .sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        
        if (priorityDiff !== 0) return priorityDiff;
        return a.timestamp - b.timestamp;
      });

    // Apply updates
    tasks.forEach(task => {
      this.applyUpdate(task.element, task.changes);
      this.scheduledUpdates.delete(task.element);
    });
  }

  /**
   * Apply update to element
   */
  private applyUpdate(element: HTMLElement, changes: DOMChanges): void {
    // Find appropriate handler
    let handlerApplied = false;
    
    for (const [selector, handlers] of this.updateHandlers.entries()) {
      if (element.matches(selector)) {
        handlers.forEach(handler => {
          try {
            handler(element, changes);
            handlerApplied = true;
          } catch (error) {
            console.error(`Error in update handler for "${selector}":`, error);
          }
        });
        break;
      }
    }

    // Default handler if no specific handler found
    if (!handlerApplied) {
      this.defaultUpdateHandler(element, changes);
    }

    // Dispatch update event
    element.dispatchEvent(new CustomEvent('alphabet:updated', {
      detail: { changes },
      bubbles: true
    }));
  }

  /**
   * Default update handler
   */
  private defaultUpdateHandler(element: HTMLElement, changes: DOMChanges): void {
    // Apply text changes
    if (changes.text !== undefined) {
      if (element.childNodes.length === 1 && element.firstChild?.nodeType === Node.TEXT_NODE) {
        element.firstChild.textContent = String(changes.text);
      } else {
        element.textContent = String(changes.text);
      }
    }

    // Apply HTML changes
    if (changes.html !== undefined) {
      element.innerHTML = changes.html;
    }

    // Apply attribute changes
    if (changes.attributes) {
      Object.entries(changes.attributes).forEach(([name, value]) => {
        if (value === null || value === undefined) {
          element.removeAttribute(name);
        } else {
          element.setAttribute(name, String(value));
        }
      });
    }

    // Apply style changes
    if (changes.styles) {
      Object.entries(changes.styles).forEach(([property, value]) => {
        (element.style as any)[property] = value;
      });
    }

    // Apply class changes
    if (changes.classes) {
      Object.entries(changes.classes).forEach(([className, shouldAdd]) => {
        if (shouldAdd) {
          element.classList.add(className);
        } else {
          element.classList.remove(className);
        }
      });
    }

    // Apply dataset changes
    if (changes.dataset) {
      Object.entries(changes.dataset).forEach(([key, value]) => {
        element.dataset[key] = value;
      });
    }
  }

  /**
   * Get all scheduled updates
   */
  getScheduledUpdates(): UpdateTask[] {
    return Array.from(this.scheduledUpdates.values());
  }

  /**
   * Clear all scheduled updates
   */
  clearUpdates(): void {
    this.scheduledUpdates.clear();
    this.batchQueue = [];
    
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * Remove all handlers
   */
  clearHandlers(): void {
    this.updateHandlers.clear();
  }
}

export interface DOMChanges {
  text?: string | number;
  html?: string;
  attributes?: Record<string, string | null>;
  styles?: Record<string, string>;
  classes?: Record<string, boolean>;
  dataset?: Record<string, string>;
}

export type UpdateHandler = (element: HTMLElement, changes: DOMChanges) => void;
export type UpdatePriority = 'critical' | 'high' | 'normal' | 'low';

interface UpdateTask {
  element: HTMLElement;
  changes: DOMChanges;
  priority: UpdatePriority;
  timestamp: number;
}

export const reactiveUpdate = new ReactiveUpdate();