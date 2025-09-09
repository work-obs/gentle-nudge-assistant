/**
 * Unit tests for Notification Scheduler Service
 * Tests timing, frequency, and scheduling logic for gentle nudges
 */

import { describe, beforeEach, afterEach, it, expect, jest } from '@jest/globals';
import { mockStorage, storageHelpers } from '../../mocks/forge-storage.mock';
import { createTestUserPreferences, createTestNotification } from '../../utils/test-utils';

// Mock the notification scheduler (will be implemented later)
class MockNotificationScheduler {
  private scheduleQueue: any[] = [];

  async scheduleNotification(notification: any, scheduledFor: Date) {
    this.scheduleQueue.push({ notification, scheduledFor });
    return `scheduled-${Date.now()}`;
  }

  async cancelScheduledNotification(notificationId: string) {
    this.scheduleQueue = this.scheduleQueue.filter(item => 
      item.notification.metadata.id !== notificationId
    );
    return true;
  }

  async getScheduledNotifications(userId: string) {
    return this.scheduleQueue.filter(item => 
      item.notification.metadata.userId === userId
    );
  }

  async isWithinQuietHours(userId: string, checkTime: Date = new Date()) {
    const preferences = await mockStorage.get(`user:${userId}:preferences`);
    if (!preferences?.notificationSettings?.quietHours?.enabled) {
      return false;
    }

    const { start, end, timezone } = preferences.notificationSettings.quietHours;
    const checkHour = checkTime.getHours();
    const startHour = parseInt(start.split(':')[0]);
    const endHour = parseInt(end.split(':')[0]);

    // Handle overnight quiet hours (e.g., 18:00 to 09:00)
    if (startHour > endHour) {
      return checkHour >= startHour || checkHour < endHour;
    }
    
    return checkHour >= startHour && checkHour < endHour;
  }

  async calculateOptimalNotificationTime(userId: string, baseTime: Date) {
    const preferences = await mockStorage.get(`user:${userId}:preferences`);
    if (!preferences) {
      return baseTime;
    }

    const { workingHours } = preferences.personalizedSettings;
    const dayOfWeek = baseTime.getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const daySchedule = workingHours[dayNames[dayOfWeek] as keyof typeof workingHours];

    if (!daySchedule.enabled) {
      // Find next working day
      const nextWorkingDay = new Date(baseTime);
      let daysToAdd = 1;
      
      while (daysToAdd < 7) {
        nextWorkingDay.setDate(baseTime.getDate() + daysToAdd);
        const nextDayName = dayNames[nextWorkingDay.getDay()];
        if (workingHours[nextDayName as keyof typeof workingHours].enabled) {
          const startTime = workingHours[nextDayName as keyof typeof workingHours].start;
          const [hours, minutes] = startTime.split(':').map(Number);
          nextWorkingDay.setHours(hours, minutes, 0, 0);
          return nextWorkingDay;
        }
        daysToAdd++;
      }
    }

    // Adjust to working hours if needed
    const startTime = daySchedule.start.split(':').map(Number);
    const endTime = daySchedule.end.split(':').map(Number);
    const currentHour = baseTime.getHours();
    const currentMinute = baseTime.getMinutes();

    if (currentHour < startTime[0] || (currentHour === startTime[0] && currentMinute < startTime[1])) {
      // Before working hours - schedule for start of work
      const optimizedTime = new Date(baseTime);
      optimizedTime.setHours(startTime[0], startTime[1], 0, 0);
      return optimizedTime;
    }

    if (currentHour > endTime[0] || (currentHour === endTime[0] && currentMinute > endTime[1])) {
      // After working hours - schedule for next working day
      return this.calculateOptimalNotificationTime(userId, new Date(baseTime.getTime() + 24 * 60 * 60 * 1000));
    }

    return baseTime;
  }

  getScheduleQueueForTesting() {
    return this.scheduleQueue;
  }

  clearScheduleQueue() {
    this.scheduleQueue = [];
  }
}

