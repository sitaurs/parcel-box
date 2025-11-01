/**
 * Badge API utilities for updating app icon badge
 * Shows unread count on the app icon
 */

export const Badge = {
  /**
   * Set badge count
   */
  async set(count: number) {
    try {
      if ('setAppBadge' in navigator) {
        await (navigator as any).setAppBadge(count);
      }
    } catch (error) {
      console.error('Failed to set app badge:', error);
    }
  },

  /**
   * Clear badge
   */
  async clear() {
    try {
      if ('clearAppBadge' in navigator) {
        await (navigator as any).clearAppBadge();
      }
    } catch (error) {
      console.error('Failed to clear app badge:', error);
    }
  },

  /**
   * Increment badge count
   */
  increment(currentCount: number) {
    return this.set(currentCount + 1);
  },

  /**
   * Decrement badge count
   */
  decrement(currentCount: number) {
    const newCount = Math.max(0, currentCount - 1);
    if (newCount === 0) {
      return this.clear();
    }
    return this.set(newCount);
  },
};
