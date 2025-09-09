/**
 * StorageService - Forge storage integration for tracking notification history and user preferences
 * Handles persistent storage of user data, notification tracking, and analytics
 */

import { storage } from '@forge/storage';
import * as _ from 'lodash';

import {
  UserPreferences,
  NotificationHistory,
  UserAnalytics,
  TeamConfiguration,
  SchedulingMetrics,
  ForgeStorageKey,
  ServiceResponse,
  GentleNudgeError,
  NotificationMetadata,
  UserResponse,
  DeliveryMethod,
  NotificationFrequency,
  MessageTone,
  EncouragementStyle,
} from '../types';

interface StorageItem<T> {
  data: T;
  version: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

interface MigrationRule {
  fromVersion: string;
  toVersion: string;
  migrate: (data: any) => any;
}

interface StorageMetrics {
  totalKeys: number;
  totalSize: number;
  keysByType: Record<string, number>;
  sizeByType: Record<string, number>;
  oldestEntry: Date;
  newestEntry: Date;
}

export class StorageService {
  private readonly CURRENT_VERSION = '1.0.0';
  private readonly MAX_KEY_LENGTH = 255;
  private readonly CACHE_TTL_MINUTES = 30;

  private migrationRules: MigrationRule[] = [];
  private cache: Map<string, { data: any; expiresAt: Date }> = new Map();

  constructor() {
    this.initializeMigrationRules();
    this.startCacheCleanupJob();
  }

