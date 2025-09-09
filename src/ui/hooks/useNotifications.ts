import { useState, useEffect, useCallback } from 'react';
import { storage } from '@forge/bridge';
import { NotificationMessage, UseNotificationsReturn } from '../types';

export const useNotifications = (userId: string): UseNotificationsReturn => {
  const [notifications, setNotifications] = useState<NotificationMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const storedNotifications = await storage.get(`notifications_${userId}`);
      setNotifications(storedNotifications || []);
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setError('Failed to load notifications. Please try again.');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const saveNotifications = useCallback(
    async (updatedNotifications: NotificationMessage[]) => {
      try {
        await storage.set(`notifications_${userId}`, updatedNotifications);
        setNotifications(updatedNotifications);
      } catch (err) {
        console.error('Failed to save notifications:', err);
        setError('Failed to save notification state.');
      }
    },
    [userId]
  );

  const dismissNotification = useCallback(
    async (id: string) => {
      const updatedNotifications = notifications.filter(
        notification => notification.id !== id
      );
      await saveNotifications(updatedNotifications);

      // Track dismissal for analytics
      try {
        const dismissedNotification = notifications.find(n => n.id === id);
        if (dismissedNotification && dismissedNotification.issue) {
          const trackingKey = `nudge_tracking_${dismissedNotification.issue.key}`;
          const existingTracking = (await storage.get(trackingKey)) || {};

          await storage.set(trackingKey, {
            ...existingTracking,
            issueKey: dismissedNotification.issue.key,
            userResponse: 'dismissed',
            lastNudgeDate: new Date(),
          });
        }
      } catch (err) {
        console.error('Failed to track dismissal:', err);
      }
    },
    [notifications, saveNotifications]
  );

  const acknowledgeNotification = useCallback(
    async (id: string) => {
      const updatedNotifications = notifications.map(notification =>
        notification.id === id
          ? { ...notification, acknowledged: true }
          : notification
      );
      await saveNotifications(updatedNotifications);

      // Track acknowledgment for analytics
      try {
        const acknowledgedNotification = notifications.find(n => n.id === id);
        if (acknowledgedNotification && acknowledgedNotification.issue) {
          const trackingKey = `nudge_tracking_${acknowledgedNotification.issue.key}`;
          const existingTracking = (await storage.get(trackingKey)) || {};

          await storage.set(trackingKey, {
            ...existingTracking,
            issueKey: acknowledgedNotification.issue.key,
            userResponse: 'acknowledged',
            lastNudgeDate: new Date(),
            nudgeCount: (existingTracking.nudgeCount || 0) + 1,
          });
        }
      } catch (err) {
        console.error('Failed to track acknowledgment:', err);
      }
    },
    [notifications, saveNotifications]
  );

  const actionNotification = useCallback(
    async (id: string, issueKey?: string) => {
      const updatedNotifications = notifications.filter(
        notification => notification.id !== id
      );
      await saveNotifications(updatedNotifications);

      // Track action for analytics
      try {
        const actionedNotification = notifications.find(n => n.id === id);
        const targetIssueKey = issueKey || actionedNotification?.issue?.key;

        if (targetIssueKey) {
          const trackingKey = `nudge_tracking_${targetIssueKey}`;
          const existingTracking = (await storage.get(trackingKey)) || {};

          await storage.set(trackingKey, {
            ...existingTracking,
            issueKey: targetIssueKey,
            userResponse: 'actioned',
            lastNudgeDate: new Date(),
            nudgeCount: (existingTracking.nudgeCount || 0) + 1,
            effectivenessScore: Math.min(
              (existingTracking.effectivenessScore || 0) + 0.3,
              1.0
            ),
          });
        }
      } catch (err) {
        console.error('Failed to track action:', err);
      }
    },
    [notifications, saveNotifications]
  );

  const clearAllNotifications = useCallback(async () => {
    await saveNotifications([]);
  }, [saveNotifications]);

  // Listen for new notifications from the background service
  useEffect(() => {
    const handleNewNotification = (event: CustomEvent<NotificationMessage>) => {
      setNotifications(prev => [event.detail, ...prev]);
    };

    window.addEventListener(
      'gentle-nudge-notification',
      handleNewNotification as EventListener
    );

    return () => {
      window.removeEventListener(
        'gentle-nudge-notification',
        handleNewNotification as EventListener
      );
    };
  }, []);

  useEffect(() => {
    if (userId) {
      loadNotifications();
    }
  }, [userId, loadNotifications]);

  return {
    notifications,
    dismissNotification,
    acknowledgeNotification,
    actionNotification,
    clearAllNotifications,
    loading,
    error,
  };
};
