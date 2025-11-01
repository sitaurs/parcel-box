/**
 * Haptic Feedback Utilities
 * Uses Vibration API for tactile feedback on user interactions
 */

export const Haptic = {
  /**
   * Light tap feedback (e.g., button press)
   */
  light() {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  },

  /**
   * Medium tap feedback (e.g., toggle, select)
   */
  medium() {
    if ('vibrate' in navigator) {
      navigator.vibrate(20);
    }
  },

  /**
   * Heavy tap feedback (e.g., confirmation, important action)
   */
  heavy() {
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  },

  /**
   * Success pattern (e.g., save successful)
   */
  success() {
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 50, 10]);
    }
  },

  /**
   * Error pattern (e.g., validation failed)
   */
  error() {
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 100, 50]);
    }
  },

  /**
   * Warning pattern (e.g., delete confirmation)
   */
  warning() {
    if ('vibrate' in navigator) {
      navigator.vibrate([30, 50, 30, 50, 30]);
    }
  },

  /**
   * Selection change (e.g., slider, carousel)
   */
  selection() {
    if ('vibrate' in navigator) {
      navigator.vibrate(5);
    }
  },
};
