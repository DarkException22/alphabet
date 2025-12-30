/**
 * API Utilities
 * Simplified HTTP client for REST APIs
 */

export class API {
  private baseURL: string = '';
  private headers: Record<string, string> = {};
  private interceptors: Interceptors = {
    request: [],
    response: [],
    error: []
  };
  private cache: Map<string, APICacheEntry> = new Map();
  private defaultCacheTime: number = 300000; // 5 minutes

  /**
   * Initialize API client
   */
  init(baseURL: string, options: APIOptions = {}): void {
    this.baseURL = baseURL.replace(/\/$/, ''); // Remove trailing slash
    this.headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    if (options.defaultCacheTime) {
      this.defaultCacheTime = options.defaultCacheTime;
    }
    
    console.log('API client initialized for:', baseURL);
  }

  /**
   * Set base URL
   */
  setBaseURL(url: string): void {
    this.baseURL = url.replace(/\/$/, '');
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
   * Add request interceptor
   */
  interceptRequest(interceptor: RequestInterceptor): () => void {
    this.interceptors.request.push(interceptor);
    
    // Return remove function
    return () => {
      const index = this.interceptors.request.indexOf(interceptor);
      if (index > -1) {
        this.interceptors.request.splice(index, 1);
      }
    };
  }

  /**
   * Add response interceptor
   */
  interceptResponse(interceptor: ResponseInterceptor): () => void {
    this.interceptors.response.push(interceptor);
    
    // Return remove function
    return () => {
      const index = this.interceptors.response.indexOf(interceptor);
      if (index > -1) {
        this.interceptors.response.splice(index, 1);
      }
    };
  }

  /**
   * Add error interceptor
   */
  interceptError(interceptor: ErrorInterceptor): () => void {
    this.interceptors.error.push(interceptor);
    
    // Return remove function
    return () => {
      const index = this.interceptors.error.indexOf(interceptor);
      if (index > -1) {
        this.interceptors.error.splice(index, 1);
      }
    };
  }

  /**
   * GET request
   */
  async get<T = any>(endpoint: string, options: RequestOptions = {}): Promise<APIResponse<T>> {
    return this.request<T>('GET', endpoint, null, options);
  }

  /**
   * POST request
   */
  async post<T = any>(endpoint: string, data: any = null, options: RequestOptions = {}): Promise<APIResponse<T>> {
    return this.request<T>('POST', endpoint, data, options);
  }

  /**
   * PUT request
   */
  async put<T = any>(endpoint: string, data: any = null, options: RequestOptions = {}): Promise<APIResponse<T>> {
    return this.request<T>('PUT', endpoint, data, options);
  }

  /**
   * PATCH request
   */
  async patch<T = any>(endpoint: string, data: any = null, options: RequestOptions = {}): Promise<APIResponse<T>> {
    return this.request<T>('PATCH', endpoint, data, options);
  }

  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string, options: RequestOptions = {}): Promise<APIResponse<T>> {
    return this.request<T>('DELETE', endpoint, null, options);
  }

