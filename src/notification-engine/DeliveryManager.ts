/**
 * DeliveryManager - Routes notifications to appropriate UI components
 * Handles multiple delivery methods with fallback and retry logic
 */

import * as _ from 'lodash';
import { addMinutes } from 'date-fns';

import {
  Notification,
  NotificationResult,
  DeliveryMethod,
  UserPreferences,
  ServiceResponse,
  GentleNudgeError,
  ScheduledNotification,
  NotificationHistory,
  UserResponse,
  NOTIFICATION_CONSTANTS,
} from '../types';

interface DeliveryChannel {
  method: DeliveryMethod;
  priority: number;
  maxRetries: number;
  retryDelayMinutes: number;
  isAvailable: () => Promise<boolean>;
  deliver: (
    notification: Notification,
    userPreferences: UserPreferences
  ) => Promise<DeliveryResult>;
  validate: (
    notification: Notification,
    userPreferences: UserPreferences
  ) => Promise<boolean>;
}

interface DeliveryResult {
  success: boolean;
  deliveryId: string;
  timestamp: Date;
  error?: string;
  metadata?: Record<string, any>;
}

interface DeliveryAttempt {
  notificationId: string;
  method: DeliveryMethod;
  attemptNumber: number;
  scheduledFor: Date;
  result?: DeliveryResult;
  error?: string;
}

interface DeliveryQueue {
  userId: string;
  attempts: DeliveryAttempt[];
  processing: boolean;
  lastProcessed: Date;
  errorCount: number;
  successCount: number;
}

interface BatchDeliveryGroup {
  userId: string;
  notifications: Notification[];
  scheduledFor: Date;
  batchKey: string;
  deliveryMethod: DeliveryMethod;
}

export class DeliveryManager {
  private deliveryChannels: Map<DeliveryMethod, DeliveryChannel> = new Map();
  private deliveryQueues: Map<string, DeliveryQueue> = new Map();
  private deliveryHistory: Map<string, NotificationHistory> = new Map();
  private batchGroups: Map<string, BatchDeliveryGroup> = new Map();
  private retryIntervals: number[] = [5, 15, 30, 60]; // minutes

  constructor() {
    this.initializeDeliveryChannels();
  }

  /**
   * Delivers a single notification using the best available method
   */
  async deliverNotification(
    notification: Notification,
    userPreferences: UserPreferences
  ): Promise<ServiceResponse<NotificationResult>> {
    try {
      const deliveryMethods = this.selectDeliveryMethods(
        userPreferences,
        notification
      );
      let lastError: string = '';

      for (const method of deliveryMethods) {
        const channel = this.deliveryChannels.get(method);
        if (!channel) continue;

        try {
          // Check if channel is available
          if (!(await channel.isAvailable())) {
            lastError = `${method} channel is not available`;
            continue;
          }

          // Validate notification for this channel
          if (!(await channel.validate(notification, userPreferences))) {
            lastError = `Notification validation failed for ${method}`;
            continue;
          }

          // Attempt delivery
          const deliveryResult = await channel.deliver(
            notification,
            userPreferences
          );

          if (deliveryResult.success) {
            await this.recordSuccessfulDelivery(
              notification,
              method,
              deliveryResult
            );

            return {
              success: true,
              data: {
                success: true,
                notificationId: notification.metadata.id,
                deliveryMethod: method,
                retryCount: 0,
              },
            };
          } else {
            lastError = deliveryResult.error || `${method} delivery failed`;
          }
        } catch (error: any) {
          lastError = `${method} delivery error: ${error.message}`;
          continue;
        }
      }

      // All delivery methods failed, queue for retry
      await this.queueForRetry(notification, userPreferences, lastError);

      return {
        success: false,
        error: {
          code: 'DELIVERY_FAILED',
          message: 'All delivery methods failed',
          details: lastError,
          timestamp: new Date(),
          userId: notification.metadata.userId,
          issueKey: notification.metadata.issueKey,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'DELIVERY_ERROR',
          message: 'Failed to deliver notification',
          details: error.message,
          timestamp: new Date(),
          userId: notification.metadata.userId,
          issueKey: notification.metadata.issueKey,
        },
      };
    }
  }

