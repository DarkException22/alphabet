/**
 * Reactive DOM Transformation
 * Converts regular DOM to reactive DOM without Virtual DOM
 */

export class ReactiveDOM {
  private reactiveElements: Set<HTMLElement> = new Set();
  private observers: Map<HTMLElement, MutationObserver[]> = new Map();
  private updateQueue: Set<HTMLElement> = new Set();
  private isUpdating = false;

  /**
   * Make an element reactive
   */
  makeReactive(element: HTMLElement, options: ReactiveOptions = {}): void {
    if (this.reactiveElements.has(element)) {
      return; // Already reactive
    }

    this.reactiveElements.add(element);
    
    // Observe attribute changes
    this.observeAttributes(element, options);
    
    // Observe text content changes
    this.observeContent(element, options);
    
    // Observe child list changes
    this.observeChildren(element, options);

    console.log(`Element made reactive:`, element);
  }

  /**
   * Make entire subtree reactive
   */
  makeReactiveSubtree(root: HTMLElement, options: ReactiveOptions = {}): void {
    // Make root reactive
    this.makeReactive(root, options);
    
    // Make all children reactive
    const allElements = root.querySelectorAll('*');
    allElements.forEach(element => {
      this.makeReactive(element as HTMLElement, options);
    });
    
    // Observe for new elements
    this.observeNewElements(root, options);
  }

  /**
   * Observe attribute changes
   */
  private observeAttributes(element: HTMLElement, options: ReactiveOptions): void {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.type === 'attributes') {
          this.handleAttributeChange(
            element,
            mutation.attributeName!,
            element.getAttribute(mutation.attributeName!)
          );
        }
      });
    });

    observer.observe(element, {
      attributes: true,
      attributeFilter: options.observeAttributes || undefined
    });

    this.addObserver(element, observer);
  }

  /**
   * Observe text content changes
   */
  private observeContent(element: HTMLElement, options: ReactiveOptions): void {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.type === 'characterData') {
          this.handleContentChange(element, mutation.target.textContent || '');
        }
      });
    });

    // Observe text nodes within the element
    const config: MutationObserverInit = {
      characterData: true,
      subtree: true,
      childList: true
    };

    observer.observe(element, config);
    this.addObserver(element, observer);
  }

  /**
   * Observe child list changes
   */
  private observeChildren(element: HTMLElement, options: ReactiveOptions): void {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          // Handle added nodes
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.handleElementAdded(element, node as HTMLElement);
            }
          });
          
          // Handle removed nodes
          mutation.removedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.handleElementRemoved(element, node as HTMLElement);
            }
          });
        }
      });
    });

    observer.observe(element, {
      childList: true,
      subtree: options.observeSubtree || false
    });

    this.addObserver(element, observer);
  }

  /**
   * Observe for new elements to make reactive
   */
  private observeNewElements(root: HTMLElement, options: ReactiveOptions): void {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.makeReactiveSubtree(node as HTMLElement, options);
            }
          });
        }
      });
    });

    observer.observe(root, {
      childList: true,
      subtree: true
    });

    this.addObserver(root, observer);
  }

  /**
   * Handle attribute change
   */
  private handleAttributeChange(element: HTMLElement, attributeName: string, newValue: string | null): void {
    // Queue for update
    this.queueUpdate(element);
    
    // Dispatch custom event
    element.dispatchEvent(new CustomEvent('alphabet:attribute-change', {
      detail: { attributeName, newValue, oldValue: element.getAttribute(attributeName) },
      bubbles: true
    }));
  }

  /**
   * Handle content change
   */
  private handleContentChange(element: HTMLElement, newContent: string): void {
    this.queueUpdate(element);
    
    element.dispatchEvent(new CustomEvent('alphabet:content-change', {
      detail: { newContent },
      bubbles: true
    }));
  }

  /**
   * Handle element added
   */
  private handleElementAdded(parent: HTMLElement, element: HTMLElement): void {
    // Make new element reactive
    this.makeReactive(element);
    
    this.queueUpdate(parent);
    
    parent.dispatchEvent(new CustomEvent('alphabet:child-added', {
      detail: { element },
      bubbles: true
    }));
  }

  /**
   * Handle element removed
   */
  private handleElementRemoved(parent: HTMLElement, element: HTMLElement): void {
    // Clean up reactive element
    this.cleanupElement(element);
    
    this.queueUpdate(parent);
    
    parent.dispatchEvent(new CustomEvent('alphabet:child-removed', {
      detail: { element },
      bubbles: true
    }));
  }

  /**
   * Queue element for update
   */
  private queueUpdate(element: HTMLElement): void {
    this.updateQueue.add(element);
    
    if (!this.isUpdating) {
      this.isUpdating = true;
      
      // Use microtask for batch updates
      Promise.resolve().then(() => {
        this.processUpdateQueue();
      });
    }
  }

  /**
   * Process all queued updates
   */
  private processUpdateQueue(): void {
    this.updateQueue.forEach(element => {
      this.performUpdate(element);
    });
    
    this.updateQueue.clear();
    this.isUpdating = false;
  }

  /**
   * Perform actual DOM update
   */
  private performUpdate(element: HTMLElement): void {
    // Here you would apply any reactive bindings
    // For now, just dispatch update event
    element.dispatchEvent(new CustomEvent('alphabet:update', {
      bubbles: true
    }));
  }

  /**
   * Add observer to element's observer list
   */
  private addObserver(element: HTMLElement, observer: MutationObserver): void {
    if (!this.observers.has(element)) {
      this.observers.set(element, []);
    }
    this.observers.get(element)!.push(observer);
  }

  /**
   * Clean up element observers
   */
  private cleanupElement(element: HTMLElement): void {
    const observers = this.observers.get(element);
    if (observers) {
      observers.forEach(observer => observer.disconnect());
      this.observers.delete(element);
    }
    
    this.reactiveElements.delete(element);
    this.updateQueue.delete(element);
  }

  /**
   * Check if element is reactive
   */
  isReactive(element: HTMLElement): boolean {
    return this.reactiveElements.has(element);
  }

  /**
   * Get all reactive elements
   */
  getReactiveElements(): HTMLElement[] {
    return Array.from(this.reactiveElements);
  }

  /**
   * Destroy reactive DOM instance
   */
  destroy(): void {
    // Clean up all observers
    this.observers.forEach((observers, element) => {
      observers.forEach(observer => observer.disconnect());
    });
    
    this.observers.clear();
    this.reactiveElements.clear();
    this.updateQueue.clear();
  }
}

export interface ReactiveOptions {
  observeAttributes?: string[];
  observeSubtree?: boolean;
  immediate?: boolean;
}

export const reactiveDOM = new ReactiveDOM();