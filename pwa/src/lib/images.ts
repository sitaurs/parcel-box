/**
 * Get full image URL with proper base URL
 * In development: uses Vite proxy (/media/...)
 * In production: uses backend URL from env
 */
export function getImageUrl(path: string | undefined): string {
  if (!path) return '';
  
  // If already absolute URL, return as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // In development, Vite proxy handles /media paths
  if (import.meta.env.DEV) {
    return path; // Vite akan proxy ke backend
  }
  
  // In production, prepend backend URL
  const apiUrl = import.meta.env.VITE_API_URL || window.location.origin;
  return `${apiUrl}${path}`;
}

/**
 * Get placeholder image for error fallback
 */
export function getPlaceholderImage(): string {
  return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23e5e7eb" width="400" height="400"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="24" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3ENo Image%3C/text%3E%3C/svg%3E';
}
