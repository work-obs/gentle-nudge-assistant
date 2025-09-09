/**
 * NotificationEngine - Main orchestrator for the Gentle Nudge Assistant
 * Coordinates all services to create, schedule, and deliver encouraging notifications
 */

import * as _ from 'lodash';
import { addHours, addMinutes } from 'date-fns';

import {
  Notification,
  NotificationContent,
  NotificationContext,
  NotificationMetadata,
  NotificationResult,
  JiraIssueData,
  UserPreferences,
  UserWorkloadInfo,
  TeamMetrics,
  DeadlineInfo,
  NotificationType,
  NotificationPriority,
  ServiceResponse,
  GentleNudgeError,
  NOTIFICATION_CONSTANTS,
  ScheduledNotification,
  NotificationHistory,
} from '../types';

import { SchedulerService } from './SchedulerService';
import { ContentGenerator } from './ContentGenerator';
import { DeliveryManager } from './DeliveryManager';
import { ToneAnalyzer } from './ToneAnalyzer';
import { StorageService } from '../config/StorageService';
import { JiraApiService } from '../analytics/JiraApiService';

interface NotificationPipeline {
  id: string;
  userId: string;
  issueKey: string;
  type: NotificationType;
  priority: NotificationPriority;
  context: NotificationContext;
  stages: {
    analysis?: { completed: boolean; result?: any };
    scheduling?: { completed: boolean; result?: any };
    contentGeneration?: { completed: boolean; result?: any };
    toneValidation?: { completed: boolean; result?: any };
    delivery?: { completed: boolean; result?: any };
  };
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: GentleNudgeError;
  createdAt: Date;
  completedAt?: Date;
}

interface EngineConfiguration {
  enableToneValidation: boolean;
  minimumToneScore: number;
  maxRetryAttempts: number;
  batchProcessingEnabled: boolean;
  adaptiveLearningEnabled: boolean;
  debugMode: boolean;
}

export class NotificationEngine {
  private schedulerService: SchedulerService;
  private contentGenerator: ContentGenerator;
  private deliveryManager: DeliveryManager;
  private toneAnalyzer: ToneAnalyzer;
  private storageService: StorageService;
  private jiraApiService: JiraApiService;

  private activePipelines: Map<string, NotificationPipeline> = new Map();
  private configuration: EngineConfiguration;

  private processingQueue: string[] = [];
  private isProcessing = false;

  constructor(config?: Partial<EngineConfiguration>) {
    this.schedulerService = new SchedulerService();
    this.contentGenerator = new ContentGenerator();
    this.deliveryManager = new DeliveryManager();
    this.toneAnalyzer = new ToneAnalyzer();
    this.storageService = new StorageService();
    this.jiraApiService = new JiraApiService();

    this.configuration = {
      enableToneValidation: true,
      minimumToneScore: 0.7,
      maxRetryAttempts: 3,
      batchProcessingEnabled: true,
      adaptiveLearningEnabled: true,
      debugMode: false,
      ...config,
    };

    this.startProcessingLoop();
  }

