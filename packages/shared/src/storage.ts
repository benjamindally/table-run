/**
 * Storage adapter interface for cross-platform storage
 * Web: localStorage
 * React Native: AsyncStorage or SecureStore
 */

export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

// Default storage adapter (will be set by platform)
let storageAdapter: StorageAdapter | null = null;

export function setStorageAdapter(adapter: StorageAdapter) {
  storageAdapter = adapter;
}

export function getStorageAdapter(): StorageAdapter {
  if (!storageAdapter) {
    throw new Error('Storage adapter not configured. Call setStorageAdapter() first.');
  }
  return storageAdapter;
}

// Convenience functions that use the configured adapter
export const storage = {
  async getItem(key: string): Promise<string | null> {
    return getStorageAdapter().getItem(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    return getStorageAdapter().setItem(key, value);
  },

  async removeItem(key: string): Promise<void> {
    return getStorageAdapter().removeItem(key);
  },
};
