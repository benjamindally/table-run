# Notifications Implementation Summary

## Overview
Announcements and notifications are treated as the same thing. When a League Operator creates an announcement, it appears in all users' notification bell dropdown.

## Frontend Implementation ✅

### Files Created/Modified
1. **API Layer** - `src/api/notifications.ts`
   - Contains both `announcementsApi` and `notificationsApi`
   - Announcements are used as notifications in the UI

2. **WebSocket Hook** - `src/hooks/useNotifications.ts`
   - Connects to WebSocket at `ws://localhost:8000/ws/notifications/`
   - Fetches announcements from `/api/announcements/`
   - Real-time updates when new announcements are created
   - Auto-reconnect with 5 retry attempts

3. **UI Component** - `src/components/NotificationsDropdown.tsx`
   - Dropdown shows announcements with priority icons
   - Displays title, message, and relative timestamp
   - "Mark all as read" button (local state only for now)
   - Load more functionality for pagination

4. **Admin Header** - `src/components/navigation/AdminHeader.tsx`
   - Bell icon with red dot badge when unread count > 0
   - Clicking bell opens notifications dropdown

5. **Dashboard** - `src/pages/admin/DashboardPage.tsx`
   - "Announce" button for League Operators
   - Opens CreateAnnouncementModal

6. **Announcement Modal** - `src/components/CreateAnnouncementModal.tsx`
   - Form to create announcements
   - Priority levels: low, normal, high, urgent

## Backend Status

### What Works ✅
- `/api/announcements/` - Create and fetch announcements
- `ws://localhost:8000/ws/notifications/` - WebSocket for real-time updates
- Creating announcements automatically generates notifications via `django-notifications-hq`

### What's Missing ❌
The backend doesn't expose the `notifications` model from `django-notifications-hq` via REST API. Currently, the frontend uses announcements as notifications, but for proper read/unread tracking, you need to:

1. Create a `NotificationViewSet` in Django:
```python
from notifications.models import Notification
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    def get_queryset(self):
        return self.request.user.notifications.all()

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        count = request.user.notifications.unread().count()
        return Response({'unread_count': count})

    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        notification = self.get_object()
        notification.mark_as_read()
        return Response({'status': 'marked as read'})

    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        request.user.notifications.mark_all_as_read()
        return Response({'status': 'all marked as read'})
```

2. Register it in `urls.py`:
```python
router.register(r'notifications', NotificationViewSet, basename='notification')
```

## Current Behavior

### With Backend Endpoints Missing
- ✅ Announcements can be created by League Operators
- ✅ WebSocket connects and receives real-time updates
- ✅ Bell icon shows in admin header
- ✅ Dropdown displays announcements
- ⚠️ All announcements show as "unread" (no tracking yet)
- ⚠️ "Mark as read" only updates local state
- ⚠️ Unread count = total announcement count

### Once Backend Endpoints Added
- ✅ Proper unread/read tracking per user
- ✅ "Mark as read" persists to database
- ✅ "Mark all as read" persists to database
- ✅ Accurate unread count per user
- ✅ Individual notification details from `django-notifications-hq`

## Testing

1. **Create an announcement**: Log in as a League Operator → Admin Dashboard → Click "Announce" button on any league
2. **View notifications**: Click the bell icon in admin header
3. **Real-time updates**: Have multiple users open, create announcement, see it appear instantly

## Dependencies Added
- `date-fns` - For relative timestamps ("2 hours ago")
- `react-use-websocket` - Already installed for match scoring

## Next Steps (Backend)
1. Create NotificationViewSet as shown above
2. Add serializer for Notification model
3. Register routes in urls.py
4. Test read/unread tracking
5. Consider adding pagination to notifications endpoint
