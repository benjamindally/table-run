import React, { useEffect, useState } from "react";
import { X, AlertCircle, AlertTriangle, Bell } from "lucide-react";
import { announcementsApi, type Announcement, type Notification } from "../api";
import { useAuth } from "../contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";

interface NotificationModalProps {
  notification: Notification | null;
  isOpen: boolean;
  onClose: () => void;
}

const NotificationModal: React.FC<NotificationModalProps> = ({
  notification,
  isOpen,
  onClose,
}) => {
  const { accessToken } = useAuth();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!notification || !isOpen) {
      setAnnouncement(null);
      setError(null);
      return;
    }

    // For now, we only handle announcements
    // In the future, we'll parse action_object_content_type to determine the type
    const fetchContent = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Get the action_object_id from the notification
        const objectId = notification.action_object_id;

        if (!objectId) {
          // No linked content - just display the notification description as fallback
          setIsLoading(false);
          return;
        }

        // For now, assume it's an announcement
        // TODO: Parse action_object_content_type to determine the endpoint
        const response = await announcementsApi.getById(
          parseInt(objectId),
          accessToken || undefined
        );
        setAnnouncement(response);
      } catch (err) {
        console.error("Failed to fetch notification content:", err);
        setError("Failed to load notification content");
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, [notification, isOpen, accessToken]);

  const handleClose = () => {
    onClose();
  };

  if (!isOpen || !notification) return null;

  const getPriorityIcon = (priority?: string) => {
    switch (priority) {
      case "urgent":
        return <AlertTriangle className="h-6 w-6 text-red-600" />;
      case "high":
        return <AlertCircle className="h-6 w-6 text-orange-600" />;
      default:
        return <Bell className="h-6 w-6 text-primary-600" />;
    }
  };

  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "normal":
        return "bg-blue-100 text-blue-800";
      case "low":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            {announcement && getPriorityIcon(announcement.priority)}
            <h2 className="text-xl font-semibold text-dark">Notification</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-gray-600">{error}</p>
            </div>
          ) : announcement ? (
            <div className="space-y-4">
              {/* Priority Badge */}
              <div className="flex items-center space-x-2">
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full ${getPriorityBadge(
                    announcement.priority
                  )}`}
                >
                  {announcement.priority.toUpperCase()}
                </span>
                <span className="text-sm text-gray-500">
                  {formatDistanceToNow(new Date(announcement.created_at), {
                    addSuffix: true,
                  })}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-dark">
                {announcement.title}
              </h3>

              {/* Message */}
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {announcement.message}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Fallback to notification description if no announcement */}
              <p className="text-gray-700">{notification.description}</p>
              <p className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(notification.timestamp), {
                  addSuffix: true,
                })}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
