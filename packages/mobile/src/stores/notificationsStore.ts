import { create } from "zustand";
import { notificationsApi, type Notification } from "@league-genius/shared";
import { useAuthStore } from "./authStore";
import { API_BASE_URL } from "../config";

interface WebSocketNotificationMessage {
  type: "notification" | "unread_count" | "new_notification";
  notification?: Notification;
  unread_count?: number;
  count?: number;
  notification_id?: number;
  title?: string;
  message?: string;
  verb?: string;
  timestamp?: string;
}

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  hasMore: boolean;
  isConnected: boolean;
  error: string | null;

  // WebSocket
  websocket: WebSocket | null;
  reconnectAttempts: number;
  reconnectTimeout: ReturnType<typeof setTimeout> | null;

  // Actions
  fetchNotifications: (
    reset?: boolean,
    limit?: number,
    offset?: number
  ) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;

  // WebSocket actions
  connectWebSocket: () => void;
  disconnectWebSocket: () => void;
  handleWebSocketMessage: (data: WebSocketNotificationMessage) => void;

  // Helpers
  addNotification: (notification: Notification) => void;
  clearNotifications: () => void;
}

const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_BASE_DELAY = 1000; // 1 second

const getWebSocketUrl = (accessToken: string): string => {
  const wsProtocol = API_BASE_URL.startsWith("https") ? "wss" : "ws";
  const urlWithoutProtocol = API_BASE_URL.replace(/^https?:\/\//, "");
  const host = urlWithoutProtocol.replace(/\/api$/, "");

  return `${wsProtocol}://${host}/ws/notifications/?token=${accessToken}`;
};

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  hasMore: false,
  isConnected: false,
  error: null,
  websocket: null,
  reconnectAttempts: 0,
  reconnectTimeout: null,

  fetchNotifications: async (reset = false, limit = 20, offset = 0) => {
    const { accessToken } = useAuthStore.getState();
    if (!accessToken) return;

    set({ isLoading: true, error: null });
    try {
      const response = await notificationsApi.getAll(
        accessToken,
        limit,
        offset
      );

      if (reset) {
        set({ notifications: response.notifications || [] });
      } else {
        set((state) => ({
          notifications: [
            ...state.notifications,
            ...(response.notifications || []),
          ],
        }));
      }

      set({ hasMore: !!response.next });
    } catch (error) {
      console.error(
        "[notificationsStore] Failed to fetch notifications:",
        error
      );
      set({ error: "Failed to load notifications" });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchUnreadCount: async () => {
    const { accessToken } = useAuthStore.getState();
    if (!accessToken) return;

    try {
      const response = await notificationsApi.getUnreadCount(accessToken);
      set({ unreadCount: response.unread_count || 0 });
    } catch (error) {
      console.error(
        "[notificationsStore] Failed to fetch unread count:",
        error
      );
    }
  },

  markAsRead: async (notificationId: number) => {
    const { accessToken } = useAuthStore.getState();
    if (!accessToken) return;

    try {
      await notificationsApi.markAsRead(notificationId, accessToken);

      set((state) => ({
        notifications: state.notifications.map((notif) =>
          notif.id === notificationId ? { ...notif, unread: false } : notif
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error) {
      console.error(
        "[notificationsStore] Failed to mark notification as read:",
        error
      );
    }
  },

  markAllAsRead: async () => {
    const { accessToken } = useAuthStore.getState();
    if (!accessToken) return;

    try {
      await notificationsApi.markAllAsRead(accessToken);

      set((state) => ({
        notifications: state.notifications.map((notif) => ({
          ...notif,
          unread: false,
        })),
        unreadCount: 0,
      }));
    } catch (error) {
      console.error(
        "[notificationsStore] Failed to mark all notifications as read:",
        error
      );
    }
  },

  handleWebSocketMessage: (message: WebSocketNotificationMessage) => {
    const { user } = useAuthStore.getState();

    if (message.type === "new_notification" && message.notification_id) {
      const newNotification: Notification = {
        id: message.notification_id,
        recipient: user?.id || 0,
        actor: null,
        verb: message.verb || "",
        description: message.message || "",
        target_content_type: null,
        target_object_id: null,
        action_object_content_type: null,
        action_object_id: null,
        timestamp: message.timestamp || new Date().toISOString(),
        unread: true,
        deleted: false,
        public: false,
        data: {
          title: message.title,
          message: message.message,
        },
      };

      set((state) => ({
        notifications: [newNotification, ...state.notifications],
        unreadCount:
          message.unread_count !== undefined
            ? message.unread_count
            : state.unreadCount + 1,
      }));
    } else if (message.type === "notification" && message.notification) {
      set((state) => ({
        notifications: [message.notification!, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      }));
    } else if (message.type === "unread_count") {
      const count = message.count ?? message.unread_count;
      if (count !== undefined) {
        set({ unreadCount: count });
      }
    }
  },

  connectWebSocket: () => {
    const { accessToken } = useAuthStore.getState();
    const { websocket, reconnectTimeout } = get();

    // Clear any existing reconnect timeout
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      set({ reconnectTimeout: null });
    }

    // Close existing connection if any
    if (websocket) {
      websocket.close();
    }

    if (!accessToken) {
      return;
    }

    const url = getWebSocketUrl(accessToken);

    try {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        set({ isConnected: true, reconnectAttempts: 0 });
      };

      ws.onmessage = (event) => {
        try {
          const data: WebSocketNotificationMessage = JSON.parse(event.data);
          get().handleWebSocketMessage(data);
        } catch (error) {
          console.error(
            "[notificationsStore] Failed to parse WebSocket message:",
            error
          );
        }
      };

      ws.onerror = (error) => {
        console.error("[notificationsStore] WebSocket error:", error);
      };

      ws.onclose = () => {
        set({ isConnected: false, websocket: null });

        // Attempt reconnection if authenticated
        const { isAuthenticated } = useAuthStore.getState();
        const { reconnectAttempts } = get();

        if (isAuthenticated && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          const delay = RECONNECT_BASE_DELAY * Math.pow(2, reconnectAttempts);

          const timeout = setTimeout(() => {
            set({ reconnectAttempts: reconnectAttempts + 1 });
            get().connectWebSocket();
          }, delay);

          set({ reconnectTimeout: timeout });
        }
      };

      set({ websocket: ws });
    } catch (error) {
      console.error("[notificationsStore] Failed to create WebSocket:", error);
    }
  },

  disconnectWebSocket: () => {
    const { websocket, reconnectTimeout } = get();

    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
    }

    if (websocket) {
      websocket.close();
    }

    set({
      websocket: null,
      isConnected: false,
      reconnectAttempts: 0,
      reconnectTimeout: null,
    });
  },

  addNotification: (notification: Notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  clearNotifications: () => {
    set({
      notifications: [],
      unreadCount: 0,
      hasMore: false,
      error: null,
    });
  },
}));
