/**
 * Event Management System
 * Stores and identifies events for reactive updates
 */

export class EventSystem {
  private eventRegistry: Map<string, EventHandler[]> = new Map();
  private elementEventMap: WeakMap<HTMLElement, Map<string, EventHandler[]>> = new WeakMap();
  private delegatedEvents: Map<string, DelegatedHandler[]> = new Map();
  private capturedEvents: Set<string> = new Set();

  /**
   * Register event on element
   */
  on(element: HTMLElement, eventName: string, handler: EventHandler, options?: AddEventListenerOptions): () => void {
    // Store handler
    if (!this.eventRegistry.has(eventName)) {
      this.eventRegistry.set(eventName, []);
    }
    this.eventRegistry.get(eventName)!.push(handler);

    // Store element-handler mapping
    if (!this.elementEventMap.has(element)) {
      this.elementEventMap.set(element, new Map());
    }
    
    const elementEvents = this.elementEventMap.get(element)!;
    if (!elementEvents.has(eventName)) {
      elementEvents.set(eventName, []);
    }
    elementEvents.get(eventName)!.push(handler);

    // Add event listener
    element.addEventListener(eventName, handler as EventListener, options);

    // Return remove function
    return () => {
      this.off(element, eventName, handler);
    };
  }

  /**
   * Remove event from element
   */
  off(element: HTMLElement, eventName: string, handler?: EventHandler): void {
    if (!handler) {
      // Remove all handlers for this event
      const handlers = this.elementEventMap.get(element)?.get(eventName);
      if (handlers) {
        handlers.forEach(h => {
          element.removeEventListener(eventName, h as EventListener);
        });
        this.elementEventMap.get(element)!.delete(eventName);
      }
    } else {
      // Remove specific handler
      element.removeEventListener(eventName, handler as EventListener);
      
      // Remove from registry
      const handlers = this.eventRegistry.get(eventName);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
      
      // Remove from element map
      const elementHandlers = this.elementEventMap.get(element)?.get(eventName);
      if (elementHandlers) {
        const index = elementHandlers.indexOf(handler);
        if (index > -1) {
          elementHandlers.splice(index, 1);
        }
      }
    }
  }

  /**
   * Delegate event to parent element
   */
  delegate(parent: HTMLElement, selector: string, eventName: string, handler: DelegatedHandler): () => void {
    const key = `${eventName}:${selector}`;
    
    if (!this.delegatedEvents.has(key)) {
      this.delegatedEvents.set(key, []);
    }
    this.delegatedEvents.get(key)!.push(handler);

    // Create delegated handler
    const delegatedHandler = (event: Event) => {
      const target = event.target as HTMLElement;
      const matchingElement = target.closest(selector);
      
      if (matchingElement && parent.contains(matchingElement)) {
        handler(event, matchingElement);
      }
    };

    parent.addEventListener(eventName, delegatedHandler);

    // Return remove function
    return () => {
      const handlers = this.delegatedEvents.get(key);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
      parent.removeEventListener(eventName, delegatedHandler);
    };
  }

  /**
   * Trigger event on element
   */
  trigger(element: HTMLElement, eventName: string, detail?: any): boolean {
    const event = new CustomEvent(eventName, {
      detail,
      bubbles: true,
      cancelable: true
    });
    
    return element.dispatchEvent(event);
  }

  /**
   * Capture events (for debugging or analytics)
   */
  capture(eventName: string, callback: CaptureCallback): () => void {
    this.capturedEvents.add(eventName);
    
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    
    EventTarget.prototype.addEventListener = function(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) {
      if (type === eventName) {
        const wrappedListener = (event: Event) => {
          callback(event, this);
          if (typeof listener === 'function') {
            (listener as EventListener).call(this, event);
          } else if (listener && typeof listener.handleEvent === 'function') {
            listener.handleEvent(event);
          }
        };
        
        return originalAddEventListener.call(this, type, wrappedListener, options);
      }
      
      return originalAddEventListener.call(this, type, listener, options);
    };

    // Return restore function
    return () => {
      EventTarget.prototype.addEventListener = originalAddEventListener;
      this.capturedEvents.delete(eventName);
    };
  }

  /**
   * Get all events registered on element
   */
  getElementEvents(element: HTMLElement): Map<string, EventHandler[]> {
    return this.elementEventMap.get(element) || new Map();
  }

  /**
   * Get all registered event names
   */
  getRegisteredEvents(): string[] {
    return Array.from(this.eventRegistry.keys());
  }

  /**
   * Remove all events from element
   */
  clearElementEvents(element: HTMLElement): void {
    const events = this.elementEventMap.get(element);
    if (events) {
      events.forEach((handlers, eventName) => {
        handlers.forEach(handler => {
          element.removeEventListener(eventName, handler as EventListener);
        });
      });
      this.elementEventMap.delete(element);
    }
  }

  /**
   * Remove all events
   */
  clearAll(): void {
    // Clear all element listeners
    // Note: We can't iterate over WeakMap, so we rely on GC
    
    // Clear registries
    this.eventRegistry.clear();
    this.delegatedEvents.clear();
  }

  /**
   * Create custom event with reactive capabilities
   */
  createReactiveEvent(name: string, options: CustomEventInit = {}): CustomEvent {
    return new CustomEvent(`alphabet:${name}`, {
      bubbles: true,
      cancelable: true,
      composed: true,
      ...options
    });
  }
}

export type EventHandler = (event: Event) => void;
export type DelegatedHandler = (event: Event, target: HTMLElement) => void;
export type CaptureCallback = (event: Event, target: EventTarget) => void;

export const eventSystem = new EventSystem();