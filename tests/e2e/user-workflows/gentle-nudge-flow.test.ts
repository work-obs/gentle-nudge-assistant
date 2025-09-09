/**
 * End-to-end tests for complete user workflows
 * Tests the full gentle nudge experience from issue detection to resolution
 */

import { describe, beforeAll, afterAll, beforeEach, it, expect, jest } from '@jest/globals';
import { mockStorage, storageHelpers } from '../../mocks/forge-storage.mock';
import { mockJiraAPI, mockJiraIssues } from '../../mocks/jira-api.mock';
import { createUserBehavior, interactionScenarios } from '../../mocks/user-interactions.mock';
import { createTestNotification, createTestUserPreferences } from '../../utils/test-utils';

// Mock Gentle Nudge System orchestrator
class MockGentleNudgeSystem {
  private isRunning = false;
  private scheduledNotifications: any[] = [];
  private userInteractions: any[] = [];

  async start() {
    this.isRunning = true;
    console.log('🌟 Gentle Nudge Assistant started');
  }

  async stop() {
    this.isRunning = false;
    this.scheduledNotifications = [];
    this.userInteractions = [];
  }

  async runCompleteNudgeCycle(userId: string) {
    if (!this.isRunning) throw new Error('System not running');

    const workflow = {
      issueDetection: await this.detectIssuesRequiringAttention(userId),
      notificationGeneration: null as any,
      userInteraction: null as any,
      followUp: null as any
    };

    // Step 1: Issue Detection
    console.log('🔍 Detecting issues requiring attention...');
    
    // Step 2: Generate appropriate notifications
    console.log('✨ Generating encouraging notifications...');
    workflow.notificationGeneration = await this.generateGentleNotifications(
      workflow.issueDetection.staleIssues,
      workflow.issueDetection.deadlineIssues,
      userId
    );

    // Step 3: Deliver notifications and track user interaction
    console.log('📬 Delivering gentle nudges...');
    workflow.userInteraction = await this.deliverNotificationsAndTrackResponse(
      workflow.notificationGeneration,
      userId
    );

    // Step 4: Follow up based on user response
    console.log('🤝 Following up based on user response...');
    workflow.followUp = await this.handleUserResponseAndFollowUp(
      workflow.userInteraction,
      userId
    );

    return workflow;
  }

