/**
 * Error Handling System - Robust and functional
 */

export class AlphabetError extends Error {
  public code: string;
  public details: any;
  public timestamp: Date;
  public stackTrace: string;

  constructor(code: string, message: string, details?: any) {
    super(message);
    this.name = 'AlphabetError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date();
    this.stackTrace = this.stack || new Error().stack || '';

    // Ensure proper prototype chain
    Object.setPrototypeOf(this, AlphabetError.prototype);
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp.toISOString(),
      stackTrace: this.stackTrace
    };
  }

  toString() {
    return `[${this.code}] ${this.message}${this.details ? `\nDetails: ${JSON.stringify(this.details)}` : ''}`;
  }
}

export interface ErrorHandler {
  (error: AlphabetError | Error): void | Promise<void>;
}

export interface ErrorHandlerConfig {
  logToConsole?: boolean;
  showToUser?: boolean;
  sendToServer?: boolean;
  fallbackMessage?: string;
  retryAttempts?: number;
  retryDelay?: number;
}

class ErrorManager {
  private handlers: Map<string, ErrorHandler[]> = new Map();
  private defaultHandlers: ErrorHandler[] = [];
  private config: ErrorHandlerConfig;
  private errorHistory: AlphabetError[] = [];
  private maxHistorySize = 1000;

  constructor(config: ErrorHandlerConfig = {}) {
    this.config = {
      logToConsole: true,
      showToUser: false,
      sendToServer: false,
      fallbackMessage: 'An unexpected error occurred',
      retryAttempts: 3,
      retryDelay: 1000,
      ...config
    };
  }

  register(code: string, handler: ErrorHandler): void {
    if (!this.handlers.has(code)) {
      this.handlers.set(code, []);
    }
    this.handlers.get(code)!.push(handler);
  }

  registerDefault(handler: ErrorHandler): void {
    this.defaultHandlers.push(handler);
  }

  async handle(error: Error | AlphabetError, context?: any): Promise<void> {
    const alphabetError = error instanceof AlphabetError 
      ? error 
      : new AlphabetError('UNKNOWN_ERROR', error.message, { originalError: error, context });

    // Add to history
    this.errorHistory.push(alphabetError);
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory.shift();
    }

    // Log to console if enabled
    if (this.config.logToConsole) {
      console.error(`[Alphabet Error ${alphabetError.code}]`, alphabetError.message, alphabetError.details);
    }

    // Get handlers for this error code
    const codeHandlers = this.handlers.get(alphabetError.code) || [];
    const allHandlers = [...codeHandlers, ...this.defaultHandlers];

    // Execute handlers
    for (const handler of allHandlers) {
      try {
        await handler(alphabetError);
      } catch (handlerError) {
        console.error('Error in error handler:', handlerError);
      }
    }

    // Show to user if enabled
    if (this.config.showToUser && typeof window !== 'undefined') {
      this.showUserError(alphabetError);
    }

    // Send to server if enabled
    if (this.config.sendToServer) {
      this.sendToServer(alphabetError);
    }

