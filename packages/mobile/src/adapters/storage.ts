/**
 * Mobile storage adapter using AsyncStorage
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { StorageAdapter } from "@league-genius/shared";

export const mobileStorageAdapter: StorageAdapter = {
  async getItem(key: string): Promise<string | null> {
    return AsyncStorage.getItem(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  },

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  },
};
