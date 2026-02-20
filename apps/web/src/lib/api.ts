const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface ApiOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

class ApiClient {
  private accessToken: string | null = null;

  setToken(token: string | null) {
    this.accessToken = token;
    if (token) {
      if (typeof window !== 'undefined') localStorage.setItem('accessToken', token);
    } else {
      if (typeof window !== 'undefined') localStorage.removeItem('accessToken');
    }
  }

  getToken(): string | null {
    if (this.accessToken) return this.accessToken;
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('accessToken');
    }
    return this.accessToken;
  }

  async fetch<T = any>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {} } = options;

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (body && !(body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      method,
      headers,
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
      credentials: 'include',
    });

    if (res.status === 401) {
      // Try refresh
      const refreshed = await this.refresh();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${this.accessToken}`;
        const retry = await fetch(`${API_BASE}${endpoint}`, {
          method,
          headers,
          body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
          credentials: 'include',
        });
        return retry.json();
      }
      this.setToken(null);
      if (typeof window !== 'undefined') window.location.href = '/login';
      throw new Error('Unauthorized');
    }

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
  }

  async refresh(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        this.setToken(data.data.accessToken);
        return true;
      }
    } catch {}
    return false;
  }

  // Auth
  async login(email: string, password: string, schoolCode?: string) {
    const data = await this.fetch('/auth/login', {
      method: 'POST',
      body: { email, password, schoolCode },
    });
    this.setToken(data.data.accessToken);
    return data.data;
  }

  async logout() {
    try {
      await this.fetch('/auth/logout', { method: 'POST' });
    } catch {}
    this.setToken(null);
  }

  // Generic CRUD
  get<T = any>(endpoint: string) {
    return this.fetch<T>(endpoint);
  }

  post<T = any>(endpoint: string, body: unknown) {
    return this.fetch<T>(endpoint, { method: 'POST', body });
  }

  put<T = any>(endpoint: string, body: unknown) {
    return this.fetch<T>(endpoint, { method: 'PUT', body });
  }

  patch<T = any>(endpoint: string, body?: unknown) {
    return this.fetch<T>(endpoint, { method: 'PATCH', body });
  }

  delete<T = any>(endpoint: string) {
    return this.fetch<T>(endpoint, { method: 'DELETE' });
  }

  // File download helper
  async download(endpoint: string, filename: string) {
    const token = this.getToken();
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: 'include',
    });
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}

export const api = new ApiClient();