    // Dispatch global error event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('alphabet:error', {
        detail: { error: alphabetError, context }
      }));
    }
  }

  private showUserError(error: AlphabetError): void {
    // Create error overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      padding: 20px;
    `;

    const errorBox = document.createElement('div');
    errorBox.style.cssText = `
      background: white;
      border-radius: 8px;
      padding: 24px;
      max-width: 500px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    `;

    const title = document.createElement('h3');
    title.textContent = 'Application Error';
    title.style.cssText = `
      color: #dc2626;
      margin: 0 0 16px 0;
      font-size: 18px;
    `;

    const code = document.createElement('div');
    code.textContent = `Code: ${error.code}`;
    code.style.cssText = `
      font-family: monospace;
      background: #f3f4f6;
      padding: 8px 12px;
      border-radius: 4px;
      margin: 8px 0;
    `;

    const message = document.createElement('div');
    message.textContent = error.message;
    message.style.cssText = `
      margin: 12px 0;
      color: #374151;
    `;

    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.style.cssText = `
      background: #3b82f6;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
      margin-top: 16px;
      font-weight: 500;
    `;
    closeButton.onclick = () => overlay.remove();

    const detailsButton = document.createElement('button');
    detailsButton.textContent = 'Show Details';
    detailsButton.style.cssText = `
      background: #6b7280;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
      margin-top: 16px;
      margin-left: 8px;
      font-weight: 500;
    `;
    
    let detailsVisible = false;
    const details = document.createElement('div');
    details.style.cssText = `
      display: none;
      margin-top: 16px;
      padding: 12px;
      background: #f9fafb;
      border-radius: 4px;
      font-family: monospace;
      font-size: 12px;
      white-space: pre-wrap;
      word-break: break-all;
    `;
    details.textContent = JSON.stringify(error.toJSON(), null, 2);

    detailsButton.onclick = () => {
      detailsVisible = !detailsVisible;
      details.style.display = detailsVisible ? 'block' : 'none';
      detailsButton.textContent = detailsVisible ? 'Hide Details' : 'Show Details';
    };

    errorBox.append(title, code, message, closeButton, detailsButton, details);
    overlay.appendChild(errorBox);
    document.body.appendChild(overlay);
  }

  private sendToServer(error: AlphabetError): void {
    // In a real implementation, you would send errors to your error tracking service
    // For now, we'll just log it
    console.log('Sending error to server:', error.toJSON());
  }

  getErrorHistory(): AlphabetError[] {
    return [...this.errorHistory];
  }

  clearHistory(): void {
    this.errorHistory = [];
  }

  getStats(): {
    totalErrors: number;
    errorsByCode: Record<string, number>;
    lastError?: AlphabetError;
  } {
    const stats = {
      totalErrors: this.errorHistory.length,
      errorsByCode: {} as Record<string, number>,
      lastError: this.errorHistory[this.errorHistory.length - 1]
    };

    this.errorHistory.forEach(error => {
      stats.errorsByCode[error.code] = (stats.errorsByCode[error.code] || 0) + 1;
    });

    return stats;
  }
}

// Global error manager instance
const globalErrorManager = new ErrorManager();

// Public API functions
export function createError(code: string, message: string, details?: any): AlphabetError {
  return new AlphabetError(code, message, details);
}

export function handleError(error: Error | AlphabetError, context?: any): Promise<void> {
  return globalErrorManager.handle(error, context);
}

export function registerErrorHandler(code: string, handler: ErrorHandler): void {
  globalErrorManager.register(code, handler);
}

export function registerDefaultErrorHandler(handler: ErrorHandler): void {
  globalErrorManager.registerDefault(handler);
}

export function tryCatch<T>(fn: () => T, context?: string): T | undefined {
  try {
    return fn();
  } catch (error) {
    handleError(error as Error, context);
    return undefined;
  }
}

export async function tryCatchAsync<T>(
  fn: () => Promise<T>, 
  context?: string
): Promise<T | undefined> {
  try {
    return await fn();
  } catch (error) {
    await handleError(error as Error, context);
    return undefined;
  }
}

export function withErrorHandling<T extends (...args: any[]) => any>(
  fn: T,
  context?: string
): (...args: Parameters<T>) => ReturnType<T> | undefined {
  return (...args: Parameters<T>): ReturnType<T> | undefined => {
    try {
      return fn(...args);
    } catch (error) {
      handleError(error as Error, context);
      return undefined;
    }
  };
}

export function withErrorHandlingAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: string
): (...args: Parameters<T>) => Promise<ReturnType<T> | undefined> {
  return async (...args: Parameters<T>): Promise<ReturnType<T> | undefined> => {
    try {
      return await fn(...args);
    } catch (error) {
      await handleError(error as Error, context);
      return undefined;
    }
  };
}

export class ErrorBoundary {
  private element: HTMLElement;
  private fallback: (error: AlphabetError) => string;
  private caughtError: AlphabetError | null = null;

  constructor(element: HTMLElement, fallback?: (error: AlphabetError) => string) {
    this.element = element;
    this.fallback = fallback || ((error) => `
      <div style="
        padding: 20px;
        border: 2px solid #dc2626;
        border-radius: 8px;
        background: #fef2f2;
        color: #7f1d1d;
      ">
        <h3 style="margin: 0 0 10px 0;">Error: ${error.code}</h3>
        <p style="margin: 0;">${error.message}</p>
      </div>
    `);

    // Wrap all child elements with error handling
    this.wrapChildren();
  }

  private wrapChildren(): void {
    const children = Array.from(this.element.children);
    
    children.forEach(child => {
      const originalAddEventListener = child.addEventListener;
      
      child.addEventListener = ((type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) => {
        const wrappedListener = (event: Event) => {
          try {
            if (typeof listener === 'function') {
              listener.call(child, event);
            } else if (listener && typeof listener.handleEvent === 'function') {
              listener.handleEvent(event);
            }
          } catch (error) {
            this.handleError(error as Error);
          }
        };
        
        return originalAddEventListener.call(child, type, wrappedListener, options);
      }) as typeof child.addEventListener;
    });
  }

  private handleError(error: Error): void {
    const alphabetError = error instanceof AlphabetError 
      ? error 
      : new AlphabetError('BOUNDARY_ERROR', error.message, { originalError: error });

    this.caughtError = alphabetError;
    
    // Render fallback UI
    this.element.innerHTML = this.fallback(alphabetError);
    
    // Dispatch error event
    this.element.dispatchEvent(new CustomEvent('alphabet:error:boundary', {
      detail: { error: alphabetError }
    }));
    
    // Handle error globally
    handleError(alphabetError, 'ErrorBoundary');
  }

  reset(): void {
    this.caughtError = null;
    this.element.innerHTML = '';
    this.wrapChildren();
  }

  getError(): AlphabetError | null {
    return this.caughtError;
  }
}

// Default error handlers
registerDefaultErrorHandler((error) => {
  // Log all errors by default
  console.error('Default error handler:', error);
});

registerErrorHandler('NETWORK_ERROR', (error) => {
  console.error('Network error occurred:', error.details);
});

registerErrorHandler('VALIDATION_ERROR', (error) => {
  console.error('Validation failed:', error.details);
});

registerErrorHandler('AUTH_ERROR', (error) => {
  console.error('Authentication error:', error.details);
  // Redirect to login page
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
});

// Export error manager for advanced usage
export const errorManager = globalErrorManager;