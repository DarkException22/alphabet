/**
 * Official State Management Plugin for Alphabet Framework v2.0
 * Functional API with excellent DX
 */

import { Plugin } from 'alphabet-core';

export interface StateOptions {
  initialState?: Record<string, any>;
  persistence?: boolean;
  persistenceKey?: string;
  devtools?: boolean;
  strict?: boolean;
  middleware?: Array<(state: any, action: any) => any>;
}

export interface Action {
  type: string;
  payload?: any;
}

export interface Store {
  state: Record<string, any>;
  getState: () => any;
  setState: (updates: any) => void;
  dispatch: (action: Action) => void;
  subscribe: (listener: (state: any) => void) => () => void;
  replaceState: (newState: any) => void;
  reset: () => void;
  use: (plugin: StorePlugin) => void;
}

export interface StorePlugin {
  (store: Store): void | (() => void);
}

export function createStore(options: StateOptions = {}): Store {
  const {
    initialState = {},
    persistence = false,
    persistenceKey = 'alphabet-state',
    devtools = false,
    strict = false,
    middleware = []
  } = options;

  // Internal state
  let state = { ...initialState };
  let listeners: Array<(state: any) => void> = [];
  let plugins: Array<StorePlugin> = [];
  let isDispatching = false;

  // Load persisted state
  if (persistence && typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(persistenceKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        state = { ...state, ...parsed };
      }
    } catch (error) {
      console.warn('Failed to load persisted state:', error);
    }
  }

  // DevTools integration
  if (devtools && typeof window !== 'undefined') {
    (window as any).__ALPHABET_STORE_DEVTOOLS__ = {
      getState: () => state,
      setState: (newState: any) => {
        state = newState;
        notifyListeners();
      }
    };
  }

  const getState = (): any => {
    if (isDispatching) {
      throw new Error('Cannot call getState while dispatching');
    }
    return state;
  };

  const setState = (updates: any): void => {
    if (isDispatching) {
      throw new Error('Cannot call setState while dispatching');
    }

    if (strict && typeof updates !== 'object') {
      throw new Error('State updates must be an object');
    }

    const previousState = { ...state };
    state = { ...state, ...updates };

    // Run middleware
    middleware.forEach(middlewareFn => {
      state = middlewareFn(state, { type: 'SET_STATE', payload: updates });
    });

    // Notify listeners
    notifyListeners();

    // Persist state if enabled
    if (persistence && typeof window !== 'undefined') {
      try {
        localStorage.setItem(persistenceKey, JSON.stringify(state));
      } catch (error) {
        console.warn('Failed to persist state:', error);
      }
    }

    // DevTools update
    if (devtools && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('alphabet:state:change', {
        detail: { previousState, newState: state, updates }
      }));
    }
  };

  const dispatch = (action: Action): void => {
    if (isDispatching) {
      throw new Error('Cannot dispatch while already dispatching');
    }

    if (!action || typeof action !== 'object' || !action.type) {
      throw new Error('Actions must be objects with a type property');
    }

    isDispatching = true;
    const previousState = { ...state };

    try {
      // Run middleware
      let newState = state;
      middleware.forEach(middlewareFn => {
        newState = middlewareFn(newState, action);
      });

      state = newState;

      // Notify listeners
      notifyListeners();

      // Persist state if enabled
      if (persistence && typeof window !== 'undefined') {
        try {
          localStorage.setItem(persistenceKey, JSON.stringify(state));
        } catch (error) {
          console.warn('Failed to persist state:', error);
        }
      }

      // DevTools update
      if (devtools && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('alphabet:state:action', {
          detail: { action, previousState, newState: state }
        }));
      }
    } finally {
      isDispatching = false;
    }
  };

  const subscribe = (listener: (state: any) => void): (() => void) => {
    if (typeof listener !== 'function') {
      throw new Error('Listener must be a function');
    }

    if (isDispatching) {
      throw new Error('Cannot subscribe while dispatching');
    }

    listeners.push(listener);

    // Return unsubscribe function
    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  };

  const replaceState = (newState: any): void => {
    if (isDispatching) {
      throw new Error('Cannot replace state while dispatching');
    }

    if (strict && typeof newState !== 'object') {
      throw new Error('State must be an object');
    }

    const previousState = { ...state };
    state = { ...newState };

    // Notify listeners
    notifyListeners();

    // Persist state if enabled
    if (persistence && typeof window !== 'undefined') {
      try {
        localStorage.setItem(persistenceKey, JSON.stringify(state));
      } catch (error) {
        console.warn('Failed to persist state:', error);
      }
    }

    // DevTools update
    if (devtools && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('alphabet:state:replace', {
        detail: { previousState, newState: state }
      }));
    }
  };

  const reset = (): void => {
    replaceState({ ...initialState });
  };

  const use = (plugin: StorePlugin): void => {
    if (isDispatching) {
      throw new Error('Cannot use plugin while dispatching');
    }

    const cleanup = plugin(store);
    plugins.push(plugin);

    if (typeof cleanup === 'function') {
      // Store cleanup function
      const originalReset = reset;
      reset = () => {
        cleanup();
        originalReset();
      };
    }
  };

  const notifyListeners = (): void => {
    listeners.forEach(listener => {
      try {
        listener(state);
      } catch (error) {
        console.error('Error in state listener:', error);
      }
    });
  };

  const store: Store = {
    get state() { return { ...state }; },
    getState,
    setState,
    dispatch,
    subscribe,
    replaceState,
    reset,
    use
  };

  return store;
}

