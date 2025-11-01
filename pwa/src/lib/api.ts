import { Capacitor } from '@capacitor/core';

// Auto-detect platform
const isNative = Capacitor.isNativePlatform();

// Production server URL (will be set at build time)
// For native: Use VITE_PROD_API_URL from .env.production
// For web: Use proxy or VITE_API_BASE_URL
export const API_BASE_URL = isNative 
  ? (import.meta.env.VITE_PROD_API_URL || 'http://13.213.57.228:8080/api/v1')
  : (import.meta.env.VITE_API_BASE_URL || '/api/v1');

export interface Package {
  id: string;
  deviceId: string;
  tsDetected: string;
  tsPhoto?: string;
  tsRelease?: string;
  tsDrop?: string;
  photoUrl?: string;
  thumbUrl?: string;
  distanceCm?: number;
  note?: string;
  status: string;
  device?: {
    id: string;
    name: string;
  };
}

export interface Event {
  id: string;
  deviceId: string;
  type: string;
  ts: string;
  details: any;
  device?: {
    id: string;
    name: string;
  };
}

export interface Device {
  id: string;
  name: string;
  lastSeen?: string;
  status: string;
  fwVersion?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class ApiClient {
  private baseUrl: string;
  private token?: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string) {
    this.token = token;
  }

  private async fetch<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Generic HTTP methods
  async get<T = any>(endpoint: string): Promise<T> {
    return this.fetch<T>(endpoint, { method: 'GET' });
  }

  async post<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.fetch<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.fetch<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T = any>(endpoint: string): Promise<T> {
    return this.fetch<T>(endpoint, { method: 'DELETE' });
  }

  // Packages
  async getPackages(params?: {
    from?: string;
    to?: string;
    q?: string;
    page?: number;
    limit?: number;
    deviceId?: string;
  }): Promise<PaginatedResponse<Package>> {
    const query = new URLSearchParams();
    if (params?.from) query.set('from', params.from);
    if (params?.to) query.set('to', params.to);
    if (params?.q) query.set('q', params.q);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.deviceId) query.set('deviceId', params.deviceId);

    const queryString = query.toString();
    return this.fetch<PaginatedResponse<Package>>(
      `/packages${queryString ? `?${queryString}` : ''}`
    );
  }

  async getPackage(id: string): Promise<Package> {
    return this.fetch<Package>(`/packages/${id}`);
  }

  // Events
  async getEvents(params?: {
    from?: string;
    to?: string;
    type?: string;
    deviceId?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Event>> {
    const query = new URLSearchParams();
    if (params?.from) query.set('from', params.from);
    if (params?.to) query.set('to', params.to);
    if (params?.type) query.set('type', params.type);
    if (params?.deviceId) query.set('deviceId', params.deviceId);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));

    const queryString = query.toString();
    return this.fetch<PaginatedResponse<Event>>(
      `/events${queryString ? `?${queryString}` : ''}`
    );
  }

  // Devices
  async getDevices(): Promise<{ data: Device[] }> {
    return this.fetch<{ data: Device[] }>('/devices');
  }

  async getDevice(id: string): Promise<Device> {
    return this.fetch<Device>(`/devices/${id}`);
  }

  async controlDevice(deviceId: string, control: string, params: any): Promise<void> {
    return this.fetch<void>(`/devices/${deviceId}/control`, {
      method: 'POST',
      body: JSON.stringify({ control, ...params }),
    });
  }

  async releaseDrop(deviceId: string): Promise<void> {
    return this.fetch<void>(`/devices/${deviceId}/drop`, {
      method: 'POST',
    });
  }
}

export const api = new ApiClient(API_BASE_URL);

// Convenience exports that unwrap data
export async function getPackages(params?: { limit?: number; offset?: number; status?: string }): Promise<Package[]> {
  const result = await api.getPackages(params);
  return result.data;
}

export async function getDevices(): Promise<Device[]> {
  const result = await api.getDevices();
  return result.data;
}

export async function getEvents(params?: { limit?: number; offset?: number }): Promise<Event[]> {
  const result = await api.getEvents(params);
  return result.data;
}