  /**
   * Main entry point - creates and processes a notification request
   */
  async createNotification(
    userId: string,
    issueKey: string,
    type: NotificationType,
    priority: NotificationPriority = 'medium'
  ): Promise<ServiceResponse<string>> {
    try {
      // Get user preferences
      const preferencesResult =
        await this.storageService.getUserPreferences(userId);
      if (!preferencesResult.success) {
        return { success: false, error: preferencesResult.error };
      }
      const userPreferences = preferencesResult.data!;

      // Get issue data
      const issueResult = await this.jiraApiService.getIssue(issueKey);
      if (!issueResult.success) {
        return { success: false, error: issueResult.error };
      }
      const issueData = issueResult.data!;

      // Calculate user workload
      const workloadResult =
        await this.jiraApiService.calculateUserWorkload(userId);
      if (!workloadResult.success) {
        return { success: false, error: workloadResult.error };
      }
      const workloadInfo = workloadResult.data!;

      // Get team metrics if available
      let teamMetrics: TeamMetrics | undefined;
      const teamMetricsResult = await this.jiraApiService.getTeamMetrics(
        issueData.project.key
      );
      if (teamMetricsResult.success) {
        teamMetrics = teamMetricsResult.data;
      }

      // Create deadline info if applicable
      const deadline = this.jiraApiService.createDeadlineInfo(issueData);

      // Build notification context
      const context: NotificationContext = {
        type,
        issueData,
        userWorkload: workloadInfo,
        teamMetrics,
        deadline,
      };

      // Create pipeline
      const pipelineId = this.createNotificationPipeline(
        userId,
        issueKey,
        type,
        priority,
        context
      );

      // Add to processing queue
      this.processingQueue.push(pipelineId);

      return { success: true, data: pipelineId };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'NOTIFICATION_CREATE_ERROR',
          message: 'Failed to create notification',
          details: error.message,
          timestamp: new Date(),
          userId,
          issueKey,
        },
      };
    }
  }

  /**
   * Processes stale issues for a user and creates appropriate notifications
   */
  async processStaleIssues(
    userId: string,
    staleDays: number = 3
  ): Promise<ServiceResponse<string[]>> {
    try {
      // Get user's stale issues
      const staleIssuesResult = await this.jiraApiService.getUserStaleIssues(
        userId,
        staleDays
      );
      if (!staleIssuesResult.success) {
        return { success: false, error: staleIssuesResult.error };
      }

      const staleIssues = staleIssuesResult.data!;
      const pipelineIds: string[] = [];

      // Create notifications for each stale issue
      for (const issue of staleIssues) {
        // Check if we've already sent a notification recently
        const historyResult = await this.storageService.getNotificationHistory(
          issue.key
        );
        if (historyResult.success && historyResult.data) {
          const history = historyResult.data;
          const hoursSinceLastNudge =
            addHours(history.lastNudgeDate, 24) > new Date() ? 0 : 24;

          // Skip if we sent a notification in the last 24 hours
          if (hoursSinceLastNudge === 0) {
            continue;
          }
        }

        const createResult = await this.createNotification(
          userId,
          issue.key,
          'stale-reminder',
          this.determinePriorityFromStaleness(issue, staleDays)
        );

        if (createResult.success) {
          pipelineIds.push(createResult.data!);
        }
      }

      return { success: true, data: pipelineIds };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'STALE_ISSUES_PROCESS_ERROR',
          message: 'Failed to process stale issues',
          details: error.message,
          timestamp: new Date(),
          userId,
        },
      };
    }
  }

  /**
   * Processes deadline warnings for a user
   */
  async processDeadlineWarnings(
    userId: string,
    warningDays: number = 2
  ): Promise<ServiceResponse<string[]>> {
    try {
      const deadlineIssuesResult =
        await this.jiraApiService.getUserIssuesApproachingDeadline(
          userId,
          warningDays
        );

      if (!deadlineIssuesResult.success) {
        return { success: false, error: deadlineIssuesResult.error };
      }

      const deadlineIssues = deadlineIssuesResult.data!;
      const pipelineIds: string[] = [];

      for (const issue of deadlineIssues) {
        const deadline = this.jiraApiService.createDeadlineInfo(issue);
        if (!deadline) continue;

        const priority = this.determinePriorityFromDeadline(deadline);

        const createResult = await this.createNotification(
          userId,
          issue.key,
          'deadline-warning',
          priority
        );

        if (createResult.success) {
          pipelineIds.push(createResult.data!);
        }
      }

      return { success: true, data: pipelineIds };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'DEADLINE_WARNINGS_PROCESS_ERROR',
          message: 'Failed to process deadline warnings',
          details: error.message,
          timestamp: new Date(),
          userId,
        },
      };
    }
  }

  /**
   * Creates achievement recognition notifications
   */
  async createAchievementNotification(
    userId: string,
    achievementType:
      | 'issue-completed'
      | 'streak-maintained'
      | 'team-contribution',
    context: any
  ): Promise<ServiceResponse<string>> {
    try {
      // For achievement notifications, we create a generic issue context
      // In a real implementation, this would be more sophisticated
      const mockIssueData: JiraIssueData = {
        key: context.issueKey || 'ACHIEVEMENT-1',
        summary: context.summary || 'Achievement Recognition',
        status: 'Completed',
        priority: 'Medium',
        assignee: userId,
        reporter: userId,
        created: new Date(),
        updated: new Date(),
        project: context.project || { key: 'GENERAL', name: 'General' },
        issueType: 'Task',
        components: [],
        labels: [],
      };

      const createResult = await this.createNotification(
        userId,
        mockIssueData.key,
        'achievement-recognition',
        'low' // Achievements are positive but not urgent
      );

      return createResult;
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'ACHIEVEMENT_NOTIFICATION_ERROR',
          message: 'Failed to create achievement notification',
          details: error.message,
          timestamp: new Date(),
          userId,
        },
      };
    }
  }

  /**
   * Gets the status of a notification pipeline
   */
  async getPipelineStatus(
    pipelineId: string
  ): Promise<ServiceResponse<NotificationPipeline | null>> {
    try {
      const pipeline = this.activePipelines.get(pipelineId);
      return { success: true, data: pipeline || null };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'PIPELINE_STATUS_ERROR',
          message: 'Failed to get pipeline status',
          details: error.message,
          timestamp: new Date(),
        },
      };
    }
  }

  /**
   * Records user response to a delivered notification
   */
  async recordUserResponse(
    notificationId: string,
    response: 'dismissed' | 'acknowledged' | 'actioned' | 'snoozed'
  ): Promise<ServiceResponse<void>> {
    try {
      // Record response in delivery manager
      await this.deliveryManager.recordUserResponse(notificationId, response);

      // Update storage with response
      // This would require extracting issue key from notification ID
      // Simplified for this implementation

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'USER_RESPONSE_ERROR',
          message: 'Failed to record user response',
          details: error.message,
          timestamp: new Date(),
        },
      };
    }
  }

  /**
   * Gets analytics and effectiveness metrics
   */
  async getNotificationAnalytics(
    userId: string,
    days: number = 30
  ): Promise<ServiceResponse<any>> {
    try {
      // Get delivery statistics
      const deliveryStats = await this.deliveryManager.getDeliveryStatistics(
        userId,
        days
      );

      // Get user analytics from storage
      const userAnalytics = await this.storageService.getUserAnalytics(userId);

      const analytics = {
        deliveryStatistics: deliveryStats.success ? deliveryStats.data : null,
        userAnalytics: userAnalytics.success ? userAnalytics.data : null,
        generatedAt: new Date(),
      };

      return { success: true, data: analytics };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'ANALYTICS_ERROR',
          message: 'Failed to get notification analytics',
          details: error.message,
          timestamp: new Date(),
          userId,
        },
      };
    }
  }

  private createNotificationPipeline(
    userId: string,
    issueKey: string,
    type: NotificationType,
    priority: NotificationPriority,
    context: NotificationContext
  ): string {
    const pipelineId = `pipeline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const pipeline: NotificationPipeline = {
      id: pipelineId,
      userId,
      issueKey,
      type,
      priority,
      context,
      stages: {},
      status: 'pending',
      createdAt: new Date(),
    };

    this.activePipelines.set(pipelineId, pipeline);

    if (this.configuration.debugMode) {
      console.log(`Created notification pipeline: ${pipelineId}`);
    }

    return pipelineId;
  }

  private async startProcessingLoop(): Promise<void> {
    setInterval(async () => {
      if (!this.isProcessing && this.processingQueue.length > 0) {
        await this.processNextInQueue();
      }
    }, 1000); // Check every second
  }

  private async processNextInQueue(): Promise<void> {
    if (this.processingQueue.length === 0) return;

    this.isProcessing = true;

    try {
      const pipelineId = this.processingQueue.shift()!;
      await this.processPipeline(pipelineId);
    } catch (error) {
      console.error('Error processing pipeline:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async processPipeline(pipelineId: string): Promise<void> {
    const pipeline = this.activePipelines.get(pipelineId);
    if (!pipeline) return;

    try {
      pipeline.status = 'processing';

      // Stage 1: Get user preferences
      const userPrefs = await this.storageService.getUserPreferences(
        pipeline.userId
      );
      if (!userPrefs.success) throw new Error('Failed to get user preferences');

      // Stage 2: Scheduling decision
      const schedulingResult =
        await this.schedulerService.shouldScheduleNotification(
          pipeline.userId,
          pipeline.issueKey,
          pipeline.type,
          pipeline.priority,
          userPrefs.data!,
          pipeline.context.userWorkload
        );

      if (!schedulingResult.success || !schedulingResult.data!.shouldSchedule) {
        pipeline.status = 'completed';
        pipeline.completedAt = new Date();
        return;
      }

      pipeline.stages.scheduling = {
        completed: true,
        result: schedulingResult.data,
      };

      // Stage 3: Content generation
      const contentResult =
        await this.contentGenerator.generateNotificationContent(
          pipeline.context,
          userPrefs.data!
        );

      if (!contentResult.success) throw new Error('Failed to generate content');
      pipeline.stages.contentGeneration = {
        completed: true,
        result: contentResult.data,
      };

      let content = contentResult.data!;

      // Stage 4: Tone validation (if enabled)
      if (this.configuration.enableToneValidation) {
        const toneValidation = await this.toneAnalyzer.validateContentTone(
          content,
          this.configuration.minimumToneScore,
          userPrefs.data!.personalizedSettings.preferredTone
        );

        if (toneValidation.success && !toneValidation.data) {
          // Attempt to improve tone
          const improvedContent = await this.toneAnalyzer.improveContentTone(
            content,
            userPrefs.data!.personalizedSettings.preferredTone,
            userPrefs.data!.personalizedSettings.encouragementStyle
          );

          if (improvedContent.success) {
            content = improvedContent.data!;
          }
        }

        pipeline.stages.toneValidation = {
          completed: true,
          result: toneValidation.data,
        };
      }

      // Stage 5: Create notification object
      const notificationId = this.generateNotificationId();
      const metadata: NotificationMetadata = {
        id: notificationId,
        issueKey: pipeline.issueKey,
        userId: pipeline.userId,
        createdAt: new Date(),
        scheduledFor: schedulingResult.data!.recommendedTime,
        priority: pipeline.priority,
        context: pipeline.context,
      };

      const notification: Notification = {
        metadata,
        content,
      };

      // Stage 6: Delivery
      const deliveryResult = await this.deliveryManager.deliverNotification(
        notification,
        userPrefs.data!
      );

      pipeline.stages.delivery = { completed: true, result: deliveryResult };

      if (deliveryResult.success) {
        // Record successful notification
        await this.storageService.recordNotification(
          pipeline.issueKey,
          metadata
        );

        pipeline.status = 'completed';
        pipeline.completedAt = new Date();

        if (this.configuration.debugMode) {
          console.log(`Pipeline completed successfully: ${pipelineId}`);
        }
      } else {
        throw new Error('Delivery failed');
      }
    } catch (error: any) {
      pipeline.status = 'failed';
      pipeline.error = {
        code: 'PIPELINE_PROCESSING_ERROR',
        message: 'Pipeline processing failed',
        details: error.message,
        timestamp: new Date(),
        userId: pipeline.userId,
        issueKey: pipeline.issueKey,
      };

      console.error(`Pipeline failed: ${pipelineId}`, error);
    }
  }

  private determinePriorityFromStaleness(
    issue: JiraIssueData,
    staleDays: number
  ): NotificationPriority {
    const daysSinceUpdate = Math.floor(
      (Date.now() - issue.updated.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceUpdate > staleDays * 3) return 'high';
    if (daysSinceUpdate > staleDays * 2) return 'medium';
    return 'low';
  }

  private determinePriorityFromDeadline(
    deadline: DeadlineInfo
  ): NotificationPriority {
    if (deadline.isOverdue) return 'urgent';
    if (deadline.daysRemaining <= 1) return 'high';
    if (deadline.daysRemaining <= 3) return 'medium';
    return 'low';
  }

  private generateNotificationId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