  /**
   * Stores or updates user preferences
   */
  async storeUserPreferences(
    preferences: UserPreferences
  ): Promise<ServiceResponse<void>> {
    try {
      const key = this.buildStorageKey(
        'user',
        preferences.userId,
        'preferences'
      );
      const storageItem = this.createStorageItem(preferences);

      await storage.set(key, storageItem);
      this.updateCache(key, storageItem);

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'USER_PREFERENCES_STORE_ERROR',
          message: 'Failed to store user preferences',
          details: error.message,
          timestamp: new Date(),
          userId: preferences.userId,
        },
      };
    }
  }

  /**
   * Retrieves user preferences with fallback defaults
   */
  async getUserPreferences(
    userId: string
  ): Promise<ServiceResponse<UserPreferences>> {
    try {
      const key = this.buildStorageKey('user', userId, 'preferences');

      // Check cache first
      const cached = this.getFromCache(key);
      if (cached) {
        return { success: true, data: cached.data };
      }

      const storageItem = (await storage.get(
        key
      )) as StorageItem<UserPreferences> | null;

      if (!storageItem) {
        // Return default preferences
        const defaultPreferences = this.createDefaultUserPreferences(userId);
        return { success: true, data: defaultPreferences };
      }

      // Migrate if needed
      const migrated = await this.migrateIfNeeded(storageItem);
      this.updateCache(key, migrated);

      return { success: true, data: migrated.data };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'USER_PREFERENCES_RETRIEVE_ERROR',
          message: 'Failed to retrieve user preferences',
          details: error.message,
          timestamp: new Date(),
          userId,
        },
      };
    }
  }

  /**
   * Records notification delivery and tracking data
   */
  async recordNotification(
    issueKey: string,
    notification: NotificationMetadata
  ): Promise<ServiceResponse<void>> {
    try {
      const key = this.buildStorageKey('notification', issueKey, 'history');

      // Get existing history or create new
      let historyItem = (await storage.get(
        key
      )) as StorageItem<NotificationHistory> | null;

      if (!historyItem) {
        const newHistory: NotificationHistory = {
          issueKey,
          notifications: [notification],
          lastNudgeDate: notification.createdAt,
          totalNudgeCount: 1,
          effectivenessScore: 0,
          userResponsePattern: [],
        };
        historyItem = this.createStorageItem(newHistory);
      } else {
        // Update existing history
        historyItem.data.notifications.push(notification);
        historyItem.data.lastNudgeDate = notification.createdAt;
        historyItem.data.totalNudgeCount++;
        historyItem.updatedAt = new Date();
      }

      await storage.set(key, historyItem);
      this.updateCache(key, historyItem);

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'NOTIFICATION_RECORD_ERROR',
          message: 'Failed to record notification',
          details: error.message,
          timestamp: new Date(),
          issueKey,
        },
      };
    }
  }

  /**
   * Records user response to a notification
   */
  async recordUserResponse(
    issueKey: string,
    notificationId: string,
    response: UserResponse,
    responseTime?: Date
  ): Promise<ServiceResponse<void>> {
    try {
      const key = this.buildStorageKey('notification', issueKey, 'history');
      const historyItem = (await storage.get(
        key
      )) as StorageItem<NotificationHistory> | null;

      if (!historyItem) {
        return {
          success: false,
          error: {
            code: 'NOTIFICATION_HISTORY_NOT_FOUND',
            message: 'Notification history not found',
            timestamp: new Date(),
            issueKey,
          },
        };
      }

      // Update the specific notification
      const notification = historyItem.data.notifications.find(
        n => n.id === notificationId
      );
      if (notification) {
        switch (response) {
          case 'acknowledged':
            notification.acknowledgedAt = responseTime || new Date();
            break;
          case 'dismissed':
            notification.dismissedAt = responseTime || new Date();
            break;
        }
      }

      // Add to response pattern
      historyItem.data.userResponsePattern.push(response);

      // Recalculate effectiveness score
      const positiveResponses = historyItem.data.userResponsePattern.filter(
        r => r === 'acknowledged' || r === 'actioned'
      ).length;
      historyItem.data.effectivenessScore =
        positiveResponses / historyItem.data.userResponsePattern.length;

      historyItem.updatedAt = new Date();

      await storage.set(key, historyItem);
      this.updateCache(key, historyItem);

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'USER_RESPONSE_RECORD_ERROR',
          message: 'Failed to record user response',
          details: error.message,
          timestamp: new Date(),
          issueKey,
        },
      };
    }
  }

  /**
   * Gets notification history for an issue
   */
  async getNotificationHistory(
    issueKey: string
  ): Promise<ServiceResponse<NotificationHistory | null>> {
    try {
      const key = this.buildStorageKey('notification', issueKey, 'history');

      // Check cache first
      const cached = this.getFromCache(key);
      if (cached) {
        return { success: true, data: cached.data };
      }

      const historyItem = (await storage.get(
        key
      )) as StorageItem<NotificationHistory> | null;

      if (!historyItem) {
        return { success: true, data: null };
      }

      const migrated = await this.migrateIfNeeded(historyItem);
      this.updateCache(key, migrated);

      return { success: true, data: migrated.data };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'NOTIFICATION_HISTORY_RETRIEVE_ERROR',
          message: 'Failed to retrieve notification history',
          details: error.message,
          timestamp: new Date(),
          issueKey,
        },
      };
    }
  }

  /**
   * Stores user analytics data
   */
  async storeUserAnalytics(
    analytics: UserAnalytics
  ): Promise<ServiceResponse<void>> {
    try {
      const key = this.buildStorageKey('analytics', analytics.userId, 'data');
      const storageItem = this.createStorageItem(analytics);

      await storage.set(key, storageItem);
      this.updateCache(key, storageItem);

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'USER_ANALYTICS_STORE_ERROR',
          message: 'Failed to store user analytics',
          details: error.message,
          timestamp: new Date(),
          userId: analytics.userId,
        },
      };
    }
  }

  /**
   * Retrieves user analytics data
   */
  async getUserAnalytics(
    userId: string
  ): Promise<ServiceResponse<UserAnalytics | null>> {
    try {
      const key = this.buildStorageKey('analytics', userId, 'data');

      const cached = this.getFromCache(key);
      if (cached) {
        return { success: true, data: cached.data };
      }

      const storageItem = (await storage.get(
        key
      )) as StorageItem<UserAnalytics> | null;

      if (!storageItem) {
        return { success: true, data: null };
      }

      const migrated = await this.migrateIfNeeded(storageItem);
      this.updateCache(key, migrated);

      return { success: true, data: migrated.data };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'USER_ANALYTICS_RETRIEVE_ERROR',
          message: 'Failed to retrieve user analytics',
          details: error.message,
          timestamp: new Date(),
          userId,
        },
      };
    }
  }

  /**
   * Stores team configuration
   */
  async storeTeamConfiguration(
    config: TeamConfiguration
  ): Promise<ServiceResponse<void>> {
    try {
      const key = this.buildStorageKey('team', config.projectKey, 'config');
      const storageItem = this.createStorageItem(config);

      await storage.set(key, storageItem);
      this.updateCache(key, storageItem);

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'TEAM_CONFIG_STORE_ERROR',
          message: 'Failed to store team configuration',
          details: error.message,
          timestamp: new Date(),
        },
      };
    }
  }

  /**
   * Retrieves team configuration
   */
  async getTeamConfiguration(
    projectKey: string
  ): Promise<ServiceResponse<TeamConfiguration | null>> {
    try {
      const key = this.buildStorageKey('team', projectKey, 'config');

      const cached = this.getFromCache(key);
      if (cached) {
        return { success: true, data: cached.data };
      }

      const storageItem = (await storage.get(
        key
      )) as StorageItem<TeamConfiguration> | null;

      if (!storageItem) {
        return { success: true, data: null };
      }

      const migrated = await this.migrateIfNeeded(storageItem);
      this.updateCache(key, migrated);

      return { success: true, data: migrated.data };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'TEAM_CONFIG_RETRIEVE_ERROR',
          message: 'Failed to retrieve team configuration',
          details: error.message,
          timestamp: new Date(),
        },
      };
    }
  }

  /**
   * Bulk retrieval of notification histories for analytics
   */
  async getBulkNotificationHistories(
    issueKeys: string[]
  ): Promise<ServiceResponse<Map<string, NotificationHistory>>> {
    try {
      const results = new Map<string, NotificationHistory>();

      // Process in batches to avoid overwhelming storage
      const batchSize = 10;
      for (let i = 0; i < issueKeys.length; i += batchSize) {
        const batch = issueKeys.slice(i, i + batchSize);

        await Promise.all(
          batch.map(async issueKey => {
            const historyResult = await this.getNotificationHistory(issueKey);
            if (historyResult.success && historyResult.data) {
              results.set(issueKey, historyResult.data);
            }
          })
        );
      }

      return { success: true, data: results };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'BULK_NOTIFICATION_RETRIEVE_ERROR',
          message: 'Failed to retrieve bulk notification histories',
          details: error.message,
          timestamp: new Date(),
        },
      };
    }
  }

  /**
   * Cleans up old data based on retention policies
   */
  async cleanupOldData(
    retentionDays: number = 90
  ): Promise<ServiceResponse<number>> {
    try {
      const deletedCount = 0;
      const cutoffDate = new Date(
        Date.now() - retentionDays * 24 * 60 * 60 * 1000
      );

      // This would require a way to list all keys in Forge storage
      // For now, this is a placeholder implementation

      return { success: true, data: deletedCount };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'CLEANUP_ERROR',
          message: 'Failed to cleanup old data',
          details: error.message,
          timestamp: new Date(),
        },
      };
    }
  }

  /**
   * Gets storage metrics for monitoring
   */
  async getStorageMetrics(): Promise<ServiceResponse<StorageMetrics>> {
    try {
      // In a real implementation, this would calculate actual storage metrics
      // For now, return placeholder data
      const metrics: StorageMetrics = {
        totalKeys: 0,
        totalSize: 0,
        keysByType: {},
        sizeByType: {},
        oldestEntry: new Date(),
        newestEntry: new Date(),
      };

      return { success: true, data: metrics };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'STORAGE_METRICS_ERROR',
          message: 'Failed to get storage metrics',
          details: error.message,
          timestamp: new Date(),
        },
      };
    }
  }

  /**
   * Exports user data for GDPR compliance
   */
  async exportUserData(userId: string): Promise<ServiceResponse<any>> {
    try {
      const userData: any = {};

      // Get user preferences
      const preferencesResult = await this.getUserPreferences(userId);
      if (preferencesResult.success && preferencesResult.data) {
        userData.preferences = preferencesResult.data;
      }

      // Get user analytics
      const analyticsResult = await this.getUserAnalytics(userId);
      if (analyticsResult.success && analyticsResult.data) {
        userData.analytics = analyticsResult.data;
      }

      // Get notification histories for issues assigned to user
      // This would require a way to query by user in a real implementation

      userData.exportDate = new Date();
      userData.version = this.CURRENT_VERSION;

      return { success: true, data: userData };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'USER_DATA_EXPORT_ERROR',
          message: 'Failed to export user data',
          details: error.message,
          timestamp: new Date(),
          userId,
        },
      };
    }
  }

  /**
   * Deletes all user data for GDPR compliance
   */
  async deleteUserData(userId: string): Promise<ServiceResponse<number>> {
    try {
      let deletedCount = 0;

      // Delete user preferences
      const preferencesKey = this.buildStorageKey(
        'user',
        userId,
        'preferences'
      );
      await storage.delete(preferencesKey);
      this.cache.delete(preferencesKey);
      deletedCount++;

      // Delete user analytics
      const analyticsKey = this.buildStorageKey('analytics', userId, 'data');
      await storage.delete(analyticsKey);
      this.cache.delete(analyticsKey);
      deletedCount++;

      // Note: In a real implementation, we would need to handle
      // notification histories that reference this user

      return { success: true, data: deletedCount };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'USER_DATA_DELETE_ERROR',
          message: 'Failed to delete user data',
          details: error.message,
          timestamp: new Date(),
          userId,
        },
      };
    }
  }

  private buildStorageKey(
    prefix: string,
    identifier: string,
    suffix?: string
  ): string {
    const parts = [prefix, identifier];
    if (suffix) parts.push(suffix);

    const key = parts.join(':');

    if (key.length > this.MAX_KEY_LENGTH) {
      // Hash long keys to fit within limits
      const hash = this.simpleHash(key);
      return `${prefix}:${hash}`;
    }

    return key;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private createStorageItem<T>(data: T, expiresAt?: Date): StorageItem<T> {
    return {
      data,
      version: this.CURRENT_VERSION,
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt,
    };
  }

  private async migrateIfNeeded<T>(
    item: StorageItem<T>
  ): Promise<StorageItem<T>> {
    if (item.version === this.CURRENT_VERSION) {
      return item;
    }

    let migratedData = item.data;
    let currentVersion = item.version;

    // Apply migration rules sequentially
    for (const rule of this.migrationRules) {
      if (rule.fromVersion === currentVersion) {
        migratedData = rule.migrate(migratedData);
        currentVersion = rule.toVersion;
      }
    }

    return {
      ...item,
      data: migratedData,
      version: currentVersion,
      updatedAt: new Date(),
    };
  }

  private createDefaultUserPreferences(userId: string): UserPreferences {
    return {
      userId,
      displayName: '',
      email: '',
      notificationSettings: {
        frequency: 'gentle',
        enabledTypes: [
          'stale-reminder',
          'deadline-warning',
          'achievement-recognition',
        ],
        quietHours: {
          enabled: true,
          start: '18:00',
          end: '09:00',
          timezone: 'UTC',
          respectWeekends: true,
          respectHolidays: true,
        },
        staleDaysThreshold: 3,
        deadlineWarningDays: 2,
        maxDailyNotifications: 5,
        preferredDeliveryMethods: ['in-app', 'banner'],
      },
      personalizedSettings: {
        preferredTone: 'encouraging',
        encouragementStyle: 'supportive',
        motivationalKeywords: ['great', 'excellent', 'awesome'],
        timeZone: 'UTC',
        workingHours: {
          monday: { enabled: true, start: '09:00', end: '17:00' },
          tuesday: { enabled: true, start: '09:00', end: '17:00' },
          wednesday: { enabled: true, start: '09:00', end: '17:00' },
          thursday: { enabled: true, start: '09:00', end: '17:00' },
          friday: { enabled: true, start: '09:00', end: '17:00' },
          saturday: { enabled: false, start: '09:00', end: '17:00' },
          sunday: { enabled: false, start: '09:00', end: '17:00' },
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private updateCache<T>(key: string, item: StorageItem<T>): void {
    const expiresAt = new Date(Date.now() + this.CACHE_TTL_MINUTES * 60 * 1000);
    this.cache.set(key, { data: item.data, expiresAt });
  }

  private getFromCache(key: string): { data: any } | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (cached.expiresAt < new Date()) {
      this.cache.delete(key);
      return null;
    }

    return { data: cached.data };
  }

  private initializeMigrationRules(): void {
    // Example migration from v0.1.0 to v1.0.0
    this.migrationRules.push({
      fromVersion: '0.1.0',
      toVersion: '1.0.0',
      migrate: (data: any) => {
        // Example: rename a field
        if (data.oldFieldName) {
          data.newFieldName = data.oldFieldName;
          delete data.oldFieldName;
        }
        return data;
      },
    });
  }

  private startCacheCleanupJob(): void {
    // Clean up expired cache entries every 10 minutes
    setInterval(
      () => {
        const now = new Date();
        for (const [key, item] of this.cache.entries()) {
          if (item.expiresAt < now) {
            this.cache.delete(key);
          }
        }
      },
      10 * 60 * 1000
    );
  }
}
