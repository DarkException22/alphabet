/**
 * WebSocket Utilities
 * Simplified WebSocket communication
 */

export class WebSocketClient {
  private socket: WebSocket | null = null;
  private url: string = '';
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private messageHandlers: Map<string, MessageHandler[]> = new Map();
  private connectionHandlers: ConnectionHandler[] = [];
  private autoReconnect: boolean = true;
  private isConnected: boolean = false;

  /**
   * Connect to WebSocket server
   */
  connect(url: string, options: WebSocketOptions = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket) {
        this.disconnect();
      }

      this.url = url;
      this.autoReconnect = options.autoReconnect ?? true;
      this.maxReconnectAttempts = options.maxReconnectAttempts ?? 5;
      this.reconnectDelay = options.reconnectDelay ?? 1000;

      try {
        this.socket = new WebSocket(url);
        
        this.socket.onopen = (event) => {
          this.handleOpen(event);
          this.reconnectAttempts = 0;
          this.isConnected = true;
          resolve();
        };
        
        this.socket.onmessage = (event) => {
          this.handleMessage(event);
        };
        
        this.socket.onclose = (event) => {
          this.handleClose(event);
          this.isConnected = false;
        };
        
        this.socket.onerror = (event) => {
          this.handleError(event);
          reject(event);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.isConnected = false;
    }
  }

  /**
   * Send message to server
   */
  send(type: string, data: any = {}): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket is not connected');
      return false;
    }

    try {
      const message = JSON.stringify({ type, data });
      this.socket.send(message);
      return true;
    } catch (error) {
      console.error('Failed to send message:', error);
      return false;
    }
  }

  /**
   * Subscribe to message type
   */
  on(type: string, handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    
    this.messageHandlers.get(type)!.push(handler);
    
    // Return unsubscribe function
    return () => {
      const handlers = this.messageHandlers.get(type);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  /**
   * Subscribe to connection events
   */
  onConnection(handler: ConnectionHandler): () => void {
    this.connectionHandlers.push(handler);
    
    // Return unsubscribe function
    return () => {
      const index = this.connectionHandlers.indexOf(handler);
      if (index > -1) {
        this.connectionHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Get connection status
   */
  getStatus(): string {
    if (!this.socket) return 'disconnected';
    
    switch (this.socket.readyState) {
      case WebSocket.CONNECTING: return 'connecting';
      case WebSocket.OPEN: return 'connected';
      case WebSocket.CLOSING: return 'closing';
      case WebSocket.CLOSED: return 'disconnected';
      default: return 'unknown';
    }
  }

  /**
   * Reconnect manually
   */
  async reconnect(): Promise<void> {
    if (this.socket?.readyState === WebSocket.CONNECTING) {
      console.warn('Already connecting');
      return;
    }

    this.disconnect();
    await this.connect(this.url);
  }

  /**
   * Create a channel for specific message types
   */
  createChannel(channelName: string): WebSocketChannel {
    return new WebSocketChannel(this, channelName);
  }

  /**
   * Handle connection open
   */
  private handleOpen(event: Event): void {
    console.log('WebSocket connected:', this.url);
    
    this.connectionHandlers.forEach(handler => {
      try {
        handler('open', event);
      } catch (error) {
        console.error('Error in connection handler:', error);
      }
    });
  }

  /**
   * Handle incoming message
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data);
      const { type, data } = message;
      
      // Call handlers for this message type
      const handlers = this.messageHandlers.get(type);
      if (handlers) {
        handlers.forEach(handler => {
          try {
            handler(data, type);
          } catch (error) {
            console.error('Error in message handler:', error);
          }
        });
      }
      
      // Call wildcard handlers
      const wildcardHandlers = this.messageHandlers.get('*');
      if (wildcardHandlers) {
        wildcardHandlers.forEach(handler => {
          try {
            handler(data, type);
          } catch (error) {
            console.error('Error in wildcard handler:', error);
          }
        });
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  /**
   * Handle connection close
   */
  private handleClose(event: CloseEvent): void {
    console.log('WebSocket disconnected:', event.code, event.reason);
    
    this.connectionHandlers.forEach(handler => {
      try {
        handler('close', event);
      } catch (error) {
        console.error('Error in connection handler:', error);
      }
    });
    
    // Attempt reconnection
    if (this.autoReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        this.reconnect().catch(error => {
          console.error('Reconnection failed:', error);
        });
      }, delay);
    }
  }

  /**
   * Handle connection error
   */
  private handleError(event: Event): void {
    console.error('WebSocket error:', event);
    
    this.connectionHandlers.forEach(handler => {
      try {
        handler('error', event);
      } catch (error) {
        console.error('Error in connection handler:', error);
      }
    });
  }
}

export class WebSocketChannel {
  private client: WebSocketClient;
  private channelName: string;
  private handlers: Map<string, MessageHandler[]> = new Map();

  constructor(client: WebSocketClient, channelName: string) {
    this.client = client;
    this.channelName = channelName;
  }

  /**
   * Send message through channel
   */
  send(type: string, data: any = {}): boolean {
    return this.client.send(`${this.channelName}:${type}`, data);
  }

  /**
   * Subscribe to channel message type
   */
  on(type: string, handler: MessageHandler): () => void {
    const fullType = `${this.channelName}:${type}`;
    
    if (!this.handlers.has(type)) {
      this.handlers.set(type, []);
    }
    
    this.handlers.get(type)!.push(handler);
    
    // Subscribe to client
    const unsubscribe = this.client.on(fullType, (data, messageType) => {
      const handlers = this.handlers.get(type);
      if (handlers) {
        handlers.forEach(h => h(data, messageType));
      }
    });
    
    // Return unsubscribe function
    return () => {
      unsubscribe();
      const handlers = this.handlers.get(type);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  /**
   * Unsubscribe all handlers
   */
  unsubscribeAll(): void {
    this.handlers.clear();
  }
}

export interface WebSocketOptions {
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
}

export type MessageHandler = (data: any, type: string) => void;
export type ConnectionHandler = (eventType: 'open' | 'close' | 'error', event: Event | CloseEvent) => void;

// Singleton instance
export const ws = new WebSocketClient();