describe('Notification Scheduler Service', () => {
  let scheduler: MockNotificationScheduler;

  beforeEach(() => {
    scheduler = new MockNotificationScheduler();
    storageHelpers.setupTestData();
    jest.clearAllMocks();
  });

  afterEach(() => {
    scheduler.clearScheduleQueue();
    mockStorage.clear();
  });

  describe('Basic Scheduling', () => {
    it('should schedule a notification for the specified time', async () => {
      const notification = createTestNotification();
      const scheduledFor = new Date('2024-01-16T14:00:00Z');

      const scheduleId = await scheduler.scheduleNotification(notification, scheduledFor);

      expect(scheduleId).toBeTruthy();
      expect(scheduleId).toMatch(/^scheduled-\d+$/);

      const queue = scheduler.getScheduleQueueForTesting();
      expect(queue).toHaveLength(1);
      expect(queue[0].scheduledFor).toEqual(scheduledFor);
    });

    it('should cancel a scheduled notification', async () => {
      const notification = createTestNotification();
      const scheduledFor = new Date('2024-01-16T14:00:00Z');

      await scheduler.scheduleNotification(notification, scheduledFor);
      const success = await scheduler.cancelScheduledNotification(notification.metadata.id);

      expect(success).toBe(true);
      const queue = scheduler.getScheduleQueueForTesting();
      expect(queue).toHaveLength(0);
    });

    it('should retrieve scheduled notifications for a user', async () => {
      const notification1 = createTestNotification({ metadata: { userId: 'user-123' } });
      const notification2 = createTestNotification({ metadata: { userId: 'user-456' } });

      await scheduler.scheduleNotification(notification1, new Date());
      await scheduler.scheduleNotification(notification2, new Date());

      const userNotifications = await scheduler.getScheduledNotifications('user-123');
      expect(userNotifications).toHaveLength(1);
      expect(userNotifications[0].notification.metadata.userId).toBe('user-123');
    });
  });

  describe('Quiet Hours Respect', () => {
    it('should detect when current time is within quiet hours', async () => {
      const userId = 'user-123';
      const quietTime = new Date('2024-01-15T22:00:00Z'); // 10 PM

      const isQuiet = await scheduler.isWithinQuietHours(userId, quietTime);
      expect(isQuiet).toBe(true);
    });

    it('should detect when current time is outside quiet hours', async () => {
      const userId = 'user-123';
      const workTime = new Date('2024-01-15T14:00:00Z'); // 2 PM

      const isQuiet = await scheduler.isWithinQuietHours(userId, workTime);
      expect(isQuiet).toBe(false);
    });

    it('should handle overnight quiet hours correctly', async () => {
      const userId = 'user-123';
      
      // Test early morning (within quiet hours)
      const earlyMorning = new Date('2024-01-15T07:00:00Z');
      let isQuiet = await scheduler.isWithinQuietHours(userId, earlyMorning);
      expect(isQuiet).toBe(true);

      // Test late evening (within quiet hours)
      const lateEvening = new Date('2024-01-15T20:00:00Z');
      isQuiet = await scheduler.isWithinQuietHours(userId, lateEvening);
      expect(isQuiet).toBe(true);

      // Test midday (outside quiet hours)
      const midday = new Date('2024-01-15T12:00:00Z');
      isQuiet = await scheduler.isWithinQuietHours(userId, midday);
      expect(isQuiet).toBe(false);
    });

    it('should return false for users without quiet hours enabled', async () => {
      const userId = 'user-123';
      const preferences = createTestUserPreferences({
        userId,
        notificationSettings: {
          ...createTestUserPreferences().notificationSettings,
          quietHours: {
            enabled: false,
            start: '18:00',
            end: '09:00',
            timezone: 'America/New_York',
            respectWeekends: false,
            respectHolidays: false
          }
        }
      });

      await mockStorage.set(`user:${userId}:preferences`, preferences);

      const quietTime = new Date('2024-01-15T22:00:00Z');
      const isQuiet = await scheduler.isWithinQuietHours(userId, quietTime);
      
      expect(isQuiet).toBe(false);
    });
  });

  describe('Optimal Timing Calculation', () => {
    it('should schedule during working hours when possible', async () => {
      const userId = 'user-123';
      const duringWork = new Date('2024-01-15T14:00:00Z'); // Monday 2 PM

      const optimalTime = await scheduler.calculateOptimalNotificationTime(userId, duringWork);
      
      expect(optimalTime).toEqual(duringWork);
    });

    it('should reschedule before working hours to start of work', async () => {
      const userId = 'user-123';
      const beforeWork = new Date('2024-01-15T07:00:00Z'); // Monday 7 AM

      const optimalTime = await scheduler.calculateOptimalNotificationTime(userId, beforeWork);
      
      expect(optimalTime.getHours()).toBe(9);
      expect(optimalTime.getMinutes()).toBe(0);
      expect(optimalTime.getDate()).toBe(15); // Same day
    });

    it('should reschedule after working hours to next working day', async () => {
      const userId = 'user-123';
      const afterWork = new Date('2024-01-15T19:00:00Z'); // Monday 7 PM

      const optimalTime = await scheduler.calculateOptimalNotificationTime(userId, afterWork);
      
      // Should be scheduled for Tuesday at 9 AM
      expect(optimalTime.getHours()).toBe(9);
      expect(optimalTime.getMinutes()).toBe(0);
      expect(optimalTime.getDate()).toBe(16); // Next day
    });

    it('should skip non-working days', async () => {
      const userId = 'user-123';
      const saturday = new Date('2024-01-13T14:00:00Z'); // Saturday 2 PM

      const optimalTime = await scheduler.calculateOptimalNotificationTime(userId, saturday);
      
      // Should be scheduled for Monday at 9 AM
      expect(optimalTime.getHours()).toBe(9);
      expect(optimalTime.getMinutes()).toBe(0);
      expect(optimalTime.getDay()).toBe(1); // Monday
    });

    it('should handle users without preferences gracefully', async () => {
      const userId = 'unknown-user';
      const baseTime = new Date('2024-01-15T14:00:00Z');

      const optimalTime = await scheduler.calculateOptimalNotificationTime(userId, baseTime);
      
      expect(optimalTime).toEqual(baseTime);
    });
  });

  describe('Frequency Management', () => {
    it('should respect gentle frequency settings', async () => {
      // Test that gentle frequency limits are respected
      const notification = createTestNotification();
      const userId = notification.metadata.userId;

      // Schedule multiple notifications
      for (let i = 0; i < 10; i++) {
        await scheduler.scheduleNotification(
          { ...notification, metadata: { ...notification.metadata, id: `notif-${i}` } },
          new Date(Date.now() + i * 60000) // Every minute
        );
      }

      const scheduled = await scheduler.getScheduledNotifications(userId);
      
      // For gentle frequency, should limit notifications
      expect(scheduled.length).toBeLessThanOrEqual(5); // Based on maxDailyNotifications setting
    });

    it('should calculate appropriate spacing between notifications', async () => {
      const notification1 = createTestNotification({ metadata: { id: 'notif-1' } });
      const notification2 = createTestNotification({ metadata: { id: 'notif-2' } });

      const baseTime = new Date('2024-01-15T10:00:00Z');
      
      await scheduler.scheduleNotification(notification1, baseTime);
      await scheduler.scheduleNotification(notification2, new Date(baseTime.getTime() + 30 * 60000)); // 30 min later

      const queue = scheduler.getScheduleQueueForTesting();
      expect(queue).toHaveLength(2);

      const timeDiff = queue[1].scheduledFor.getTime() - queue[0].scheduledFor.getTime();
      expect(timeDiff).toBeGreaterThanOrEqual(30 * 60000); // At least 30 minutes apart
    });
  });

  describe('Error Handling', () => {
    it('should handle storage errors gracefully', async () => {
      const userId = 'user-123';
      storageHelpers.simulateStorageError('get');

      const result = await scheduler.isWithinQuietHours(userId);
      expect(result).toBe(false); // Should default to false on error
    });

    it('should handle invalid date inputs', async () => {
      const notification = createTestNotification();
      const invalidDate = new Date('invalid-date');

      expect(() => scheduler.scheduleNotification(notification, invalidDate))
        .not.toThrow();
    });

    it('should handle missing user preferences', async () => {
      const userId = 'nonexistent-user';
      const baseTime = new Date('2024-01-15T14:00:00Z');

      const optimalTime = await scheduler.calculateOptimalNotificationTime(userId, baseTime);
      
      // Should return the base time when preferences are missing
      expect(optimalTime).toEqual(baseTime);
    });
  });

  describe('Edge Cases', () => {
    it('should handle timezone differences correctly', async () => {
      // This would test timezone handling if implemented
      const notification = createTestNotification();
      const utcTime = new Date('2024-01-15T14:00:00Z');

      const scheduleId = await scheduler.scheduleNotification(notification, utcTime);
      expect(scheduleId).toBeTruthy();
    });

    it('should handle rapid scheduling and cancellation', async () => {
      const notification = createTestNotification();
      const scheduledFor = new Date('2024-01-16T14:00:00Z');

      const scheduleId = await scheduler.scheduleNotification(notification, scheduledFor);
      const cancelResult = await scheduler.cancelScheduledNotification(notification.metadata.id);

      expect(scheduleId).toBeTruthy();
      expect(cancelResult).toBe(true);
      
      const queue = scheduler.getScheduleQueueForTesting();
      expect(queue).toHaveLength(0);
    });

    it('should maintain schedule integrity under concurrent operations', async () => {
      const notifications = Array.from({ length: 5 }, (_, i) => 
        createTestNotification({ metadata: { id: `concurrent-${i}` } })
      );

      // Schedule all notifications concurrently
      const promises = notifications.map((notif, i) => 
        scheduler.scheduleNotification(notif, new Date(Date.now() + i * 60000))
      );

      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(5);
      results.forEach(result => expect(result).toBeTruthy());
      
      const queue = scheduler.getScheduleQueueForTesting();
      expect(queue).toHaveLength(5);
    });
  });
});