// Plugin for Alphabet Framework
export const statePlugin: Plugin = {
  name: 'state-manager',
  
  install(app) {
    const store = createStore();
    
    // Add store to app instance
    (app as any).store = store;
    
    // Provide store to components
    (app as any).provide('store', store);
    
    // Add $store to all components
    app.components.forEach(component => {
      const originalMount = component.mount;
      if (originalMount) {
        component.mount = function(element: HTMLElement | string) {
          // Inject $store into component
          (this as any).$store = store;
          return originalMount.call(this, element);
        };
      }
    });
    
    return store;
  }
};

// Hook for functional components
export function useStore(key?: string): any {
  // This would be used inside Alphabet components
  // Implementation depends on your component system
  return {
    state: {},
    getState: () => ({}),
    setState: () => {},
    dispatch: () => {}
  };
}

// Middleware
export const loggerMiddleware = (store: any) => (next: any) => (action: any) => {
  console.log('Dispatching:', action);
  const result = next(action);
  console.log('Next state:', store.getState());
  return result;
};

export const thunkMiddleware = (store: any) => (next: any) => (action: any) => {
  if (typeof action === 'function') {
    return action(store.dispatch, store.getState);
  }
  return next(action);
};

export const localStorageMiddleware = (key: string) => (store: any) => (next: any) => (action: any) => {
  const result = next(action);
  localStorage.setItem(key, JSON.stringify(store.getState()));
  return result;
};

// Factory function for common store patterns
export function createSlice(
  name: string,
  initialState: any,
  reducers: Record<string, (state: any, action: any) => any>
) {
  return {
    name,
    initialState,
    reducers,
    actions: Object.keys(reducers).reduce((acc, reducerName) => {
      acc[reducerName] = (payload: any) => ({
        type: `${name}/${reducerName}`,
        payload
      });
      return acc;
    }, {} as Record<string, (payload: any) => Action>)
  };
}

// Convenience exports
export const state = {
  create: createStore,
  plugin: statePlugin,
  use: useStore,
  
  // Common store patterns
  createCounter: (initialValue = 0) => 
    createStore({
      initialState: { count: initialValue },
      middleware: [
        (state, action) => {
          switch (action.type) {
            case 'INCREMENT':
              return { ...state, count: state.count + (action.payload || 1) };
            case 'DECREMENT':
              return { ...state, count: state.count - (action.payload || 1) };
            case 'RESET':
              return { ...state, count: initialValue };
            default:
              return state;
          }
        }
      ]
    }),
    
  createTodo: () =>
    createStore({
      initialState: {
        todos: [],
        filter: 'all'
      },
      middleware: [
        (state, action) => {
          switch (action.type) {
            case 'ADD_TODO':
              return {
                ...state,
                todos: [
                  ...state.todos,
                  {
                    id: Date.now(),
                    text: action.payload,
                    completed: false
                  }
                ]
              };
            case 'TOGGLE_TODO':
              return {
                ...state,
                todos: state.todos.map(todo =>
                  todo.id === action.payload
                    ? { ...todo, completed: !todo.completed }
                    : todo
                )
              };
            case 'REMOVE_TODO':
              return {
                ...state,
                todos: state.todos.filter(todo => todo.id !== action.payload)
              };
            case 'SET_FILTER':
              return { ...state, filter: action.payload };
            default:
              return state;
          }
        }
      ]
    }),
    
  createAuth: () =>
    createStore({
      initialState: {
        user: null,
        token: null,
        loading: false,
        error: null
      },
      persistence: true,
      persistenceKey: 'auth-store',
      middleware: [
        (state, action) => {
          switch (action.type) {
            case 'LOGIN_REQUEST':
              return { ...state, loading: true, error: null };
            case 'LOGIN_SUCCESS':
              return {
                ...state,
                loading: false,
                user: action.payload.user,
                token: action.payload.token
              };
            case 'LOGIN_FAILURE':
              return {
                ...state,
                loading: false,
                error: action.payload
              };
            case 'LOGOUT':
              return {
                ...state,
                user: null,
                token: null
              };
            default:
              return state;
          }
        }
      ]
    })
};