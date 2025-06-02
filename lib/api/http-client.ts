import { ApiError, NetworkError } from '@/lib/errors';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface RequestOptions {
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
}

export class HttpClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private defaultTimeout: number;

  constructor(
    baseUrl: string, 
    defaultHeaders: Record<string, string> = {}, 
    defaultTimeout: number = 30000
  ) {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    this.defaultHeaders = defaultHeaders;
    this.defaultTimeout = defaultTimeout;
  }

  async request<T>(method: HttpMethod, endpoint: string, options: RequestOptions = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    
    const headers = {
      ...this.defaultHeaders,
      ...options.headers,
    };

    if (options.body instanceof FormData && headers['Content-Type']) {
      delete headers['Content-Type'];
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || this.defaultTimeout);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: options.body ? 
          (headers['Content-Type'] === 'application/json' ? JSON.stringify(options.body) : options.body) : 
          undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      const data = isJson ? await response.json() : await response.text();

      if (!response.ok) {
        throw new ApiError(
          response.status,
          isJson && data.error ? data.error : `Request failed with status ${response.status}`,
          data
        );
      }

      return data as T;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new NetworkError('Request timeout');
      }
      
      throw new NetworkError(error instanceof Error ? error.message : 'Network request failed');
    }
  }

  async get<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>('GET', endpoint, options);
  }

  async post<T>(endpoint: string, body: any, options: RequestOptions = {}): Promise<T> {
    return this.request<T>('POST', endpoint, {
      ...options,
      body,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  }

  async put<T>(endpoint: string, body: any, options: RequestOptions = {}): Promise<T> {
    return this.request<T>('PUT', endpoint, {
      ...options,
      body,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  }

  async delete<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>('DELETE', endpoint, options);
  }
}
