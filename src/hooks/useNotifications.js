import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

/**
 * Custom hook for notifications with polling
 * Fetches notifications periodically and shows toast notifications for new items
 *
 * @param {number} pollingInterval - Interval in milliseconds (default: 60000 = 1 minute)
 * @returns {object} - { notifications, unreadCount, markAsRead, refresh }
 */
export const useNotifications = (pollingInterval = 60000) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastFetchTime, setLastFetchTime] = useState(null);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    try {
      // TODO: Replace with actual API endpoint when backend implements it
      // For now, return empty array as placeholder
      // const response = await apiClient.get('/notifications');
      // const newNotifications = response.data.data || [];

      // Placeholder: empty notifications array
      const newNotifications = [];

      // Check for new notifications since last fetch
      if (lastFetchTime && newNotifications.length > 0) {
        const newItems = newNotifications.filter(
          notif => new Date(notif.createdAt) > new Date(lastFetchTime)
        );

        // Show toast for new notifications
        newItems.forEach(notif => {
          toast.info(notif.title, {
            description: notif.message,
            duration: 5000,
          });
        });
      }

      setNotifications(newNotifications);
      setUnreadCount(newNotifications.filter(n => !n.read).length);
      setLastFetchTime(new Date().toISOString());
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Don't show error toast to avoid annoying users
    }
  }, [lastFetchTime]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      // TODO: Replace with actual API call
      // await apiClient.put(`/notifications/${notificationId}/read`);

      // Update local state
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Manual refresh
  const refresh = useCallback(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Setup polling
  useEffect(() => {
    // Initial fetch
    fetchNotifications();

    // Setup interval for polling
    const intervalId = setInterval(fetchNotifications, pollingInterval);

    // Cleanup
    return () => {
      clearInterval(intervalId);
    };
  }, [fetchNotifications, pollingInterval]);

  // Fetch notifications when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchNotifications();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    refresh,
  };
};
