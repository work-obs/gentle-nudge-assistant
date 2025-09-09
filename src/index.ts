/**
 * Gentle Nudge Assistant - Main entry point
 * A Jira Cloud plugin that provides friendly, context-aware reminders about stale tickets and approaching deadlines
 */

// Core notification engine components
export { NotificationEngine } from './notification-engine/NotificationEngine';
export { SchedulerService } from './notification-engine/SchedulerService';
export { ContentGenerator } from './notification-engine/ContentGenerator';
export { DeliveryManager } from './notification-engine/DeliveryManager';
export { ToneAnalyzer } from './notification-engine/ToneAnalyzer';

// Analytics and integration services
export { JiraApiService } from './analytics/JiraApiService';

// Configuration and storage
export { StorageService } from './config/StorageService';

// Types and interfaces
export * from './types';

// Main application class for Forge integration
export class GentleNudgeAssistant {
  private notificationEngine: NotificationEngine;

  constructor(config?: any) {
    this.notificationEngine = new NotificationEngine(config);
  }

  /**
   * Initialize the Gentle Nudge Assistant
   * This would be called from the Forge app's main entry point
   */
  async initialize(): Promise<void> {
    console.log('🌟 Gentle Nudge Assistant initialized successfully!');
    console.log('Ready to provide encouraging, context-aware notifications');
  }

  /**
   * Process notifications for a specific user
   * This could be called on a schedule or triggered by events
   */
  async processUserNotifications(userId: string): Promise<void> {
    try {
      // Process stale issues
      await this.notificationEngine.processStaleIssues(userId);

      // Process deadline warnings
      await this.notificationEngine.processDeadlineWarnings(userId);

      console.log(`✨ Processed notifications for user: ${userId}`);
    } catch (error) {
      console.error(
        `❌ Error processing notifications for user ${userId}:`,
        error
      );
    }
  }

  /**
   * Create a specific notification
   */
  async createNotification(
    userId: string,
    issueKey: string,
    type: import('./types').NotificationType,
    priority: import('./types').NotificationPriority = 'medium'
  ): Promise<string | null> {
    try {
      const result = await this.notificationEngine.createNotification(
        userId,
        issueKey,
        type,
        priority
      );

      if (result.success) {
        console.log(`💫 Created ${type} notification for ${issueKey}`);
        return result.data!;
      } else {
        console.error(`❌ Failed to create notification:`, result.error);
        return null;
      }
    } catch (error) {
      console.error(`❌ Error creating notification:`, error);
      return null;
    }
  }

  /**
   * Record user interaction with a notification
   */
  async recordUserResponse(
    notificationId: string,
    response: 'dismissed' | 'acknowledged' | 'actioned' | 'snoozed'
  ): Promise<void> {
    try {
      await this.notificationEngine.recordUserResponse(
        notificationId,
        response
      );
      console.log(
        `📝 Recorded user response: ${response} for notification ${notificationId}`
      );
    } catch (error) {
      console.error(`❌ Error recording user response:`, error);
    }
  }

  /**
   * Get analytics data for reporting and optimization
   */
  async getAnalytics(userId: string, days: number = 30): Promise<any> {
    try {
      const result = await this.notificationEngine.getNotificationAnalytics(
        userId,
        days
      );

      if (result.success) {
        return result.data;
      } else {
        console.error(`❌ Failed to get analytics:`, result.error);
        return null;
      }
    } catch (error) {
      console.error(`❌ Error getting analytics:`, error);
      return null;
    }
  }

  /**
   * Handle achievement recognition
   */
  async celebrateAchievement(
    userId: string,
    achievementType:
      | 'issue-completed'
      | 'streak-maintained'
      | 'team-contribution',
    context: any
  ): Promise<void> {
    try {
      const result =
        await this.notificationEngine.createAchievementNotification(
          userId,
          achievementType,
          context
        );

      if (result.success) {
        console.log(
          `🎉 Created achievement notification for ${userId}: ${achievementType}`
        );
      } else {
        console.error(
          `❌ Failed to create achievement notification:`,
          result.error
        );
      }
    } catch (error) {
      console.error(`❌ Error creating achievement notification:`, error);
    }
  }

  /**
   * Get the underlying notification engine for advanced operations
   */
  getEngine(): NotificationEngine {
    return this.notificationEngine;
  }
}

// Default export for easy importing
export default GentleNudgeAssistant;