  /**
   * Delivers multiple notifications as a batch
   */
  async deliverBatch(
    notifications: Notification[],
    userPreferences: UserPreferences,
    batchKey: string
  ): Promise<ServiceResponse<NotificationResult[]>> {
    try {
      const results: NotificationResult[] = [];

      // Check if batch delivery is supported
      if (
        userPreferences.notificationSettings.preferredDeliveryMethods.includes(
          'in-app'
        )
      ) {
        const batchResult = await this.deliverInAppBatch(
          notifications,
          userPreferences,
          batchKey
        );
        return {
          success: true,
          data: batchResult.data || [],
        };
      }

      // Fall back to individual delivery
      for (const notification of notifications) {
        const result = await this.deliverNotification(
          notification,
          userPreferences
        );
        if (result.data) {
          results.push(result.data);
        }
      }

      return {
        success: true,
        data: results,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'BATCH_DELIVERY_ERROR',
          message: 'Failed to deliver notification batch',
          details: error.message,
          timestamp: new Date(),
        },
      };
    }
  }

  /**
   * Processes pending delivery attempts with retry logic
   */
  async processDeliveryQueue(userId: string): Promise<ServiceResponse<number>> {
    try {
      const queue = this.deliveryQueues.get(userId);
      if (!queue || queue.processing) {
        return { success: true, data: 0 };
      }

      queue.processing = true;
      let processedCount = 0;

      try {
        const now = new Date();
        const pendingAttempts = queue.attempts.filter(
          attempt => !attempt.result && attempt.scheduledFor <= now
        );

        for (const attempt of pendingAttempts) {
          try {
            await this.processDeliveryAttempt(attempt);
            processedCount++;
          } catch (error: any) {
            attempt.error = error.message;
            queue.errorCount++;
          }
        }

        queue.lastProcessed = now;
        return { success: true, data: processedCount };
      } finally {
        queue.processing = false;
      }
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'QUEUE_PROCESSING_ERROR',
          message: 'Failed to process delivery queue',
          details: error.message,
          timestamp: new Date(),
          userId,
        },
      };
    }
  }

  /**
   * Records user response to a delivered notification
   */
  async recordUserResponse(
    notificationId: string,
    response: UserResponse,
    timestamp: Date = new Date()
  ): Promise<ServiceResponse<void>> {
    try {
      // Find the notification in delivery history
      for (const [issueKey, history] of this.deliveryHistory.entries()) {
        const notification = history.notifications.find(
          n => n.id === notificationId
        );
        if (notification) {
          // Update notification metadata
          switch (response) {
            case 'acknowledged':
              notification.acknowledgedAt = timestamp;
              break;
            case 'dismissed':
              notification.dismissedAt = timestamp;
              break;
            case 'actioned':
              notification.acknowledgedAt = timestamp;
              // Additional tracking would be added here
              break;
            case 'snoozed':
              // Reschedule notification
              await this.rescheduleNotification(
                notificationId,
                addMinutes(timestamp, 60)
              );
              break;
          }

          // Update effectiveness metrics
          await this.updateEffectivenessMetrics(
            issueKey,
            history,
            response,
            timestamp
          );

          return { success: true };
        }
      }

      return {
        success: false,
        error: {
          code: 'NOTIFICATION_NOT_FOUND',
          message: 'Notification not found in delivery history',
          timestamp: new Date(),
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'RESPONSE_RECORDING_ERROR',
          message: 'Failed to record user response',
          details: error.message,
          timestamp: new Date(),
        },
      };
    }
  }

  /**
   * Gets delivery statistics for analytics
   */
  async getDeliveryStatistics(
    userId: string,
    days: number = 30
  ): Promise<ServiceResponse<any>> {
    try {
      const queue = this.deliveryQueues.get(userId);
      if (!queue) {
        return {
          success: true,
          data: {
            totalAttempts: 0,
            successfulDeliveries: 0,
            failedDeliveries: 0,
            averageRetries: 0,
            preferredMethods: [],
          },
        };
      }

      const cutoffDate = addMinutes(new Date(), -days * 24 * 60);
      const recentAttempts = queue.attempts.filter(
        attempt => attempt.scheduledFor >= cutoffDate
      );

      const successful = recentAttempts.filter(
        attempt => attempt.result?.success
      );
      const failed = recentAttempts.filter(
        attempt => attempt.result && !attempt.result.success
      );

      const methodCounts = _.countBy(successful, 'method');
      const preferredMethods = Object.entries(methodCounts)
        .sort(([, a], [, b]) => b - a)
        .map(([method]) => method);

      const totalRetries = recentAttempts.reduce(
        (sum, attempt) => sum + attempt.attemptNumber - 1,
        0
      );
      const averageRetries =
        recentAttempts.length > 0 ? totalRetries / recentAttempts.length : 0;

      return {
        success: true,
        data: {
          totalAttempts: recentAttempts.length,
          successfulDeliveries: successful.length,
          failedDeliveries: failed.length,
          averageRetries,
          preferredMethods,
          successRate:
            recentAttempts.length > 0
              ? successful.length / recentAttempts.length
              : 0,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'STATISTICS_ERROR',
          message: 'Failed to get delivery statistics',
          details: error.message,
          timestamp: new Date(),
          userId,
        },
      };
    }
  }

  private initializeDeliveryChannels(): void {
    // In-App Notification Channel
    this.deliveryChannels.set('in-app', {
      method: 'in-app',
      priority: 1,
      maxRetries: 3,
      retryDelayMinutes: 5,
      isAvailable: async () => true, // Always available for in-app
      deliver: this.deliverInApp.bind(this),
      validate: async (notification, userPreferences) => true,
    });

    // Banner Notification Channel
    this.deliveryChannels.set('banner', {
      method: 'banner',
      priority: 2,
      maxRetries: 2,
      retryDelayMinutes: 10,
      isAvailable: async () => true,
      deliver: this.deliverBanner.bind(this),
      validate: async (notification, userPreferences) => {
        // Only for high priority notifications
        return (
          notification.metadata.priority === 'high' ||
          notification.metadata.priority === 'urgent'
        );
      },
    });

    // Modal Notification Channel (for urgent items only)
    this.deliveryChannels.set('modal', {
      method: 'modal',
      priority: 3,
      maxRetries: 1,
      retryDelayMinutes: 30,
      isAvailable: async () => true,
      deliver: this.deliverModal.bind(this),
      validate: async (notification, userPreferences) => {
        // Only for urgent notifications
        return notification.metadata.priority === 'urgent';
      },
    });

    // Email Notification Channel
    this.deliveryChannels.set('email', {
      method: 'email',
      priority: 4,
      maxRetries: 2,
      retryDelayMinutes: 60,
      isAvailable: async () => {
        // Check if email service is available
        return true; // Simplified
      },
      deliver: this.deliverEmail.bind(this),
      validate: async (notification, userPreferences) => {
        return userPreferences.email ? true : false;
      },
    });

    // Webhook Notification Channel
    this.deliveryChannels.set('webhook', {
      method: 'webhook',
      priority: 5,
      maxRetries: 3,
      retryDelayMinutes: 15,
      isAvailable: async () => true,
      deliver: this.deliverWebhook.bind(this),
      validate: async (notification, userPreferences) => {
        // Check if user has webhook configured
        return true; // Would check user's webhook settings
      },
    });
  }

  private selectDeliveryMethods(
    userPreferences: UserPreferences,
    notification: Notification
  ): DeliveryMethod[] {
    const preferredMethods =
      userPreferences.notificationSettings.preferredDeliveryMethods;
    const priority = notification.metadata.priority;

    // Sort methods by user preference and priority appropriateness
    const sortedMethods = preferredMethods
      .map(method => ({
        method,
        channel: this.deliveryChannels.get(method),
        score: this.calculateMethodScore(method, priority, userPreferences),
      }))
      .filter(item => item.channel)
      .sort((a, b) => b.score - a.score)
      .map(item => item.method);

    return sortedMethods.length > 0 ? sortedMethods : ['in-app'];
  }

  private calculateMethodScore(
    method: DeliveryMethod,
    priority: string,
    userPreferences: UserPreferences
  ): number {
    let score = 0;

    // Base preference score
    const methodIndex =
      userPreferences.notificationSettings.preferredDeliveryMethods.indexOf(
        method
      );
    score += methodIndex >= 0 ? 10 - methodIndex : 0;

    // Priority appropriateness
    if (priority === 'urgent' && method === 'modal') score += 20;
    if (priority === 'high' && method === 'banner') score += 15;
    if (priority === 'medium' && method === 'in-app') score += 10;
    if (priority === 'low' && method === 'email') score += 5;

    return score;
  }

  private async deliverInApp(
    notification: Notification,
    userPreferences: UserPreferences
  ): Promise<DeliveryResult> {
    try {
      // In a real implementation, this would use Forge UI to display the notification
      // For now, simulate successful delivery

      return {
        success: true,
        deliveryId: `in-app-${Date.now()}`,
        timestamp: new Date(),
        metadata: {
          location: 'notification-panel',
          duration: 5000, // 5 seconds
        },
      };
    } catch (error: any) {
      return {
        success: false,
        deliveryId: '',
        timestamp: new Date(),
        error: error.message,
      };
    }
  }

  private async deliverBanner(
    notification: Notification,
    userPreferences: UserPreferences
  ): Promise<DeliveryResult> {
    try {
      // Banner notification implementation
      return {
        success: true,
        deliveryId: `banner-${Date.now()}`,
        timestamp: new Date(),
        metadata: {
          location: 'top-banner',
          duration: 10000, // 10 seconds
        },
      };
    } catch (error: any) {
      return {
        success: false,
        deliveryId: '',
        timestamp: new Date(),
        error: error.message,
      };
    }
  }

  private async deliverModal(
    notification: Notification,
    userPreferences: UserPreferences
  ): Promise<DeliveryResult> {
    try {
      // Modal notification for urgent items
      return {
        success: true,
        deliveryId: `modal-${Date.now()}`,
        timestamp: new Date(),
        metadata: {
          location: 'center-modal',
          dismissible: true,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        deliveryId: '',
        timestamp: new Date(),
        error: error.message,
      };
    }
  }

  private async deliverEmail(
    notification: Notification,
    userPreferences: UserPreferences
  ): Promise<DeliveryResult> {
    try {
      // Email delivery implementation
      return {
        success: true,
        deliveryId: `email-${Date.now()}`,
        timestamp: new Date(),
        metadata: {
          recipient: userPreferences.email,
          subject: notification.content.title,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        deliveryId: '',
        timestamp: new Date(),
        error: error.message,
      };
    }
  }

  private async deliverWebhook(
    notification: Notification,
    userPreferences: UserPreferences
  ): Promise<DeliveryResult> {
    try {
      // Webhook delivery implementation
      return {
        success: true,
        deliveryId: `webhook-${Date.now()}`,
        timestamp: new Date(),
        metadata: {
          endpoint: 'user-configured-webhook',
          method: 'POST',
        },
      };
    } catch (error: any) {
      return {
        success: false,
        deliveryId: '',
        timestamp: new Date(),
        error: error.message,
      };
    }
  }

  private async deliverInAppBatch(
    notifications: Notification[],
    userPreferences: UserPreferences,
    batchKey: string
  ): Promise<ServiceResponse<NotificationResult[]>> {
    try {
      const results: NotificationResult[] = [];

      // Group notifications by type for better presentation
      const groupedNotifications = _.groupBy(
        notifications,
        'metadata.context.type'
      );

      for (const [type, typeNotifications] of Object.entries(
        groupedNotifications
      )) {
        const batchResult = await this.createBatchNotification(
          typeNotifications,
          batchKey
        );

        for (const notification of typeNotifications) {
          results.push({
            success: true,
            notificationId: notification.metadata.id,
            deliveryMethod: 'in-app',
            retryCount: 0,
          });
        }
      }

      return { success: true, data: results };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'BATCH_DELIVERY_ERROR',
          message: 'Failed to deliver batch notifications',
          details: error.message,
          timestamp: new Date(),
        },
      };
    }
  }

  private async createBatchNotification(
    notifications: Notification[],
    batchKey: string
  ): Promise<void> {
    // Create a single notification that represents multiple items
    // This would be displayed as a summary notification in the UI
  }

  private async queueForRetry(
    notification: Notification,
    userPreferences: UserPreferences,
    error: string
  ): Promise<void> {
    const userId = notification.metadata.userId;

    if (!this.deliveryQueues.has(userId)) {
      this.deliveryQueues.set(userId, {
        userId,
        attempts: [],
        processing: false,
        lastProcessed: new Date(),
        errorCount: 0,
        successCount: 0,
      });
    }

    const queue = this.deliveryQueues.get(userId)!;
    const deliveryMethods = this.selectDeliveryMethods(
      userPreferences,
      notification
    );

    for (let i = 0; i < NOTIFICATION_CONSTANTS.MAX_RETRY_ATTEMPTS; i++) {
      const method = deliveryMethods[i % deliveryMethods.length];
      const retryDelay =
        this.retryIntervals[Math.min(i, this.retryIntervals.length - 1)];

      queue.attempts.push({
        notificationId: notification.metadata.id,
        method,
        attemptNumber: i + 1,
        scheduledFor: addMinutes(new Date(), retryDelay),
        error: i === 0 ? error : undefined,
      });
    }
  }

  private async processDeliveryAttempt(
    attempt: DeliveryAttempt
  ): Promise<void> {
    // This would retrieve the original notification and retry delivery
    // Simplified for this implementation
  }

  private async recordSuccessfulDelivery(
    notification: Notification,
    method: DeliveryMethod,
    result: DeliveryResult
  ): Promise<void> {
    const issueKey = notification.metadata.issueKey;

    if (!this.deliveryHistory.has(issueKey)) {
      this.deliveryHistory.set(issueKey, {
        issueKey,
        notifications: [],
        lastNudgeDate: new Date(),
        totalNudgeCount: 0,
        effectivenessScore: 0,
        userResponsePattern: [],
      });
    }

    const history = this.deliveryHistory.get(issueKey)!;
    notification.metadata.deliveredAt = result.timestamp;
    history.notifications.push(notification.metadata);
    history.lastNudgeDate = result.timestamp;
    history.totalNudgeCount++;
  }

  private async rescheduleNotification(
    notificationId: string,
    newTime: Date
  ): Promise<void> {
    // Implementation would reschedule the notification
  }

  private async updateEffectivenessMetrics(
    issueKey: string,
    history: NotificationHistory,
    response: UserResponse,
    timestamp: Date
  ): Promise<void> {
    // Update effectiveness scoring based on user response
    history.userResponsePattern.push(response);

    // Calculate effectiveness score (simplified)
    const positiveResponses = history.userResponsePattern.filter(
      r => r === 'acknowledged' || r === 'actioned'
    ).length;

    history.effectivenessScore =
      positiveResponses / history.userResponsePattern.length;
  }
}
