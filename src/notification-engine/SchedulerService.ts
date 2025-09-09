/**
 * SchedulerService - Handles timing and frequency of notifications
 * Implements intelligent scheduling that respects user preferences and workload
 */

import { addMinutes, isWithinInterval, parseISO, format, isWeekend } from 'date-fns';
import * as _ from 'lodash';

import {
  ScheduledNotification,
  SchedulingConfiguration,
  SchedulingDecision,
  NotificationQueue,
  QueuedNotification,
  SchedulingContext,
  UserWorkloadInfo,
  UserPreferences,
  ServiceResponse,
  NotificationType,
  NotificationPriority,
  GentleNudgeError,
  NOTIFICATION_CONSTANTS,
  TimeWindow,
  AdaptiveAdjustment,
  SchedulingMetrics
} from '../types';

export class SchedulerService {
  private config: SchedulingConfiguration;
  private userQueues: Map<string, NotificationQueue> = new Map();
  private schedulingMetrics: Map<string, SchedulingMetrics> = new Map();

  constructor(config?: Partial<SchedulingConfiguration>) {
    this.config = this.buildDefaultConfig(config);
  }

  /**
   * Determines if and when a notification should be scheduled
   */
  async shouldScheduleNotification(
    userId: string,
    issueKey: string,
    type: NotificationType,
    priority: NotificationPriority,
    userPreferences: UserPreferences,
    workloadInfo: UserWorkloadInfo,
    context?: any
  ): Promise<ServiceResponse<SchedulingDecision>> {
    try {
      const schedulingContext = await this.buildSchedulingContext(
        userId,
        userPreferences,
        workloadInfo
      );

      const decision = await this.makeSchedulingDecision(
        type,
        priority,
        schedulingContext,
        userPreferences
      );

      return {
        success: true,
        data: decision
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SCHEDULING_ERROR',
          message: 'Failed to determine scheduling decision',
          details: error,
          timestamp: new Date(),
          userId,
          issueKey
        }
      };
    }
  }

  /**
   * Schedules a notification for delivery
   */
  async scheduleNotification(
    userId: string,
    issueKey: string,
    type: NotificationType,
    priority: NotificationPriority,
    scheduledFor: Date,
    context: any
  ): Promise<ServiceResponse<ScheduledNotification>> {
    try {
      const notificationId = this.generateNotificationId();
      
      const scheduledNotification: ScheduledNotification = {
        id: notificationId,
        issueKey,
        userId,
        notificationType: type,
        priority,
        scheduledFor,
        createdAt: new Date(),
        attempts: 0,
        maxAttempts: NOTIFICATION_CONSTANTS.MAX_RETRY_ATTEMPTS,
        backoffMultiplier: NOTIFICATION_CONSTANTS.BACKOFF_MULTIPLIER,
        context: context,
        status: 'pending'
      };

      await this.addToQueue(scheduledNotification);

      return {
        success: true,
        data: scheduledNotification
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SCHEDULE_CREATION_ERROR',
          message: 'Failed to create scheduled notification',
          details: error,
          timestamp: new Date(),
          userId,
          issueKey
        }
      };
    }
  }

  /**
   * Gets the next batch of notifications ready for delivery
   */
  async getNotificationsReadyForDelivery(
    userId: string,
    maxCount: number = 5
  ): Promise<ServiceResponse<QueuedNotification[]>> {
    try {
      const queue = this.userQueues.get(userId);
      if (!queue) {
        return {
          success: true,
          data: []
        };
      }

      const now = new Date();
      const readyNotifications = queue.notifications
        .filter(qn => qn.estimatedDeliveryTime <= now)
        .filter(qn => qn.scheduledNotification.status === 'pending')
        .sort((a, b) => b.priority - a.priority) // Higher priority first
        .slice(0, maxCount);

      return {
        success: true,
        data: readyNotifications
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'QUEUE_ACCESS_ERROR',
          message: 'Failed to retrieve ready notifications',
          details: error,
          timestamp: new Date(),
          userId
        }
      };
    }
  }

  /**
   * Updates the status of a scheduled notification
   */
  async updateNotificationStatus(
    notificationId: string,
    status: ScheduledNotification['status'],
    deliveredAt?: Date
  ): Promise<ServiceResponse<void>> {
    try {
      // Find and update the notification across all queues
      for (const queue of this.userQueues.values()) {
        const queuedNotification = queue.notifications.find(
          qn => qn.scheduledNotification.id === notificationId
        );

        if (queuedNotification) {
          queuedNotification.scheduledNotification.status = status;
          
          if (deliveredAt && status === 'delivered') {
            // Update metrics
            await this.updateSchedulingMetrics(
              queuedNotification.scheduledNotification.userId,
              queuedNotification.scheduledNotification,
              deliveredAt
            );
          }
          
          if (status === 'failed') {
            await this.handleFailedNotification(queuedNotification);
          }

          return { success: true };
        }
      }

      return {
        success: false,
        error: {
          code: 'NOTIFICATION_NOT_FOUND',
          message: 'Scheduled notification not found',
          timestamp: new Date()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'STATUS_UPDATE_ERROR',
          message: 'Failed to update notification status',
          details: error,
          timestamp: new Date()
        }
      };
    }
  }

  /**
   * Optimizes scheduling based on user response patterns
   */
  async optimizeSchedulingForUser(
    userId: string,
    userPreferences: UserPreferences,
    responseHistory: any[]
  ): Promise<ServiceResponse<AdaptiveAdjustment[]>> {
    try {
      const adjustments: AdaptiveAdjustment[] = [];

      // Analyze optimal timing patterns
      const timeOptimization = this.analyzeOptimalTimes(responseHistory);
      if (timeOptimization) {
        adjustments.push({
          type: 'timing',
          reason: 'User responds better at specific times',
          adjustment: `Prefer delivery between ${timeOptimization.start} and ${timeOptimization.end}`,
          impact: 'moderate'
        });
      }

      // Analyze frequency preferences
      const frequencyOptimization = this.analyzeFrequencyPreference(responseHistory);
      if (frequencyOptimization) {
        adjustments.push({
          type: 'frequency',
          reason: 'User shows preference for different frequency',
          adjustment: `Adjust to ${frequencyOptimization} frequency`,
          impact: 'significant'
        });
      }

      // Update user's adaptive settings
      if (adjustments.length > 0) {
        await this.applyAdaptiveAdjustments(userId, adjustments);
      }

      return {
        success: true,
        data: adjustments
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'OPTIMIZATION_ERROR',
          message: 'Failed to optimize scheduling',
          details: error,
          timestamp: new Date(),
          userId
        }
      };
    }
  }

  private buildDefaultConfig(overrides?: Partial<SchedulingConfiguration>): SchedulingConfiguration {
    const defaultConfig: SchedulingConfiguration = {
      baseFrequencyMinutes: 240, // 4 hours
      priorityMultipliers: {
        low: 2.0,
        medium: 1.5,
        high: 1.0,
        urgent: 0.5
      },
      typeScheduling: {
        'stale-reminder': {
          minIntervalMinutes: 480, // 8 hours
          maxIntervalMinutes: 1440, // 24 hours
          optimalTimeWindows: [
            { start: '09:00', end: '11:00', daysOfWeek: [1, 2, 3, 4, 5], weight: 0.9 },
            { start: '14:00', end: '16:00', daysOfWeek: [1, 2, 3, 4, 5], weight: 0.8 }
          ],
          avoidTimeWindows: [
            { start: '12:00', end: '13:00', daysOfWeek: [1, 2, 3, 4, 5], weight: 0.1 }
          ],
          backoffMultiplier: 1.5,
          maxDailyCount: 3
        },
        'deadline-warning': {
          minIntervalMinutes: 60,
          maxIntervalMinutes: 480,
          optimalTimeWindows: [
            { start: '08:00', end: '10:00', daysOfWeek: [1, 2, 3, 4, 5], weight: 1.0 }
          ],
          avoidTimeWindows: [],
          backoffMultiplier: 1.2,
          maxDailyCount: 5
        },
        'progress-update': {
          minIntervalMinutes: 720, // 12 hours
          maxIntervalMinutes: 2160, // 36 hours
          optimalTimeWindows: [
            { start: '16:00', end: '17:00', daysOfWeek: [5], weight: 0.9 } // Friday afternoon
          ],
          avoidTimeWindows: [],
          backoffMultiplier: 2.0,
          maxDailyCount: 1
        },
        'team-encouragement': {
          minIntervalMinutes: 1440, // 24 hours
          maxIntervalMinutes: 4320, // 72 hours
          optimalTimeWindows: [
            { start: '10:00', end: '11:00', daysOfWeek: [1], weight: 1.0 } // Monday morning
          ],
          avoidTimeWindows: [],
          backoffMultiplier: 3.0,
          maxDailyCount: 1
        },
        'achievement-recognition': {
          minIntervalMinutes: 0, // Immediate
          maxIntervalMinutes: 60,
          optimalTimeWindows: [
            { start: '09:00', end: '17:00', daysOfWeek: [1, 2, 3, 4, 5], weight: 1.0 }
          ],
          avoidTimeWindows: [],
          backoffMultiplier: 1.0,
          maxDailyCount: 3
        }
      },
      globalLimits: {
        maxNotificationsPerHour: 3,
        maxNotificationsPerDay: NOTIFICATION_CONSTANTS.MAX_DAILY_NOTIFICATIONS,
        minIntervalBetweenNotifications: NOTIFICATION_CONSTANTS.MIN_INTERVAL_MINUTES,
        respectQuietHours: true,
        respectWeekends: true,
        respectHolidays: true
      },
      adaptiveScheduling: {
        enableLearning: true,
        learningPeriodDays: 14,
        adaptToUserResponse: true,
        adaptToWorkload: true,
        adaptToTeamVelocity: false,
        minimumDataPoints: 10
      }
    };

    return _.merge(defaultConfig, overrides || {});
  }

  private async buildSchedulingContext(
    userId: string,
    userPreferences: UserPreferences,
    workloadInfo: UserWorkloadInfo
  ): Promise<SchedulingContext> {
    const now = new Date();
    const queue = this.userQueues.get(userId);
    
    return {
      userWorkload: workloadInfo.currentCapacityLevel,
      timeZone: userPreferences.personalizedSettings.timeZone,
      isInQuietHours: this.isInQuietHours(now, userPreferences.notificationSettings.quietHours),
      isInWorkingHours: this.isInWorkingHours(now, userPreferences.personalizedSettings.workingHours),
      recentNotificationCount: this.getRecentNotificationCount(userId, 24), // last 24 hours
      lastNotificationTime: queue?.lastProcessedAt,
      userResponseHistory: [] // Would be populated from storage
    };
  }

  private async makeSchedulingDecision(
    type: NotificationType,
    priority: NotificationPriority,
    context: SchedulingContext,
    userPreferences: UserPreferences
  ): Promise<SchedulingDecision> {
    const reasoning: string[] = [];
    let shouldSchedule = true;
    let confidenceScore = 1.0;

    // Check global limits
    if (context.recentNotificationCount >= this.config.globalLimits.maxNotificationsPerDay) {
      shouldSchedule = false;
      reasoning.push('Daily notification limit reached');
      confidenceScore = 0;
    }

    // Check user workload
    if (context.userWorkload === 'overloaded' && priority !== 'urgent') {
      shouldSchedule = false;
      reasoning.push('User is currently overloaded');
      confidenceScore *= 0.3;
    }

    // Check quiet hours
    if (context.isInQuietHours && this.config.globalLimits.respectQuietHours) {
      shouldSchedule = false;
      reasoning.push('Currently in user quiet hours');
      confidenceScore *= 0.1;
    }

    // Determine optimal timing
    const recommendedTime = shouldSchedule 
      ? this.calculateOptimalTime(type, priority, context, userPreferences)
      : addMinutes(new Date(), 60); // Default to 1 hour later

    if (shouldSchedule) {
      reasoning.push(`Scheduled for optimal time window`);
    }

    const alternativeTimes = this.calculateAlternativeTimes(
      type, 
      priority, 
      context, 
      userPreferences
    );

    return {
      shouldSchedule,
      recommendedTime,
      reasoning,
      alternativeTimes,
      confidenceScore,
      adaptiveAdjustments: []
    };
  }

  private calculateOptimalTime(
    type: NotificationType,
    priority: NotificationPriority,
    context: SchedulingContext,
    userPreferences: UserPreferences
  ): Date {
    const typeConfig = this.config.typeScheduling[type];
    const baseInterval = typeConfig.minIntervalMinutes * this.config.priorityMultipliers[priority];
    
    // Find the next optimal time window
    const optimalWindows = typeConfig.optimalTimeWindows;
    const now = new Date();
    
    // Simple implementation - would be more sophisticated in production
    let targetTime = addMinutes(now, baseInterval);
    
    // Try to fit into an optimal window
    if (optimalWindows.length > 0) {
      const bestWindow = optimalWindows.reduce((best, current) => 
        current.weight > best.weight ? current : best
      );
      
      // Adjust to the best window (simplified logic)
      const today = new Date();
      const windowStart = new Date(today);
      const [hours, minutes] = bestWindow.start.split(':').map(Number);
      windowStart.setHours(hours, minutes, 0, 0);
      
      if (windowStart > now) {
        targetTime = windowStart;
      }
    }
    
    return targetTime;
  }

  private calculateAlternativeTimes(
    type: NotificationType,
    priority: NotificationPriority,
    context: SchedulingContext,
    userPreferences: UserPreferences
  ): Date[] {
    const alternatives: Date[] = [];
    const baseTime = new Date();
    
    // Generate 3 alternative times
    for (let i = 1; i <= 3; i++) {
      alternatives.push(addMinutes(baseTime, i * 120)); // Every 2 hours
    }
    
    return alternatives;
  }

  private async addToQueue(scheduledNotification: ScheduledNotification): Promise<void> {
    const userId = scheduledNotification.userId;
    
    if (!this.userQueues.has(userId)) {
      this.userQueues.set(userId, {
        userId,
        notifications: [],
        nextProcessingTime: new Date(),
        processingStatus: 'idle',
        errorCount: 0,
        maxRetries: NOTIFICATION_CONSTANTS.MAX_RETRY_ATTEMPTS
      });
    }

    const queue = this.userQueues.get(userId)!;
    const queuedNotification: QueuedNotification = {
      scheduledNotification,
      priority: this.calculateQueuePriority(scheduledNotification),
      estimatedDeliveryTime: scheduledNotification.scheduledFor,
      dependencies: [],
      canBeBatched: this.canBeBatched(scheduledNotification),
      batchKey: this.generateBatchKey(scheduledNotification)
    };

    queue.notifications.push(queuedNotification);
    queue.notifications.sort((a, b) => b.priority - a.priority);
  }

  private calculateQueuePriority(notification: ScheduledNotification): number {
    const priorityScores = { urgent: 100, high: 75, medium: 50, low: 25 };
    const typeScores = {
      'deadline-warning': 20,
      'stale-reminder': 10,
      'achievement-recognition': 15,
      'progress-update': 5,
      'team-encouragement': 5
    };
    
    return priorityScores[notification.priority] + typeScores[notification.notificationType];
  }

  private canBeBatched(notification: ScheduledNotification): boolean {
    // Progress updates and team encouragement can be batched
    return ['progress-update', 'team-encouragement'].includes(notification.notificationType);
  }

  private generateBatchKey(notification: ScheduledNotification): string | undefined {
    if (!this.canBeBatched(notification)) return undefined;
    
    // Group by type and date
    const date = format(notification.scheduledFor, 'yyyy-MM-dd');
    return `${notification.notificationType}-${date}`;
  }

  private async handleFailedNotification(queuedNotification: QueuedNotification): Promise<void> {
    const notification = queuedNotification.scheduledNotification;
    notification.attempts++;

    if (notification.attempts < notification.maxAttempts) {
      // Reschedule with backoff
      const backoffMinutes = Math.pow(notification.backoffMultiplier, notification.attempts) * 30;
      notification.scheduledFor = addMinutes(new Date(), backoffMinutes);
      notification.status = 'pending';
    } else {
      notification.status = 'expired';
    }
  }

  private isInQuietHours(time: Date, quietHours: any): boolean {
    if (!quietHours.enabled) return false;
    
    // Simplified implementation
    const hour = time.getHours();
    const startHour = parseInt(quietHours.start.split(':')[0]);
    const endHour = parseInt(quietHours.end.split(':')[0]);
    
    return hour >= startHour || hour <= endHour;
  }

  private isInWorkingHours(time: Date, workingHours: any): boolean {
    // Simplified implementation
    const dayOfWeek = time.getDay();
    const hour = time.getHours();
    
    // Assume standard working hours if not specified
    return dayOfWeek >= 1 && dayOfWeek <= 5 && hour >= 9 && hour <= 17;
  }

  private getRecentNotificationCount(userId: string, hours: number): number {
    const queue = this.userQueues.get(userId);
    if (!queue) return 0;

    const cutoff = addMinutes(new Date(), -hours * 60);
    return queue.notifications.filter(
      qn => qn.scheduledNotification.createdAt >= cutoff
    ).length;
  }

  private analyzeOptimalTimes(responseHistory: any[]): { start: string; end: string } | null {
    // Analyze response history to find optimal time windows
    // This would implement machine learning logic in production
    return null; // Simplified for now
  }

  private analyzeFrequencyPreference(responseHistory: any[]): string | null {
    // Analyze to determine if user prefers different frequency
    return null; // Simplified for now
  }

  private async applyAdaptiveAdjustments(userId: string, adjustments: AdaptiveAdjustment[]): Promise<void> {
    // Apply learned adjustments to user's configuration
    // This would update the scheduling configuration for this user
  }

  private async updateSchedulingMetrics(
    userId: string,
    notification: ScheduledNotification,
    deliveredAt: Date
  ): Promise<void> {
    // Update metrics for effectiveness tracking
    const deliveryTime = deliveredAt.getTime() - notification.scheduledFor.getTime();
    // Store metrics for analysis
  }

  private generateNotificationId(): string {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}