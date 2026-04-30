import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { authApi, playersApi, setRefreshTokenCallback, type AuthResponse, type Player, type PlayerUpdateData, type RegisterData } from "@league-genius/shared";
// SUBSCRIPTIONS_DISABLED: import Purchases from "react-native-purchases";
import { useUserContextStore } from "./userContextStore";
import { useNotificationsStore } from "./notificationsStore";
import { useMatchScoringStore } from "./matchScoringStore";
// SUBSCRIPTIONS_DISABLED: import { useSubscriptionStore } from "./subscriptionStore";

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
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
  loadStoredAuth: () => Promise<void>;
  refreshAccessToken: () => Promise<boolean>;
  updateProfile: (data: PlayerUpdateData) => Promise<void>;
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

      // SUBSCRIPTIONS_DISABLED:
      // if (data.player?.id) {
      //   try { await Purchases.logIn(`player_${data.player.id}`); } catch (e) {}
      // }

      // Load user context (leagues, teams, seasons)
      useUserContextStore.getState().loadUserContext();

      // SUBSCRIPTIONS_DISABLED:
      // useSubscriptionStore.getState().loadEntitlements();
      // useSubscriptionStore.getState().loadOfferings();

      // Initialize notifications
      useNotificationsStore.getState().fetchUnreadCount();
      useNotificationsStore.getState().connectWebSocket();
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (data: RegisterData) => {
    set({ isLoading: true });
    try {
      const response = await authApi.register(data);
      const authData = response as AuthResponse;

      await SecureStore.setItemAsync(
        TOKEN_KEY,
        JSON.stringify({ access: authData.access, refresh: authData.refresh })
      );
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(authData.user));

      set({
        user: authData.user,
        player: authData.player,
        accessToken: authData.access,
        refreshToken: authData.refresh,
        isAuthenticated: true,
        isLoading: false,
      });

      // SUBSCRIPTIONS_DISABLED:
      // if (authData.player?.id) {
      //   try { await Purchases.logIn(`player_${authData.player.id}`); } catch (e) {}
      // }

      useUserContextStore.getState().loadUserContext();

      // SUBSCRIPTIONS_DISABLED:
      // useSubscriptionStore.getState().loadEntitlements();
      // useSubscriptionStore.getState().loadOfferings();

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

    // Clear match scoring state
    useMatchScoringStore.getState().clearMatch();

    // SUBSCRIPTIONS_DISABLED:
    // useSubscriptionStore.getState().clearSubscription();
    // try { await Purchases.logOut(); } catch {}

    set({
      user: null,
      player: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  },

  deleteAccount: async (password: string) => {
    const { accessToken } = get();
    if (!accessToken) throw new Error("Not authenticated");

    await authApi.deleteAccount(password, accessToken);

    // Clear stored data
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);

    // Clear user context
    useUserContextStore.getState().clearUserContext();

    // Clear notifications
    useNotificationsStore.getState().disconnectWebSocket();
    useNotificationsStore.getState().clearNotifications();

    // Clear match scoring state
    useMatchScoringStore.getState().clearMatch();

    // SUBSCRIPTIONS_DISABLED:
    // useSubscriptionStore.getState().clearSubscription();
    // try { await Purchases.logOut(); } catch {}

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
          // SUBSCRIPTIONS_DISABLED:
          // const { player } = get();
          // if (player?.id) {
          //   try { await Purchases.logIn(`player_${player.id}`); } catch (e) {}
          // }

          // Load user context after successful token refresh
          useUserContextStore.getState().loadUserContext();

          // SUBSCRIPTIONS_DISABLED:
          // useSubscriptionStore.getState().loadEntitlements();
          // useSubscriptionStore.getState().loadOfferings();

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

  updateProfile: async (data: PlayerUpdateData) => {
    const { player, accessToken, user } = get();
    if (!player || !accessToken) throw new Error("Not authenticated");
    const updated = await playersApi.update(player.id, data, accessToken);
    const updatedUser = user
      ? {
          ...user,
          first_name: updated.first_name ?? user.first_name,
          last_name: updated.last_name ?? user.last_name,
          email: updated.email ?? user.email,
        }
      : user;
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(updatedUser));
    set({ player: updated, user: updatedUser });
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

// Wire up the shared API client's 401 auto-refresh
setRefreshTokenCallback(async () => {
  const store = useAuthStore.getState();
  const refreshed = await store.refreshAccessToken();
  return refreshed ? useAuthStore.getState().accessToken : null;
});
