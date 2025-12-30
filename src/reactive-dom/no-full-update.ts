/**
 * No Full Update System
 * Enables partial updates without full page refresh for SPAs
 */

export class NoFullUpdate {
  private updateHistory: UpdateRecord[] = [];
  private maxHistory = 50;
  private currentState: AppState = {};
  private stateObservers: Set<StateObserver> = new Set();
  private urlObservers: Set<UrlObserver> = new Set();
  private isUpdating = false;

  /**
   * Initialize no-full-update system
   */
  init(options: NoFullUpdateOptions = {}): void {
    // Store initial state
    this.currentState = {
      url: window.location.pathname,
      hash: window.location.hash,
      search: window.location.search,
      timestamp: Date.now()
    };

    // Setup history handling
    this.setupHistory();
    
    // Setup URL observers
    this.setupUrlObserver();
    
    // Setup beforeunload handler
    if (options.preventUnload) {
      window.addEventListener('beforeunload', this.handleBeforeUnload);
    }

    console.log('No-Full-Update system initialized');
  }

  /**
   * Navigate to new URL without full refresh
   */
  navigate(url: string, data: any = {}, options: NavigateOptions = {}): void {
    if (this.isUpdating) {
      console.warn('Already updating, navigation queued');
      setTimeout(() => this.navigate(url, data, options), 100);
      return;
    }

    this.isUpdating = true;

    try {
      const fromState = { ...this.currentState };
      const toState = this.createState(url, data);
      
      // Add to history
      this.addToHistory({
        from: fromState,
        to: toState,
        type: 'navigate',
        timestamp: Date.now()
      });

      // Update URL without page reload
      if (options.replace) {
        window.history.replaceState(toState, '', url);
      } else {
        window.history.pushState(toState, '', url);
      }

      // Update current state
      this.currentState = toState;

      // Trigger state change
      this.triggerStateChange(fromState, toState);

      // Trigger URL change
      this.triggerUrlChange(url);

      // Perform DOM updates
      this.performDOMUpdates(fromState, toState, options);

      console.log(`Navigated to ${url} without full refresh`);
    } catch (error) {
      console.error('Navigation failed:', error);
      
      // Fallback to traditional navigation
      if (options.fallback !== false) {
        window.location.href = url;
      }
    } finally {
      this.isUpdating = false;
    }
  }

  /**
   * Update part of the page without refresh
   */
  update(selector: string, content: string | HTMLElement, options: UpdateOptions = {}): void {
    const elements = document.querySelectorAll(selector);
    
    if (elements.length === 0 && options.throwOnMissing) {
      throw new Error(`No elements found for selector: ${selector}`);
    }

    elements.forEach(element => {
      this.updateElement(element as HTMLElement, content, options);
    });

    // Record update
    this.addToHistory({
      from: this.currentState,
      to: { ...this.currentState, updated: selector },
      type: 'partial-update',
      selector,
      timestamp: Date.now()
    });
  }

