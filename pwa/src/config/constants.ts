/**
 * Application Constants
 * Centralized configuration values to avoid magic numbers
 */

// Animation Delays (milliseconds)
export const ANIMATION_DELAYS = {
  BLOB_PRIMARY: 2000,
  BLOB_SECONDARY: 4000,
  STAGGER_BASE: 100, // Base delay for staggered animations
  FADE_IN: 300,
  SCALE_IN: 500,
  SLIDE_IN: 400,
} as const;

// Device Control Settings
export const DEVICE_LIMITS = {
  DISTANCE_MIN: 2,
  DISTANCE_MAX: 95,
  DISTANCE_DEFAULT_MIN: 12,
  DISTANCE_DEFAULT_MAX: 25,
  LOCK_DURATION_MIN: 100,
  LOCK_DURATION_MAX: 300000,
  LOCK_DURATION_DEFAULT: 5000,
  BUZZER_DURATION_MIN: 100,
  BUZZER_DURATION_MAX: 300000,
  BUZZER_DURATION_DEFAULT: 60000,
} as const;

// API Configuration
export const API_CONFIG = {
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  TIMEOUT: 30000,
  CACHE_TTL: 300000, // 5 minutes
} as const;

// WebSocket Configuration
export const WS_CONFIG = {
  RECONNECT_DELAY: 1000,
  MAX_RECONNECT_DELAY: 30000,
  HEARTBEAT_INTERVAL: 30000,
  CONNECTION_TIMEOUT: 10000,
} as const;

// UI Configuration
export const UI_CONFIG = {
  TOAST_DURATION: 3000,
  LOADING_SKELETON_COUNT: 8,
  PACKAGES_PER_PAGE: 20,
  GALLERY_GRID_COLS: 3,
  MOBILE_BREAKPOINT: 768,
} as const;

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'dd MMM yyyy, HH:mm',
  SHORT: 'dd/MM/yyyy',
  TIME_ONLY: 'HH:mm',
  ISO: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
} as const;

// Image Configuration
export const IMAGE_CONFIG = {
  PLACEHOLDER_WIDTH: 800,
  PLACEHOLDER_HEIGHT: 600,
  THUMBNAIL_SIZE: 200,
  MAX_FILE_SIZE: 5242880, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
} as const;

// Performance Thresholds
export const PERFORMANCE = {
  DEBOUNCE_SEARCH: 300,
  THROTTLE_SCROLL: 100,
  LAZY_LOAD_THRESHOLD: 0.5, // 50% viewport
  MAX_CONCURRENT_REQUESTS: 3,
} as const;

// Feature Flags
export const FEATURES = {
  ENABLE_PUSH_NOTIFICATIONS: true,
  ENABLE_WHATSAPP: true,
  ENABLE_OFFLINE_MODE: true,
  ENABLE_DEBUG_LOGS: import.meta.env.DEV,
} as const;