  /**
   * Upload files
   */
  async upload<T = any>(
    endpoint: string, 
    files: FileList | File[], 
    fieldName: string = 'files',
    additionalData: Record<string, any> = {}
  ): Promise<APIResponse<T>> {
    const formData = new FormData();
    
    // Add files
    const fileArray = Array.isArray(files) ? files : Array.from(files);
    fileArray.forEach(file => {
      formData.append(fieldName, file);
    });
    
    // Add additional data
    Object.entries(additionalData).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, String(value));
      }
    });
    
    return this.request<T>('POST', endpoint, formData, {
      headers: {
        // Don't set Content-Type for FormData
      }
    });
  }

  /**
   * Make request with retry logic
   */
  async requestWithRetry<T = any>(
    method: string,
    endpoint: string,
    data: any = null,
    options: RequestOptions & RetryOptions = {}
  ): Promise<APIResponse<T>> {
    const maxRetries = options.maxRetries || 3;
    const retryDelay = options.retryDelay || 1000;
    
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.request<T>(method, endpoint, data, options);
        return response;
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on 4xx errors (except 429)
        if (error instanceof APIError && error.status >= 400 && error.status < 500 && error.status !== 429) {
          throw error;
        }
        
        if (attempt < maxRetries) {
          const delay = retryDelay * Math.pow(2, attempt); // Exponential backoff
          await this.sleep(delay);
        }
      }
    }
    
    throw lastError!;
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
   * Execute HTTP request
   */
  private async request<T = any>(
    method: string,
    endpoint: string,
    data: any = null,
    options: RequestOptions = {}
  ): Promise<APIResponse<T>> {
    // Build URL
    const url = endpoint.startsWith('http') 
      ? endpoint 
      : `${this.baseURL}/${endpoint.replace(/^\//, '')}`;
    
    // Build request options
    let requestOptions: RequestInit = {
      method,
      headers: { ...this.headers, ...options.headers },
      credentials: options.credentials || 'same-origin'
    };
    
    // Add body if applicable
    if (data && !['GET', 'HEAD'].includes(method)) {
      if (data instanceof FormData) {
        // For FormData, let browser set Content-Type
        delete (requestOptions.headers as any)['Content-Type'];
        requestOptions.body = data;
      } else {
        requestOptions.body = JSON.stringify(data);
      }
    }
    
    // Add query parameters for GET requests
    if (['GET', 'HEAD'].includes(method) && data && typeof data === 'object') {
      const urlObj = new URL(url);
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          urlObj.searchParams.append(key, String(value));
        }
      });
      const urlWithParams = urlObj.toString();
      
      // Use cache for GET requests
      const cacheKey = this.getCacheKey(method, urlWithParams, data);
      const cacheTime = options.cacheTime || this.defaultCacheTime;
      
      if (options.cache !== false && this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey)!;
        const now = Date.now();
        
        if (now - cached.timestamp < cacheTime) {
          console.log('Using cached API response');
          return cached.response as APIResponse<T>;
        } else {
          // Remove expired cache
          this.cache.delete(cacheKey);
        }
      }
      
      // Update request URL
      requestOptions = { ...requestOptions, url: urlWithParams };
    }
    
    // Run request interceptors
    let modifiedOptions = requestOptions;
    for (const interceptor of this.interceptors.request) {
      modifiedOptions = await interceptor(url, modifiedOptions);
    }
    
    // Make request
    const response = await fetch(url, modifiedOptions);
    
    // Run response interceptors
    let modifiedResponse = response;
    for (const interceptor of this.interceptors.response) {
      modifiedResponse = await interceptor(modifiedResponse);
    }
    
    // Parse response
    const responseData = await this.parseResponse<T>(modifiedResponse);
    
    // Handle errors
    if (!response.ok) {
      const error = new APIError(
        responseData?.message || `HTTP ${response.status}`,
        response.status,
        responseData
      );
      
      // Run error interceptors
      for (const interceptor of this.interceptors.error) {
        await interceptor(error);
      }
      
      throw error;
    }
    
    // Cache successful GET requests
    if (method === 'GET' && options.cache !== false && response.ok) {
      const cacheKey = this.getCacheKey(method, url, data);
      const cacheTime = options.cacheTime || this.defaultCacheTime;
      
      this.cache.set(cacheKey, {
        response: responseData,
        timestamp: Date.now(),
        cacheTime
      });
    }
    
    return responseData;
  }

  /**
   * Parse response based on Content-Type
   */
  private async parseResponse<T>(response: Response): Promise<APIResponse<T>> {
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      return response.json();
    } else if (contentType.includes('text/')) {
      const text = await response.text();
      return { data: text as any, status: response.status };
    } else {
      // For binary data, return blob
      const blob = await response.blob();
      return { data: blob as any, status: response.status };
    }
  }

  /**
   * Generate cache key
   */
  private getCacheKey(method: string, url: string, data: any): string {
    const dataString = data ? JSON.stringify(data) : '';
    return `${method}:${url}:${dataString}`;
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
   * Sleep function for retry logic
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create a resource service
   */
  createService<T = any>(resourceName: string): ResourceService<T> {
    return {
      getAll: (params = {}, options = {}) => 
        this.get<T[]>(resourceName, { ...options, params }),
      
      getOne: (id: string | number, options = {}) => 
        this.get<T>(`${resourceName}/${id}`, options),
      
      create: (data: Partial<T>, options = {}) => 
        this.post<T>(resourceName, data, options),
      
      update: (id: string | number, data: Partial<T>, options = {}) => 
        this.put<T>(`${resourceName}/${id}`, data, options),
      
      patch: (id: string | number, data: Partial<T>, options = {}) => 
        this.patch<T>(`${resourceName}/${id}`, data, options),
      
      delete: (id: string | number, options = {}) => 
        this.delete<void>(`${resourceName}/${id}`, options)
    };
  }
}

export class APIError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data: any = null) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.data = data;
  }
}

export interface APIOptions {
  headers?: Record<string, string>;
  defaultCacheTime?: number;
}

export interface RequestOptions {
  headers?: Record<string, string>;
  cache?: boolean;
  cacheTime?: number;
  credentials?: RequestCredentials;
  params?: Record<string, any>;
}

export interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
}

export interface APIResponse<T = any> {
  data: T;
  status?: number;
  [key: string]: any;
}

export interface APICacheEntry {
  response: APIResponse;
  timestamp: number;
  cacheTime: number;
}

export interface CacheStats {
  total: number;
  valid: number;
  expired: number;
  size: number;
}

export type RequestInterceptor = (url: string, options: RequestInit) => Promise<RequestInit> | RequestInit;
export type ResponseInterceptor = (response: Response) => Promise<Response> | Response;
export type ErrorInterceptor = (error: APIError) => Promise<void> | void;

export interface Interceptors {
  request: RequestInterceptor[];
  response: ResponseInterceptor[];
  error: ErrorInterceptor[];
}

export interface ResourceService<T = any> {
  getAll: (params?: Record<string, any>, options?: RequestOptions) => Promise<APIResponse<T[]>>;
  getOne: (id: string | number, options?: RequestOptions) => Promise<APIResponse<T>>;
  create: (data: Partial<T>, options?: RequestOptions) => Promise<APIResponse<T>>;
  update: (id: string | number, data: Partial<T>, options?: RequestOptions) => Promise<APIResponse<T>>;
  patch: (id: string | number, data: Partial<T>, options?: RequestOptions) => Promise<APIResponse<T>>;
  delete: (id: string | number, options?: RequestOptions) => Promise<APIResponse<void>>;
}

// Singleton instance
export const api = new API();