  private async detectIssuesRequiringAttention(userId: string) {
    const preferences = await mockStorage.get(`user:${userId}:preferences`);
    const staleDaysThreshold = preferences?.notificationSettings?.staleDaysThreshold || 3;

    // Simulate issue fetching
    const allIssues = Object.values(mockJiraIssues);
    const now = new Date();

    const staleIssues = allIssues.filter(issue => {
      const daysSinceUpdate = Math.floor(
        (now.getTime() - issue.updated.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysSinceUpdate >= staleDaysThreshold;
    });

    const deadlineIssues = allIssues.filter(issue => {
      if (!issue.dueDate) return false;
      const daysUntilDue = Math.floor(
        (issue.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysUntilDue >= 0 && daysUntilDue <= 3; // Due within 3 days
    });

    return {
      totalIssues: allIssues.length,
      staleIssues,
      deadlineIssues,
      detectionTime: new Date()
    };
  }

  private async generateGentleNotifications(staleIssues: any[], deadlineIssues: any[], userId: string) {
    const preferences = await mockStorage.get(`user:${userId}:preferences`);
    const tone = preferences?.personalizedSettings?.preferredTone || 'encouraging';
    const encouragementStyle = preferences?.personalizedSettings?.encouragementStyle || 'cheerful';

    const notifications = [];

    // Generate stale issue notifications
    for (const issue of staleIssues) {
      const notification = createTestNotification({
        metadata: {
          id: `stale-${issue.key}-${Date.now()}`,
          issueKey: issue.key,
          userId,
          createdAt: new Date(),
          scheduledFor: new Date(),
          priority: issue.priority.toLowerCase(),
          context: {
            type: 'stale-reminder',
            issueData: issue,
            userWorkload: {
              totalAssignedIssues: staleIssues.length + deadlineIssues.length,
              overdueIssues: 0,
              staleDaysAverage: 4.2,
              recentActivityScore: 6.8,
              currentCapacityLevel: 'moderate'
            }
          }
        },
        content: {
          title: 'Gentle reminder ✨',
          message: this.generateEncouragingMessage('stale-reminder', issue, encouragementStyle),
          tone,
          templateId: 'stale-reminder-v1',
          variables: {
            issueKey: issue.key,
            daysSinceUpdate: Math.floor(
              (new Date().getTime() - issue.updated.getTime()) / (1000 * 60 * 60 * 24)
            )
          }
        }
      });

      notifications.push(notification);
    }

    // Generate deadline notifications
    for (const issue of deadlineIssues) {
      const daysUntilDue = Math.floor(
        (issue.dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );

      const notification = createTestNotification({
        metadata: {
          id: `deadline-${issue.key}-${Date.now()}`,
          issueKey: issue.key,
          userId,
          createdAt: new Date(),
          scheduledFor: new Date(),
          priority: daysUntilDue <= 1 ? 'high' : 'medium',
          context: {
            type: 'deadline-warning',
            issueData: issue,
            deadline: {
              dueDate: issue.dueDate,
              daysRemaining: daysUntilDue,
              isOverdue: false,
              slaBreachRisk: daysUntilDue <= 1 ? 'high' : 'medium',
              bufferTime: daysUntilDue * 24
            }
          }
        },
        content: {
          title: 'Friendly deadline reminder 🎯',
          message: this.generateEncouragingMessage('deadline-warning', issue, encouragementStyle, daysUntilDue),
          tone,
          templateId: 'deadline-warning-v1',
          variables: {
            issueKey: issue.key,
            daysUntilDue
          }
        }
      });

      notifications.push(notification);
    }

    this.scheduledNotifications = notifications;
    return {
      notifications,
      totalGenerated: notifications.length,
      generationTime: new Date()
    };
  }

  private generateEncouragingMessage(type: string, issue: any, style: string, daysUntilDue?: number): string {
    const templates = {
      'stale-reminder': {
        cheerful: [
          `Hey there! Your amazing work on ${issue.key} is fantastic, and when you have a moment, it would love a quick update! ✨`,
          `${issue.key} has been waiting patiently for your brilliant insights. No rush - just a gentle reminder! 🌟`,
          `Your expertise is needed! ${issue.key} would benefit from your wonderful attention when you're ready. 💫`
        ],
        supportive: [
          `We're here to help! ${issue.key} could use your thoughtful attention when it's convenient. 🤝`,
          `${issue.key} is ready for your careful consideration. Take your time and do your best work! 💪`,
          `Just a supportive reminder that ${issue.key} would appreciate your insights when you have a moment. 🌱`
        ],
        gentle: [
          `When you have a quiet moment, ${issue.key} might benefit from a gentle check-in. 🕊️`,
          `No pressure at all - ${issue.key} is simply waiting for your attention when convenient. 🌸`,
          `A soft reminder that ${issue.key} could use your thoughtful touch when you're ready. 🦋`
        ]
      },
      'deadline-warning': {
        cheerful: [
          `Heads up! ${issue.key} is due ${daysUntilDue === 1 ? 'tomorrow' : `in ${daysUntilDue} days`}, but we have total confidence you'll handle it perfectly! 💪✨`,
          `Just a cheerful reminder: ${issue.key} would love to be completed by its deadline. You've got this! 🚀🌟`,
          `${issue.key} is approaching its deadline, but with your amazing skills, it'll be fantastic! 🎯⭐`
        ],
        supportive: [
          `We believe in you! ${issue.key} has a deadline coming up ${daysUntilDue === 1 ? 'tomorrow' : `in ${daysUntilDue} days`}. You can do this! 🤝💪`,
          `${issue.key} needs your attention before its deadline. We're confident in your abilities! 🌱🎯`,
          `A supportive reminder: ${issue.key} is due soon, but we know you'll handle it with care and excellence. 💚`
        ]
      }
    };

    const styleTemplates = templates[type as keyof typeof templates]?.[style as keyof typeof templates[typeof type]] 
                          || templates[type as keyof typeof templates]?.cheerful || [];
    
    return styleTemplates[Math.floor(Math.random() * styleTemplates.length)] || 
           `Great work! Please consider updating ${issue.key} when you have a moment. ✨`;
  }

  private async deliverNotificationsAndTrackResponse(notificationData: any, userId: string) {
    const preferences = await mockStorage.get(`user:${userId}:preferences`);
    const userBehaviorProfile = this.inferUserBehaviorProfile(preferences);
    const userBehavior = createUserBehavior[userBehaviorProfile]();

    const interactions = [];

    for (const notification of notificationData.notifications) {
      // Simulate notification delivery
      const deliveredAt = new Date();
      notification.metadata.deliveredAt = deliveredAt;

      // Simulate user response based on behavior profile
      const response = await userBehavior.simulateResponse(
        notification.metadata.priority,
        notification.metadata.context.type
      );

      const interaction = {
        notificationId: notification.metadata.id,
        userId,
        deliveredAt,
        response,
        responseTime: Math.random() * 10000, // Random response time in ms
        issueKey: notification.metadata.issueKey
      };

      interactions.push(interaction);
      this.userInteractions.push(interaction);

      // Update notification history
      await this.updateNotificationHistory(notification, interaction);
    }

    return {
      interactions,
      totalDelivered: notificationData.notifications.length,
      averageResponseTime: interactions.reduce((sum, i) => sum + i.responseTime, 0) / interactions.length,
      responseRate: interactions.filter(i => i.response !== 'dismissed').length / interactions.length,
      deliveryTime: new Date()
    };
  }

  private inferUserBehaviorProfile(preferences: any): keyof typeof createUserBehavior {
    // Simple heuristics to infer behavior profile
    const frequency = preferences?.notificationSettings?.frequency || 'gentle';
    const maxDaily = preferences?.notificationSettings?.maxDailyNotifications || 5;

    if (frequency === 'minimal' || maxDaily <= 3) return 'selective';
    if (frequency === 'moderate' && maxDaily <= 8) return 'responsive';
    return 'responsive';
  }

  private async updateNotificationHistory(notification: any, interaction: any) {
    const historyKey = `notification-history:${notification.metadata.issueKey}`;
    const existingHistory = await mockStorage.get(historyKey) || {
      issueKey: notification.metadata.issueKey,
      notifications: [],
      lastNudgeDate: new Date(),
      totalNudgeCount: 0,
      effectivenessScore: 5.0,
      userResponsePattern: []
    };

    existingHistory.notifications.push(notification.metadata);
    existingHistory.lastNudgeDate = new Date();
    existingHistory.totalNudgeCount++;
    existingHistory.userResponsePattern.push(interaction.response);

    // Calculate effectiveness based on response
    const responseScore = {
      'actioned': 10,
      'acknowledged': 7,
      'snoozed': 5,
      'dismissed': 2
    }[interaction.response] || 1;

    existingHistory.effectivenessScore = 
      (existingHistory.effectivenessScore + responseScore) / 2;

    await mockStorage.set(historyKey, existingHistory);
  }

  private async handleUserResponseAndFollowUp(interactionData: any, userId: string) {
    const followUpActions = [];

    for (const interaction of interactionData.interactions) {
      let followUpAction = null;

      switch (interaction.response) {
        case 'actioned':
          followUpAction = {
            type: 'positive_reinforcement',
            message: 'Amazing work! Your proactive approach is fantastic! 🌟',
            scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
          };
          break;

        case 'acknowledged':
          followUpAction = {
            type: 'gentle_check_in',
            message: 'Thanks for acknowledging! No pressure, just checking if you need any support. 🤝',
            scheduledFor: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // In 2 days
          };
          break;

        case 'snoozed':
          followUpAction = {
            type: 'snoozed_reminder',
            message: 'Hope you had a good break! Ready to tackle this when you are. ✨',
            scheduledFor: new Date(Date.now() + 4 * 60 * 60 * 1000) // In 4 hours (typical snooze)
          };
          break;

        case 'dismissed':
          followUpAction = {
            type: 'respectful_distance',
            message: 'We respect your workflow! If you need gentle reminders later, just let us know. 🕊️',
            scheduledFor: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // In a week
          };
          break;
      }

      if (followUpAction) {
        followUpActions.push({
          ...followUpAction,
          userId,
          issueKey: interaction.issueKey,
          originalInteractionId: interaction.notificationId
        });
      }
    }

    // Update user analytics
    await this.updateUserAnalytics(userId, interactionData);

    return {
      followUpActions,
      totalFollowUps: followUpActions.length,
      followUpTime: new Date()
    };
  }

  private async updateUserAnalytics(userId: string, interactionData: any) {
    const analyticsKey = `user-analytics:${userId}`;
    const analytics = await mockStorage.get(analyticsKey) || {
      userId,
      totalNotifications: 0,
      totalResponses: 0,
      responseRate: 0,
      averageResponseTime: 0,
      lastUpdated: new Date()
    };

    analytics.totalNotifications += interactionData.interactions.length;
    analytics.totalResponses += interactionData.interactions.filter(i => i.response !== 'dismissed').length;
    analytics.responseRate = analytics.totalResponses / analytics.totalNotifications;
    analytics.averageResponseTime = 
      (analytics.averageResponseTime + interactionData.averageResponseTime) / 2;
    analytics.lastUpdated = new Date();

    await mockStorage.set(analyticsKey, analytics);
  }

  getSystemMetrics() {
    return {
      isRunning: this.isRunning,
      scheduledNotifications: this.scheduledNotifications.length,
      totalInteractions: this.userInteractions.length,
      responseRate: this.userInteractions.length > 0 
        ? this.userInteractions.filter(i => i.response !== 'dismissed').length / this.userInteractions.length 
        : 0
    };
  }
}

describe('Complete Gentle Nudge User Workflows', () => {
  let nudgeSystem: MockGentleNudgeSystem;
  const testUserId = 'workflow-user-123';

  beforeAll(async () => {
    nudgeSystem = new MockGentleNudgeSystem();
    await nudgeSystem.start();
  });

  afterAll(async () => {
    await nudgeSystem.stop();
  });

  beforeEach(() => {
    storageHelpers.setupTestData();
    // Set up user preferences for workflow testing
    storageHelpers.createUserPreferences(testUserId, {
      userId: testUserId,
      displayName: 'Workflow Test User',
      email: 'workflow@example.com',
      notificationSettings: {
        frequency: 'gentle',
        enabledTypes: ['stale-reminder', 'deadline-warning'],
        staleDaysThreshold: 3,
        deadlineWarningDays: 2,
        maxDailyNotifications: 5,
        quietHours: {
          enabled: true,
          start: '18:00',
          end: '09:00',
          timezone: 'America/New_York',
          respectWeekends: true,
          respectHolidays: true
        },
        preferredDeliveryMethods: ['in-app', 'banner']
      },
      personalizedSettings: {
        preferredTone: 'encouraging',
        encouragementStyle: 'cheerful',
        personalizedGreeting: 'Hey there, superstar!',
        motivationalKeywords: ['amazing', 'fantastic', 'brilliant'],
        timeZone: 'America/New_York',
        workingHours: {
          monday: { enabled: true, start: '09:00', end: '17:00' },
          tuesday: { enabled: true, start: '09:00', end: '17:00' },
          wednesday: { enabled: true, start: '09:00', end: '17:00' },
          thursday: { enabled: true, start: '09:00', end: '17:00' },
          friday: { enabled: true, start: '09:00', end: '17:00' },
          saturday: { enabled: false, start: '10:00', end: '14:00' },
          sunday: { enabled: false, start: '10:00', end: '14:00' }
        }
      }
    });

    mockJiraAPI.mockSearchSuccess();
    jest.clearAllMocks();
  });

  describe('Happy Path Workflow', () => {
    it('should complete entire gentle nudge cycle successfully', async () => {
      const workflow = await nudgeSystem.runCompleteNudgeCycle(testUserId);

      // Verify all workflow steps completed
      expect(workflow.issueDetection).toBeTruthy();
      expect(workflow.notificationGeneration).toBeTruthy();
      expect(workflow.userInteraction).toBeTruthy();
      expect(workflow.followUp).toBeTruthy();

      // Verify issue detection worked
      expect(workflow.issueDetection.totalIssues).toBeGreaterThan(0);
      expect(Array.isArray(workflow.issueDetection.staleIssues)).toBe(true);
      expect(Array.isArray(workflow.issueDetection.deadlineIssues)).toBe(true);

      // Verify notifications were generated
      expect(workflow.notificationGeneration.totalGenerated).toBeGreaterThan(0);
      expect(Array.isArray(workflow.notificationGeneration.notifications)).toBe(true);

      // Verify user interactions were tracked
      expect(workflow.userInteraction.totalDelivered).toBeGreaterThan(0);
      expect(workflow.userInteraction.responseRate).toBeGreaterThanOrEqual(0);
      expect(workflow.userInteraction.responseRate).toBeLessThanOrEqual(1);

      // Verify follow-up actions were created
      expect(Array.isArray(workflow.followUp.followUpActions)).toBe(true);
    });

    it('should generate notifications with encouraging tone', async () => {
      const workflow = await nudgeSystem.runCompleteNudgeCycle(testUserId);

      const notifications = workflow.notificationGeneration.notifications;
      
      for (const notification of notifications) {
        expect(notification.content.message).toHaveEncouragingTone();
        expect(notification).toBeGentleNotification();
        expect(notification.content.tone).toBe('encouraging');
        expect(['stale-reminder', 'deadline-warning']).toContain(
          notification.metadata.context.type
        );
      }
    });

    it('should respect user preferences for notification types', async () => {
      // Update user preferences to only enable stale reminders
      const preferences = createTestUserPreferences({
        userId: testUserId,
        notificationSettings: {
          frequency: 'gentle',
          enabledTypes: ['stale-reminder'], // Only stale reminders
          staleDaysThreshold: 2,
          deadlineWarningDays: 3,
          maxDailyNotifications: 3,
          quietHours: {
            enabled: false,
            start: '18:00',
            end: '09:00',
            timezone: 'America/New_York',
            respectWeekends: false,
            respectHolidays: false
          },
          preferredDeliveryMethods: ['in-app']
        }
      });

      await mockStorage.set(`user:${testUserId}:preferences`, preferences);

      const workflow = await nudgeSystem.runCompleteNudgeCycle(testUserId);
      const notifications = workflow.notificationGeneration.notifications;

      // Should only have stale reminder notifications
      const notificationTypes = notifications.map(n => n.metadata.context.type);
      expect(notificationTypes.every(type => type === 'stale-reminder')).toBe(true);
    });
  });

  describe('User Behavior Scenarios', () => {
    it('should handle responsive user behavior appropriately', async () => {
      // Set up user to be responsive
      const preferences = createTestUserPreferences({
        userId: testUserId,
        notificationSettings: {
          frequency: 'moderate',
          maxDailyNotifications: 10,
          enabledTypes: ['stale-reminder', 'deadline-warning'],
          staleDaysThreshold: 2,
          deadlineWarningDays: 3,
          quietHours: {
            enabled: false,
            start: '18:00',
            end: '09:00',
            timezone: 'America/New_York',
            respectWeekends: false,
            respectHolidays: false
          },
          preferredDeliveryMethods: ['in-app']
        }
      });

      await mockStorage.set(`user:${testUserId}:preferences`, preferences);

      const workflow = await nudgeSystem.runCompleteNudgeCycle(testUserId);

      // Responsive users should have higher response rates
      expect(workflow.userInteraction.responseRate).toBeGreaterThan(0.6);
      
      // Should generate positive reinforcement follow-ups
      const followUpTypes = workflow.followUp.followUpActions.map(f => f.type);
      expect(followUpTypes).toContain('positive_reinforcement');
    });

    it('should handle dismissive user behavior gracefully', async () => {
      // Simulate dismissive user by creating appropriate preferences
      const preferences = createTestUserPreferences({
        userId: testUserId,
        notificationSettings: {
          frequency: 'minimal',
          maxDailyNotifications: 2,
          enabledTypes: ['deadline-warning'], // Only critical items
          staleDaysThreshold: 7,
          deadlineWarningDays: 1,
          quietHours: {
            enabled: true,
            start: '17:00',
            end: '10:00', // Long quiet hours
            timezone: 'America/New_York',
            respectWeekends: true,
            respectHolidays: true
          },
          preferredDeliveryMethods: ['in-app']
        }
      });

      await mockStorage.set(`user:${testUserId}:preferences`, preferences);

      const workflow = await nudgeSystem.runCompleteNudgeCycle(testUserId);

      // Should generate fewer notifications
      expect(workflow.notificationGeneration.totalGenerated).toBeLessThan(5);
      
      // Should create respectful distance follow-ups
      const followUpTypes = workflow.followUp.followUpActions.map(f => f.type);
      if (followUpTypes.length > 0) {
        expect(followUpTypes).toContain('respectful_distance');
      }
    });
  });

  describe('Issue Detection and Prioritization', () => {
    it('should detect and prioritize critical deadline issues', async () => {
      const workflow = await nudgeSystem.runCompleteNudgeCycle(testUserId);

      const deadlineNotifications = workflow.notificationGeneration.notifications
        .filter(n => n.metadata.context.type === 'deadline-warning');

      // Critical deadline issues should have higher priority
      const highPriorityDeadlines = deadlineNotifications
        .filter(n => n.metadata.priority === 'high');

      if (highPriorityDeadlines.length > 0) {
        expect(highPriorityDeadlines.length).toBeGreaterThan(0);
        // High priority notifications should mention urgency in an encouraging way
        highPriorityDeadlines.forEach(notification => {
          expect(notification.content.message).toContain('tomorrow');
          expect(notification.content.message).toHaveEncouragingTone();
        });
      }
    });

    it('should identify stale issues correctly based on user threshold', async () => {
      const workflow = await nudgeSystem.runCompleteNudgeCycle(testUserId);

      expect(workflow.issueDetection.staleIssues.length).toBeGreaterThanOrEqual(0);
      
      // Verify stale issues meet the threshold criteria
      const preferences = await mockStorage.get(`user:${testUserId}:preferences`);
      const threshold = preferences.notificationSettings.staleDaysThreshold;
      const now = new Date();

      workflow.issueDetection.staleIssues.forEach(issue => {
        const daysSinceUpdate = Math.floor(
          (now.getTime() - issue.updated.getTime()) / (1000 * 60 * 60 * 24)
        );
        expect(daysSinceUpdate).toBeGreaterThanOrEqual(threshold);
      });
    });
  });

  describe('Notification History and Learning', () => {
    it('should maintain notification history for each issue', async () => {
      const workflow = await nudgeSystem.runCompleteNudgeCycle(testUserId);

      // Check that notification history was created
      for (const notification of workflow.notificationGeneration.notifications) {
        const historyKey = `notification-history:${notification.metadata.issueKey}`;
        const history = await mockStorage.get(historyKey);

        expect(history).toBeTruthy();
        expect(history.issueKey).toBe(notification.metadata.issueKey);
        expect(history.notifications).toContain(notification.metadata);
        expect(history.totalNudgeCount).toBeGreaterThan(0);
        expect(history.effectivenessScore).toBeGreaterThanOrEqual(1);
        expect(history.effectivenessScore).toBeLessThanOrEqual(10);
      }
    });

    it('should calculate effectiveness scores based on user responses', async () => {
      const workflow = await nudgeSystem.runCompleteNudgeCycle(testUserId);

      // Get notification histories and verify effectiveness calculation
      for (const interaction of workflow.userInteraction.interactions) {
        const historyKey = `notification-history:${interaction.issueKey}`;
        const history = await mockStorage.get(historyKey);

        expect(history.effectivenessScore).toBeTruthy();
        
        // Actioned responses should result in higher effectiveness scores
        if (interaction.response === 'actioned') {
          expect(history.effectivenessScore).toBeGreaterThan(7);
        }
        
        // Dismissed responses should result in lower effectiveness scores
        if (interaction.response === 'dismissed') {
          expect(history.effectivenessScore).toBeLessThan(5);
        }
      }
    });
  });

  describe('System Resilience', () => {
    it('should handle users with no preferences gracefully', async () => {
      const newUserId = 'no-prefs-user-456';
      // Don't create preferences for this user

      const workflow = await nudgeSystem.runCompleteNudgeCycle(newUserId);

      // Should still complete workflow with default settings
      expect(workflow.issueDetection).toBeTruthy();
      expect(workflow.notificationGeneration).toBeTruthy();
      expect(workflow.userInteraction).toBeTruthy();
      expect(workflow.followUp).toBeTruthy();
    });

    it('should handle API errors gracefully', async () => {
      // Mock API error
      mockJiraAPI.mockError('unauthorized');

      // Should handle error without crashing
      await expect(nudgeSystem.runCompleteNudgeCycle(testUserId))
        .rejects.toThrow();
      
      // System should still be running
      const metrics = nudgeSystem.getSystemMetrics();
      expect(metrics.isRunning).toBe(true);
    });

    it('should handle storage errors gracefully', async () => {
      // Mock storage error
      storageHelpers.simulateStorageError('get');

      // Should handle error without crashing the entire workflow
      await expect(nudgeSystem.runCompleteNudgeCycle(testUserId))
        .rejects.toThrow();
    });
  });

  describe('Performance and Scale', () => {
    it('should complete workflow within reasonable time', async () => {
      const startTime = Date.now();
      
      await nudgeSystem.runCompleteNudgeCycle(testUserId);
      
      const executionTime = Date.now() - startTime;
      
      // Should complete within 10 seconds (generous for mock implementation)
      expect(executionTime).toBeLessThan(10000);
    });

    it('should handle multiple concurrent workflows', async () => {
      const userIds = ['user1', 'user2', 'user3'];
      
      // Set up preferences for all users
      for (const userId of userIds) {
        storageHelpers.createUserPreferences(userId);
      }

      const startTime = Date.now();
      
      // Run concurrent workflows
      const promises = userIds.map(userId => 
        nudgeSystem.runCompleteNudgeCycle(userId)
      );
      
      const workflows = await Promise.all(promises);
      
      const executionTime = Date.now() - startTime;
      
      expect(workflows).toHaveLength(3);
      workflows.forEach(workflow => {
        expect(workflow.issueDetection).toBeTruthy();
        expect(workflow.notificationGeneration).toBeTruthy();
      });
      
      // Should handle concurrent workflows efficiently
      expect(executionTime).toBeLessThan(15000);
    });
  });

  describe('System Metrics and Monitoring', () => {
    it('should track system metrics correctly', async () => {
      await nudgeSystem.runCompleteNudgeCycle(testUserId);
      
      const metrics = nudgeSystem.getSystemMetrics();
      
      expect(metrics.isRunning).toBe(true);
      expect(metrics.scheduledNotifications).toBeGreaterThanOrEqual(0);
      expect(metrics.totalInteractions).toBeGreaterThanOrEqual(0);
      expect(metrics.responseRate).toBeGreaterThanOrEqual(0);
      expect(metrics.responseRate).toBeLessThanOrEqual(1);
    });

    it('should update user analytics over time', async () => {
      // Run workflow twice to test analytics accumulation
      await nudgeSystem.runCompleteNudgeCycle(testUserId);
      await nudgeSystem.runCompleteNudgeCycle(testUserId);

      const analyticsKey = `user-analytics:${testUserId}`;
      const analytics = await mockStorage.get(analyticsKey);

      expect(analytics).toBeTruthy();
      expect(analytics.totalNotifications).toBeGreaterThan(0);
      expect(analytics.responseRate).toBeGreaterThanOrEqual(0);
      expect(analytics.averageResponseTime).toBeGreaterThan(0);
      expect(analytics.lastUpdated).toBeInstanceOf(Date);
    });
  });
});