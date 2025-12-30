/**
 * Official State Management Plugin
 */

import { Plugin } from '../../src/core/plugin';

export interface StateOptions {
  initialState?: any;
  persistence?: boolean;
  devtools?: boolean;
}

export class StateManager implements Plugin {
  private state: any;
  private subscribers: Set<(state: any) => void> = new Set();
  private history: any[] = [];
  private maxHistory: number = 50;

  constructor(options: StateOptions = {}) {
    this.state = options.initialState || {};
    
    if (options.persistence) {
      this.loadFromStorage();
    }
    
    if (options.devtools && typeof window !== 'undefined') {
      this.setupDevTools();
    }
  }

  install(app: any) {
    app.state = this;
    app.provide('state', this);
  }

  getState() {
    return { ...this.state };
  }

  setState(newState: any) {
    const oldState = this.state;
    this.state = { ...oldState, ...newState };
    
    // Save to history
    this.history.push({ timestamp: Date.now(), state: this.state });
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
    
    // Notify subscribers
    this.notify();
    
    // Persist if enabled
    this.saveToStorage();
  }

  subscribe(callback: (state: any) => void) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notify() {
    this.subscribers.forEach(callback => {
      try {
        callback(this.state);
      } catch (error) {
        console.error('Error in state subscriber:', error);
      }
    });
  }

  private saveToStorage() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('alphabet-state', JSON.stringify(this.state));
    }
  }

  private loadFromStorage() {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('alphabet-state');
      if (saved) {
        try {
          this.state = JSON.parse(saved);
        } catch (error) {
          console.error('Failed to load state from storage:', error);
        }
      }
    }
  }

  private setupDevTools() {
    if (typeof window !== 'undefined') {
      (window as any).__ALPHABET_STATE__ = this;
    }
  }

  undo() {
    if (this.history.length > 1) {
      this.history.pop(); // Remove current state
      const previous = this.history[this.history.length - 1];
      this.state = previous.state;
      this.notify();
    }
  }

  reset() {
    this.state = {};
    this.history = [];
    this.notify();
  }
}

// Plugin factory function
export function createStateManager(options?: StateOptions) {
  return new StateManager(options);
}