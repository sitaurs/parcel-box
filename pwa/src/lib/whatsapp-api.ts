/**
 * WhatsApp API Client
 * Dedicated HTTP client for backend-whatsapp service
 */

import { Capacitor } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();
const WA_API_URL = isNative
  ? (import.meta.env.VITE_WA_API_URL || 'http://13.213.57.228:3001')
  : (import.meta.env.VITE_WA_API_URL || 'http://localhost:3001');

export interface WAStatus {
  connected: boolean;
  me?: string;
  ts?: string;
  error?: string;
}

export interface SendMessageRequest {
  to: string;
  text?: string;
  image?: string; // base64
  caption?: string;
}

/**
 * Start WhatsApp service
 */
export async function startWhatsApp(phone?: string): Promise<WAStatus> {
  const response = await fetch(`${WA_API_URL}/api/wa/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to start WhatsApp');
  }

  return response.json();
}

/**
 * Stop WhatsApp service (preserve session)
 */
export async function stopWhatsApp(): Promise<void> {
  const response = await fetch(`${WA_API_URL}/api/wa/stop`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to stop WhatsApp');
  }
}

/**
 * Clear WhatsApp session (logout + delete auth)
 */
export async function clearSession(): Promise<void> {
  const response = await fetch(`${WA_API_URL}/api/wa/clear-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to clear session');
  }
}

/**
 * Get WhatsApp connection status
 */
export async function getStatus(): Promise<WAStatus> {
  const response = await fetch(`${WA_API_URL}/api/wa/status`);

  if (!response.ok) {
    throw new Error('Failed to get status');
  }

  return response.json();
}

/**
 * Send message or image
 */
export async function sendMessage(request: SendMessageRequest): Promise<void> {
  const response = await fetch(`${WA_API_URL}/api/wa/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to send message');
  }
}

/**
 * Get WhatsApp backend health
 */
export async function checkHealth(): Promise<{ status: string; uptime: number }> {
  const response = await fetch(`${WA_API_URL}/health`);
  
  if (!response.ok) {
    throw new Error('WhatsApp backend not available');
  }
  
  return response.json();
}
