/**
 * Hook for notifications with WebSocket support
 */

import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { notificationsApi, type Notification } from "../api";
import useWebSocket, { ReadyState } from "react-use-websocket";

interface WebSocketNotificationMessage {
  type: "notification" | "unread_count" | "new_notification";
  notification?: any;
  unread_count?: number;
  count?: number; // Backend sends 'count' for unread_count messages
  // Properties for new_notification type
  notification_id?: number;
  title?: string;
  message?: string;
  verb?: string;
  timestamp?: string;
}

export function useNotifications() {
  const { accessToken, isAuthenticated, user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);

  // WebSocket URL
  const socketUrl = useMemo(() => {
    if (!isAuthenticated || !user || !accessToken) return null;

    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
    const wsProtocol = apiBaseUrl.startsWith("https") ? "wss" : "ws";
    const urlWithoutProtocol = apiBaseUrl.replace(/^https?:\/\//, "");
    const host = urlWithoutProtocol.replace(/\/api$/, "");

    return `${wsProtocol}://${host}/ws/notifications/?token=${accessToken}`;
  }, [isAuthenticated, user, accessToken]);

  // Handle WebSocket messages
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const message: WebSocketNotificationMessage = JSON.parse(event.data);

        if (message.type === "new_notification" && message.notification_id) {
          // Backend sends flat notification data, transform it to match our Notification type
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

          console.log(
            "[useNotifications] Adding notification to state:",
            newNotification
          );
          setNotifications((prev) => [newNotification, ...prev]);

          if (message.unread_count !== undefined) {
            setUnreadCount(message.unread_count);
          } else {
            setUnreadCount((prev) => prev + 1);
          }
        } else if (message.type === "notification" && message.notification) {
          // Legacy format: nested notification object
          setNotifications((prev) => [message.notification!, ...prev]);
          setUnreadCount((prev) => prev + 1);
        } else if (message.type === "unread_count") {
          // Backend can send either 'count' or 'unread_count'
          const count = message.count ?? message.unread_count;
          if (count !== undefined) {
            setUnreadCount(count);
          }
        }
      } catch (error) {
        console.error("Failed to parse notification WebSocket message:", error);
      }
    },
    [user]
  );

  // WebSocket connection
  const { readyState } = useWebSocket(socketUrl, {
    onMessage: handleMessage,
    shouldReconnect: () => isAuthenticated,
    reconnectAttempts: 5,
    reconnectInterval: 3000,
    share: true, // Share WebSocket connection across all hook instances
  });

  const isConnected = readyState === ReadyState.OPEN;

  // Fetch initial notifications
  const fetchNotifications = useCallback(
    async (reset = false, limit = 20, offset = 0) => {
      if (!accessToken) {
        return;
      }

      setIsLoading(true);
      try {
        const response = await notificationsApi.getAll(
          accessToken,
          limit,
          offset
        );

        if (reset) {
          setNotifications(response.notifications || []);
        } else {
          setNotifications((prev) => [
            ...prev,
            ...(response.notifications || []),
          ]);
        }

        setHasMore(!!response.next);
      } catch (error) {
        console.error(
          "[useNotifications] Failed to fetch notifications:",
          error
        );
      } finally {
        setIsLoading(false);
      }
    },
    [accessToken]
  );

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!accessToken) return;

    try {
      const response = await notificationsApi.getUnreadCount(accessToken);
      setUnreadCount(response.unread_count || 0);
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  }, [accessToken]);

  // Mark notification as read
  const markAsRead = useCallback(
    async (notificationId: number) => {
      if (!accessToken) return;

      try {
        console.log(
          "[useNotifications] Marking notification as read:",
          notificationId
        );
        await notificationsApi.markAsRead(notificationId, accessToken);

        // Update local state
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.id === notificationId ? { ...notif, unread: false } : notif
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (error) {
        console.error(
          "[useNotifications] Failed to mark notification as read:",
          error
        );
      }
    },
    [accessToken]
  );

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!accessToken) return;

    try {
      await notificationsApi.markAllAsRead(accessToken);

      // Update local state
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, unread: false }))
      );
      setUnreadCount(0);
      // Fetch updated count from server to ensure sync
      await fetchUnreadCount();
    } catch (error) {
      console.error(
        "[useNotifications] Failed to mark all notifications as read:",
        error
      );
    }
  }, [accessToken, fetchUnreadCount]);

  // Load more notifications
  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      fetchNotifications(false, 20, notifications.length);
    }
  }, [isLoading, hasMore, fetchNotifications, notifications.length]);

  // Initial fetch
  useEffect(() => {
    if (accessToken) {
      fetchNotifications(true);
      fetchUnreadCount();
    }
  }, [accessToken, fetchNotifications, fetchUnreadCount]); // Only run on mount or when accessToken changes

  return {
    notifications,
    unreadCount,
    isLoading,
    hasMore,
    isConnected,
    markAsRead,
    markAllAsRead,
    loadMore,
    refresh: async () => {
      await fetchNotifications(true);
      await fetchUnreadCount();
    },
  };
}