  /**
   * Register state observer
   */
  observeState(callback: StateObserver): () => void {
    this.stateObservers.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.stateObservers.delete(callback);
    };
  }

  /**
   * Register URL observer
   */
  observeUrl(callback: UrlObserver): () => void {
    this.urlObservers.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.urlObservers.delete(callback);
    };
  }

  /**
   * Get current application state
   */
  getState(): AppState {
    return { ...this.currentState };
  }

  /**
   * Set application state
   */
  setState(newState: Partial<AppState>, options: StateOptions = {}): void {
    const oldState = this.currentState;
    this.currentState = { ...oldState, ...newState };
    
    if (options.notify !== false) {
      this.triggerStateChange(oldState, this.currentState);
    }
    
    if (options.record !== false) {
      this.addToHistory({
        from: oldState,
        to: this.currentState,
        type: 'state-change',
        timestamp: Date.now()
      });
    }
  }

  /**
   * Go back in history
   */
  back(): void {
    if (this.updateHistory.length > 1) {
      window.history.back();
    }
  }

  /**
   * Go forward in history
   */
  forward(): void {
    window.history.forward();
  }

  /**
   * Clear update history
   */
  clearHistory(): void {
    this.updateHistory = [];
  }

  /**
   * Get update history
   */
  getHistory(): UpdateRecord[] {
    return [...this.updateHistory];
  }

  /**
   * Destroy no-full-update system
   */
  destroy(): void {
    window.removeEventListener('popstate', this.handlePopState);
    window.removeEventListener('hashchange', this.handleHashChange);
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
    
    this.stateObservers.clear();
    this.urlObservers.clear();
    this.updateHistory = [];
    
    console.log('No-Full-Update system destroyed');
  }

  private setupHistory(): void {
    // Override pushState and replaceState to capture state changes
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = (state: any, title: string, url?: string | URL | null) => {
      const result = originalPushState.call(history, state, title, url);
      this.handleHistoryChange(state, url);
      return result;
    };

    history.replaceState = (state: any, title: string, url?: string | URL | null) => {
      const result = originalReplaceState.call(history, state, title, url);
      this.handleHistoryChange(state, url);
      return result;
    };

    // Handle popstate (back/forward)
    window.addEventListener('popstate', this.handlePopState);
  }

  private setupUrlObserver(): void {
    window.addEventListener('hashchange', this.handleHashChange);
  }

  private handlePopState = (event: PopStateEvent): void => {
    const newState = event.state || this.createState(window.location.pathname);
    const oldState = this.currentState;
    
    this.currentState = newState;
    this.triggerStateChange(oldState, newState);
    this.triggerUrlChange(window.location.href);
  };

  private handleHashChange = (): void => {
    const newState = {
      ...this.currentState,
      hash: window.location.hash,
      timestamp: Date.now()
    };
    
    const oldState = this.currentState;
    this.currentState = newState;
    
    this.triggerStateChange(oldState, newState);
    this.triggerUrlChange(window.location.href);
  };

  private handleBeforeUnload = (event: BeforeUnloadEvent): void => {
    // You can add confirmation logic here
    // event.returnValue = 'Are you sure you want to leave?';
  };

  private handleHistoryChange(state: any, url: string | URL | null | undefined): void {
    const newState = state || this.createState(typeof url === 'string' ? url : window.location.pathname);
    const oldState = this.currentState;
    
    this.currentState = newState;
    this.triggerStateChange(oldState, newState);
    
    if (url) {
      this.triggerUrlChange(typeof url === 'string' ? url : url.toString());
    }
  }

  private createState(url: string, data: any = {}): AppState {
    return {
      url,
      hash: window.location.hash,
      search: window.location.search,
      data,
      timestamp: Date.now()
    };
  }

  private addToHistory(record: UpdateRecord): void {
    this.updateHistory.push(record);
    
    // Keep history size limited
    if (this.updateHistory.length > this.maxHistory) {
      this.updateHistory.shift();
    }
  }

  private triggerStateChange(oldState: AppState, newState: AppState): void {
    this.stateObservers.forEach(observer => {
      try {
        observer(newState, oldState);
      } catch (error) {
        console.error('Error in state observer:', error);
      }
    });
  }

  private triggerUrlChange(url: string): void {
    this.urlObservers.forEach(observer => {
      try {
        observer(url);
      } catch (error) {
        console.error('Error in URL observer:', error);
      }
    });
  }

  private performDOMUpdates(oldState: AppState, newState: AppState, options: NavigateOptions): void {
    // This is where you would implement smart DOM updates
    // For now, it's a placeholder that can be extended
    
    if (options.updateTitle !== false) {
      document.title = options.title || document.title;
    }
    
    // Dispatch custom event for other parts of the app
    document.dispatchEvent(new CustomEvent('alphabet:navigation', {
      detail: { from: oldState, to: newState, options }
    }));
  }

  private updateElement(element: HTMLElement, content: string | HTMLElement, options: UpdateOptions): void {
    if (typeof content === 'string') {
      if (options.preserveChildren) {
        // Update only text nodes
        this.updateTextContent(element, content);
      } else if (options.append) {
        element.innerHTML += content;
      } else if (options.prepend) {
        element.innerHTML = content + element.innerHTML;
      } else {
        element.innerHTML = content;
      }
    } else {
      if (options.append) {
        element.appendChild(content);
      } else if (options.prepend) {
        element.insertBefore(content, element.firstChild);
      } else {
        element.innerHTML = '';
        element.appendChild(content);
      }
    }
  }

  private updateTextContent(element: HTMLElement, text: string): void {
    // Find text nodes and update them
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null
    );

    let node: Node | null;
    let firstTextNode: Node | null = null;
    
    while ((node = walker.nextNode())) {
      if (!firstTextNode) {
        firstTextNode = node;
      }
    }

    if (firstTextNode) {
      firstTextNode.textContent = text;
    } else {
      element.textContent = text;
    }
  }
}

export interface AppState {
  url?: string;
  hash?: string;
  search?: string;
  data?: any;
  timestamp?: number;
  [key: string]: any;
}

export interface UpdateRecord {
  from: AppState;
  to: AppState;
  type: 'navigate' | 'partial-update' | 'state-change';
  selector?: string;
  timestamp: number;
}

export interface NoFullUpdateOptions {
  preventUnload?: boolean;
  maxHistory?: number;
}

export interface NavigateOptions {
  replace?: boolean;
  fallback?: boolean;
  updateTitle?: boolean;
  title?: string;
}

export interface UpdateOptions {
  append?: boolean;
  prepend?: boolean;
  preserveChildren?: boolean;
  throwOnMissing?: boolean;
}

export interface StateOptions {
  notify?: boolean;
  record?: boolean;
}

export type StateObserver = (newState: AppState, oldState: AppState) => void;
export type UrlObserver = (url: string) => void;

export const noFullUpdate = new NoFullUpdate();