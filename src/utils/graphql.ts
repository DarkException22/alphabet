/**
 * GraphQL Utilities
 * Simplified GraphQL client
 */

export class GraphQLClient {
  private endpoint: string = '';
  private headers: Record<string, string> = {};
  private cache: Map<string, GraphQLCacheEntry> = new Map();
  private defaultCacheTime: number = 300000; // 5 minutes

  /**
   * Initialize GraphQL client
   */
  init(endpoint: string, options: GraphQLOptions = {}): void {
    this.endpoint = endpoint;
    this.headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    if (options.defaultCacheTime) {
      this.defaultCacheTime = options.defaultCacheTime;
    }
    
    console.log('GraphQL client initialized for:', endpoint);
  }

  /**
   * Execute GraphQL query
   */
  async query<T = any>(
    query: string, 
    variables: Record<string, any> = {}, 
    options: QueryOptions = {}
  ): Promise<GraphQLResponse<T>> {
    return this.execute<T>('query', query, variables, options);
  }

  /**
   * Execute GraphQL mutation
   */
  async mutate<T = any>(
    mutation: string, 
    variables: Record<string, any> = {}, 
    options: QueryOptions = {}
  ): Promise<GraphQLResponse<T>> {
    return this.execute<T>('mutation', mutation, variables, options);
  }

  /**
   * Subscribe to GraphQL subscription (WebSocket)
   */
  subscribe<T = any>(
    subscription: string, 
    variables: Record<string, any> = {}, 
    callback: SubscriptionCallback<T>,
    options: SubscriptionOptions = {}
  ): () => void {
    // For now, implement with polling
    // In production, use WebSocket or SSE
    const pollInterval = options.pollInterval || 5000;
    
    let isActive = true;
    
    const poll = async () => {
      if (!isActive) return;
      
      try {
        const response = await this.query<T>(subscription, variables, {
          cache: false,
          ...options
        });
        
        if (response.data) {
          callback(response.data, null);
        }
      } catch (error) {
        callback(null, error as Error);
      }
      
      if (isActive) {
        setTimeout(poll, pollInterval);
      }
    };
    
    poll();
    
    // Return unsubscribe function
    return () => {
      isActive = false;
    };
  }

  /**
   * Set authentication token
   */
  setAuthToken(token: string): void {
    this.headers.Authorization = `Bearer ${token}`;
  }

  /**
   * Clear authentication token
   */
  clearAuthToken(): void {
    delete this.headers.Authorization;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): CacheStats {
    const now = Date.now();
    let valid = 0;
    let expired = 0;
    
    this.cache.forEach(entry => {
      if (now - entry.timestamp < entry.cacheTime) {
        valid++;
      } else {
        expired++;
      }
    });
    
    return {
      total: this.cache.size,
      valid,
      expired,
      size: this.getCacheSize()
    };
  }

  /**
   * Execute GraphQL operation
   */
  private async execute<T = any>(
    operation: 'query' | 'mutation',
    document: string,
    variables: Record<string, any> = {},
    options: QueryOptions = {}
  ): Promise<GraphQLResponse<T>> {
    const cacheKey = this.getCacheKey(document, variables);
    const cacheTime = options.cacheTime || this.defaultCacheTime;
    const useCache = options.cache !== false && operation === 'query';
    
    // Check cache
    if (useCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      const now = Date.now();
      
      if (now - cached.timestamp < cacheTime) {
        console.log('Using cached GraphQL response');
        return cached.response as GraphQLResponse<T>;
      } else {
        // Remove expired cache
        this.cache.delete(cacheKey);
      }
    }

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          query: document,
          variables,
          operationName: options.operationName
        })
      });

      const result: GraphQLResponse<T> = await response.json();

      // Handle GraphQL errors
      if (result.errors && result.errors.length > 0) {
        const error = new GraphQLError('GraphQL operation failed');
        error.graphqlErrors = result.errors;
        throw error;
      }

      // Cache successful queries
      if (useCache && result.data) {
        this.cache.set(cacheKey, {
          response: result,
          timestamp: Date.now(),
          cacheTime
        });
      }

      return result;
    } catch (error) {
      if (error instanceof GraphQLError) {
        throw error;
      }
      
      throw new GraphQLError(
        'Network or parsing error',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Generate cache key
   */
  private getCacheKey(query: string, variables: Record<string, any>): string {
    const variablesString = JSON.stringify(variables);
    return `${query}:${variablesString}`;
  }

  /**
   * Estimate cache size
   */
  private getCacheSize(): number {
    let size = 0;
    this.cache.forEach(entry => {
      size += JSON.stringify(entry.response).length;
    });
    return size;
  }

  /**
   * Create a typed query
   */
  createQuery<T = any>(
    query: string,
    defaultVariables: Record<string, any> = {}
  ): (variables?: Record<string, any>, options?: QueryOptions) => Promise<GraphQLResponse<T>> {
    return (variables = {}, options = {}) => {
      return this.query<T>(query, { ...defaultVariables, ...variables }, options);
    };
  }

  /**
   * Create a typed mutation
   */
  createMutation<T = any>(
    mutation: string,
    defaultVariables: Record<string, any> = {}
  ): (variables?: Record<string, any>, options?: QueryOptions) => Promise<GraphQLResponse<T>> {
    return (variables = {}, options = {}) => {
      return this.mutate<T>(mutation, { ...defaultVariables, ...variables }, options);
    };
  }
}

export class GraphQLError extends Error {
  graphqlErrors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
  }>;

  constructor(message: string, cause?: Error) {
    super(message);
    this.name = 'GraphQLError';
    if (cause) {
      this.cause = cause;
    }
  }
}

export interface GraphQLOptions {
  headers?: Record<string, string>;
  defaultCacheTime?: number;
}

export interface QueryOptions {
  cache?: boolean;
  cacheTime?: number;
  operationName?: string;
}

export interface SubscriptionOptions {
  pollInterval?: number;
  cache?: boolean;
}

export interface GraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
  }>;
  extensions?: Record<string, any>;
}

export interface GraphQLCacheEntry {
  response: GraphQLResponse;
  timestamp: number;
  cacheTime: number;
}

export interface CacheStats {
  total: number;
  valid: number;
  expired: number;
  size: number;
}

export type SubscriptionCallback<T> = (data: T | null, error: Error | null) => void;

// Singleton instance
export const graphql = new GraphQLClient();