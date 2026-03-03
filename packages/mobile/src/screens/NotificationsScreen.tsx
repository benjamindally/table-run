import { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { Bell, CheckCheck } from "lucide-react-native";
import { useNotificationsStore } from "../stores/notificationsStore";
import type { Notification } from "@league-genius/shared";

/**
 * Format a timestamp as relative time (e.g., "2 hours ago")
 */
function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) {
    return "just now";
  } else if (diffMin < 60) {
    return `${diffMin}m ago`;
  } else if (diffHour < 24) {
    return `${diffHour}h ago`;
  } else if (diffDay < 7) {
    return `${diffDay}d ago`;
  } else {
    return date.toLocaleDateString();
  }
}

interface NotificationItemProps {
  notification: Notification;
  onPress: () => void;
}

function NotificationItem({ notification, onPress }: NotificationItemProps) {
  // Get title from data if available
  const data = notification.data as { title?: string; message?: string } | null;
  const title = data?.title || notification.verb;
  const message = data?.message || notification.description;

  return (
    <TouchableOpacity
      onPress={onPress}
      className={`p-4 border-b border-gray-100 ${
        notification.unread ? "bg-primary-50" : "bg-white"
      }`}
      activeOpacity={0.7}
    >
      <View className="flex-row items-start">
        {notification.unread && (
          <View className="w-2 h-2 bg-accent rounded-full mr-3 mt-2" />
        )}
        <View className={`flex-1 ${notification.unread ? "" : "ml-5"}`}>
          {title && (
            <Text
              className={`text-gray-900 ${
                notification.unread ? "font-semibold" : "font-normal"
              }`}
            >
              {title}
            </Text>
          )}
          {message && (
            <Text className="text-gray-600 text-sm mt-1" numberOfLines={2}>
              {message}
            </Text>
          )}
          <Text className="text-gray-400 text-xs mt-2">
            {formatRelativeTime(notification.timestamp)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const {
    notifications,
    isLoading,
    hasMore,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotificationsStore();

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchNotifications(true);
  }, [fetchNotifications]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications(true);
    setRefreshing(false);
  }, [fetchNotifications]);

  const handleLoadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      fetchNotifications(false, 20, notifications.length);
    }
  }, [isLoading, hasMore, fetchNotifications, notifications.length]);

  const handleNotificationPress = useCallback(
    async (notification: Notification) => {
      if (notification.unread) {
        await markAsRead(notification.id);
      }
      // Future: navigate to relevant screen based on notification type
    },
    [markAsRead]
  );

  const handleMarkAllAsRead = useCallback(async () => {
    await markAllAsRead();
  }, [markAllAsRead]);

  // Empty state
  if (!isLoading && notifications.length === 0) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center p-8">
        <Bell color="#9ca3af" size={48} />
        <Text className="text-gray-500 text-lg mt-4 font-medium">
          No notifications yet
        </Text>
        <Text className="text-gray-400 text-center mt-2">
          You'll be notified about match updates, team announcements, and more
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Mark all as read header */}
      {unreadCount > 0 && (
        <TouchableOpacity
          onPress={handleMarkAllAsRead}
          className="flex-row items-center justify-center py-3 bg-white border-b border-gray-100"
          activeOpacity={0.7}
        >
          <CheckCheck color="#26A69A" size={18} />
          <Text className="text-primary font-medium ml-2">Mark all as read</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <NotificationItem
            notification={item}
            onPress={() => handleNotificationPress(item)}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#26A69A"
            colors={["#26A69A"]}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isLoading && notifications.length > 0 ? (
            <View className="py-4">
              <ActivityIndicator color="#26A69A" />
            </View>
          ) : null
        }
        contentContainerStyle={
          notifications.length === 0 ? { flex: 1 } : undefined
        }
      />
    </View>
  );
}
