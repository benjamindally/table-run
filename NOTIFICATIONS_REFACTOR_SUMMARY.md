# Notifications System Refactor - Summary

## Overview

Refactored the notifications system to properly separate notifications from announcements, implementing a polymorphic notification system that can handle multiple content types.

## Changes Made

### 1. **API Layer** - No changes needed

- Already has both `announcementsApi` and `notificationsApi` in [src/api/notifications.ts](src/api/notifications.ts)
- Properly exported in [src/api/index.ts](src/api/index.ts)

### 2. **useNotifications Hook** - [src/hooks/useNotifications.ts](src/hooks/useNotifications.ts)

**Changed:**

- Now fetches from `/api/notifications/` instead of `/api/announcements/`
- Uses `Notification` type instead of `Announcement` type
- Fetches unread count from `/api/notifications/unread_count/`
- Implements proper `markAsRead()` - calls `/api/notifications/{id}/mark_as_read/`
- Implements proper `markAllAsRead()` - calls `/api/notifications/mark_all_as_read/`
- Properly handles pagination with `limit` and `offset` parameters
- Updates local state to reflect unread/read status

**WebSocket:**

- Still listens to `ws://localhost:8000/ws/notifications/`
- Handles real-time notification updates
- Updates unread count in real-time

### 3. **NotificationsDropdown Component** - [src/components/NotificationsDropdown.tsx](src/components/NotificationsDropdown.tsx)

**Changed:**

- Displays notifications using `description` property instead of title/message
- Shows individual red dot indicators for unread notifications
- Uses `unread` property to determine unread status
- Uses `timestamp` property for relative time display
- Clicking a notification opens a modal instead of just marking as read
- Passes notification object to modal for content fetching

### 4. **NotificationModal Component** - [src/components/NotificationModal.tsx](src/components/NotificationModal.tsx) ✨ NEW

**Features:**

- Displays full notification content in a modal
- Uses `action_object_id` to fetch related content
- Currently supports announcements (fetches from `/api/announcements/{id}`)
- Polymorphic design: ready to support other content types (e.g., `schedule_update`)
- Automatically marks notification as read when opened
- Shows priority badges and icons for announcements
- "Mark as Read" and "Dismiss" actions

## Notification Flow

### Bell Icon (AdminHeader)

1. Fetches `/api/notifications/unread_count/` on mount
2. Shows red dot if `unread_count > 0`
3. Updates in real-time via WebSocket

### Clicking Bell

1. Opens NotificationsDropdown
2. Fetches `/api/notifications/` to get all notifications
3. Displays each notification with:
   - Red dot if `unread === true`
   - Bold text if unread, gray if read
   - Description text
   - Relative timestamp

### Clicking a Notification

1. Opens NotificationModal
2. Uses `action_object_id` to fetch content:
   - For announcements: `GET /api/announcements/{id}`
   - Future: `GET /api/schedule_update/{id}`, etc.
3. Displays full content in modal
4. Marks as read when modal opens or when user clicks "Mark as Read"

### Mark All as Read

1. Calls `/api/notifications/mark_all_as_read/`
2. Updates all notifications to `unread: false` in local state
3. Sets `unreadCount` to 0

## Polymorphic Content Type Support

The system is designed to handle multiple notification types:

```typescript
// Notification structure
{
  id: 123,
  description: "New announcement in Spring League",
  action_object_content_type: "announcement",  // or "schedule_update", etc.
  action_object_id: "5",
  unread: true
}
```

**To add new content types in the future:**

1. Update `NotificationModal` to parse `action_object_content_type`
2. Add new API fetch logic for that type
3. Render content based on type

Example for schedule updates:

```typescript
if (contentType === "announcement") {
  fetch(`/api/announcements/${objectId}`);
} else if (contentType === "schedule_update") {
  fetch(`/api/schedule_updates/${objectId}`);
}
```

## Backend Requirements ✅

The backend needs to expose these endpoints (documented in NOTIFICATIONS_IMPLEMENTATION.md):

- ✅ `GET /api/notifications/` - List all notifications for user
- ✅ `GET /api/notifications/unread_count/` - Get unread count
- ✅ `POST /api/notifications/{id}/mark_as_read/` - Mark single notification as read
- ✅ `POST /api/notifications/mark_all_as_read/` - Mark all as read
- ✅ `ws://localhost:8000/ws/notifications/` - WebSocket for real-time updates

## Testing Checklist

- [ ] Bell icon shows red dot when there are unread notifications
- [ ] Clicking bell opens dropdown with all notifications
- [ ] Unread notifications show red dot and bold text
- [ ] Clicking notification opens modal with full content
- [ ] Modal fetches and displays announcement correctly
- [ ] Clicking "Mark as Read" marks notification as read
- [ ] Clicking "Mark all as read" marks all notifications as read
- [ ] WebSocket updates work in real-time
- [ ] Multiple tabs/windows stay in sync via WebSocket

## Files Modified

1. [src/hooks/useNotifications.ts](src/hooks/useNotifications.ts) - Refactored to use notifications API
2. [src/components/NotificationsDropdown.tsx](src/components/NotificationsDropdown.tsx) - Updated UI and click handlers
3. [src/components/NotificationModal.tsx](src/components/NotificationModal.tsx) - **NEW** - Modal for displaying notification content

## Files Unchanged

1. [src/api/notifications.ts](src/api/notifications.ts) - Already had correct structure
2. [src/api/index.ts](src/api/index.ts) - Already exported correctly
3. [src/components/navigation/AdminHeader.tsx](src/components/navigation/AdminHeader.tsx) - Already using `useNotifications()` correctly
