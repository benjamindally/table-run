import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { authApi, type AuthResponse, type Player } from "@league-genius/shared";
import { useUserContextStore } from "./userContextStore";
import { useNotificationsStore } from "./notificationsStore";

interface AuthUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
}

interface AuthState {
  user: AuthUser | null;
  player: Player | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
  refreshAccessToken: () => Promise<boolean>;
}

const TOKEN_KEY = "auth_tokens";
const USER_KEY = "auth_user";

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  player: null,
  accessToken: null,
  refreshToken: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const response = await authApi.login({ email, password });
      const data = response as AuthResponse;

      // Store tokens securely
      await SecureStore.setItemAsync(
        TOKEN_KEY,
        JSON.stringify({ access: data.access, refresh: data.refresh })
      );
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(data.user));

      set({
        user: data.user,
        player: data.player,
        accessToken: data.access,
        refreshToken: data.refresh,
        isAuthenticated: true,
        isLoading: false,
      });

      // Load user context (leagues, teams, seasons)
      useUserContextStore.getState().loadUserContext();

      // Initialize notifications
      useNotificationsStore.getState().fetchUnreadCount();
      useNotificationsStore.getState().connectWebSocket();
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    const { refreshToken, accessToken } = get();

    try {
      if (refreshToken && accessToken) {
        await authApi.logout(refreshToken, accessToken);
      }
    } catch {
      // Ignore logout errors
    }

    // Clear stored data
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);

    // Clear user context
    useUserContextStore.getState().clearUserContext();

    // Clear notifications
    useNotificationsStore.getState().disconnectWebSocket();
    useNotificationsStore.getState().clearNotifications();

    set({
      user: null,
      player: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  },

  loadStoredAuth: async () => {
    set({ isLoading: true });
    try {
      const tokensJson = await SecureStore.getItemAsync(TOKEN_KEY);
      const userJson = await SecureStore.getItemAsync(USER_KEY);

      if (tokensJson && userJson) {
        const tokens = JSON.parse(tokensJson);
        const user = JSON.parse(userJson);

        set({
          user,
          accessToken: tokens.access,
          refreshToken: tokens.refresh,
          isAuthenticated: true,
          isLoading: false,
        });

        // Try to refresh token to validate it's still good
        const refreshed = await get().refreshAccessToken();
        if (!refreshed) {
          await get().logout();
        } else {
          // Load user context after successful token refresh
          useUserContextStore.getState().loadUserContext();

          // Initialize notifications
          useNotificationsStore.getState().fetchUnreadCount();
          useNotificationsStore.getState().connectWebSocket();
        }
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  refreshAccessToken: async () => {
    const { refreshToken } = get();
    if (!refreshToken) return false;

    try {
      const response = await authApi.refreshToken(refreshToken);
      const data = response as { access: string };

      // Update stored tokens
      const tokensJson = await SecureStore.getItemAsync(TOKEN_KEY);
      if (tokensJson) {
        const tokens = JSON.parse(tokensJson);
        tokens.access = data.access;
        await SecureStore.setItemAsync(TOKEN_KEY, JSON.stringify(tokens));
      }

      set({ accessToken: data.access });
      return true;
    } catch {
      return false;
    }
  },
}));
