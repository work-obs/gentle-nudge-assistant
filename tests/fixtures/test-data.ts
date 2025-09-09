/**
 * Test fixtures and sample data for comprehensive testing
 * Provides realistic data scenarios for the Gentle Nudge Assistant
 */

import { UserPreferences, TeamConfiguration } from '@/types/user';
import { NotificationHistory, JiraIssueData } from '@/types/notification';

// Sample users with different behavior patterns
export const testUsers = {
  responsive: {
    userId: 'responsive-user-123',
    displayName: 'Alice Responsive',
    email: 'alice@example.com',
    behaviorProfile: 'responsive',
    preferences: {
      notificationSettings: {
        frequency: 'moderate',
        maxDailyNotifications: 8,
        staleDaysThreshold: 2,
        deadlineWarningDays: 3,
        enabledTypes: ['stale-reminder', 'deadline-warning', 'progress-update'],
        quietHours: {
          enabled: true,
          start: '19:00',
          end: '08:00',
          timezone: 'America/New_York',
          respectWeekends: true,
          respectHolidays: true
        },
        preferredDeliveryMethods: ['in-app', 'banner']
      },
      personalizedSettings: {
        preferredTone: 'encouraging',
        encouragementStyle: 'cheerful',
        motivationalKeywords: ['amazing', 'fantastic', 'brilliant', 'outstanding'],
        timeZone: 'America/New_York'
      }
    }
  },

  selective: {
    userId: 'selective-user-456',
    displayName: 'Bob Selective',
    email: 'bob@example.com',
    behaviorProfile: 'selective',
    preferences: {
      notificationSettings: {
        frequency: 'minimal',
        maxDailyNotifications: 3,
        staleDaysThreshold: 5,
        deadlineWarningDays: 1,
        enabledTypes: ['deadline-warning'],
        quietHours: {
          enabled: true,
          start: '18:00',
          end: '10:00',
          timezone: 'Europe/London',
          respectWeekends: true,
          respectHolidays: true
        },
        preferredDeliveryMethods: ['in-app']
      },
      personalizedSettings: {
        preferredTone: 'professional',
        encouragementStyle: 'supportive',
        motivationalKeywords: ['progress', 'achievement', 'success'],
        timeZone: 'Europe/London'
      }
    }
  },

  overwhelmed: {
    userId: 'overwhelmed-user-789',
    displayName: 'Carol Busy',
    email: 'carol@example.com',
    behaviorProfile: 'overwhelmed',
    preferences: {
      notificationSettings: {
        frequency: 'gentle',
        maxDailyNotifications: 2,
        staleDaysThreshold: 7,
        deadlineWarningDays: 1,
        enabledTypes: ['deadline-warning'],
        quietHours: {
          enabled: true,
          start: '17:30',
          end: '09:30',
          timezone: 'America/Los_Angeles',
          respectWeekends: true,
          respectHolidays: true
        },
        preferredDeliveryMethods: ['in-app']
      },
      personalizedSettings: {
        preferredTone: 'encouraging',
        encouragementStyle: 'gentle',
        motivationalKeywords: ['when ready', 'no pressure', 'at your pace'],
        timeZone: 'America/Los_Angeles'
      }
    }
  }
};

// Sample Jira issues representing different scenarios
export const testIssues: Record<string, JiraIssueData> = {
  staleHighPriority: {
    key: 'PROJ-001',
    summary: 'Critical bug affecting user login',
    status: 'In Progress',
    priority: 'Critical',
    assignee: 'alice@example.com',
    reporter: 'manager@example.com',
    created: new Date('2024-01-01T09:00:00Z'),
    updated: new Date('2024-01-05T15:30:00Z'), // 10+ days old
    dueDate: new Date('2024-01-18T17:00:00Z'),
    project: {
      key: 'PROJ',
      name: 'Main Project'
    },
    issueType: 'Bug',
    description: 'Users are unable to log in due to session timeout issues.',
    components: ['Authentication', 'Frontend'],
    labels: ['urgent', 'security']
  },

  approachingDeadline: {
    key: 'PROJ-002',
    summary: 'Implement new user onboarding flow',
    status: 'To Do',
    priority: 'High',
    assignee: 'bob@example.com',
    reporter: 'product@example.com',
    created: new Date('2024-01-10T10:00:00Z'),
    updated: new Date('2024-01-14T14:00:00Z'),
    dueDate: new Date('2024-01-17T17:00:00Z'), // Due tomorrow
    project: {
      key: 'PROJ',
      name: 'Main Project'
    },
    issueType: 'Story',
    description: 'Create a smooth onboarding experience for new users.',
    components: ['Frontend', 'UX'],
    labels: ['enhancement', 'user-experience']
  },

  recentlyCompleted: {
    key: 'PROJ-003',
    summary: 'Update documentation for API endpoints',
    status: 'Done',
    priority: 'Medium',
    assignee: 'alice@example.com',
    reporter: 'dev@example.com',
    created: new Date('2024-01-12T08:00:00Z'),
    updated: new Date('2024-01-15T16:45:00Z'),
    dueDate: new Date('2024-01-20T17:00:00Z'),
    project: {
      key: 'PROJ',
      name: 'Main Project'
    },
    issueType: 'Task',
    description: 'Update API documentation to reflect recent changes.',
    components: ['Documentation'],
    labels: ['documentation', 'maintenance']
  },

  lowPriorityStale: {
    key: 'PROJ-004',
    summary: 'Optimize database query performance',
    status: 'In Progress',
    priority: 'Low',
    assignee: 'carol@example.com',
    reporter: 'admin@example.com',
    created: new Date('2023-12-15T09:00:00Z'),
    updated: new Date('2024-01-08T11:20:00Z'), // About a week old
    project: {
      key: 'PROJ',
      name: 'Main Project'
    },
    issueType: 'Improvement',
    description: 'Improve performance of slow-running database queries.',
    components: ['Backend', 'Database'],
    labels: ['performance', 'optimization']
  },

  overdueCritical: {
    key: 'PROJ-005',
    summary: 'Fix security vulnerability in payment processing',
    status: 'In Progress',
    priority: 'Critical',
    assignee: 'bob@example.com',
    reporter: 'security@example.com',
    created: new Date('2024-01-08T09:00:00Z'),
    updated: new Date('2024-01-12T13:15:00Z'),
    dueDate: new Date('2024-01-14T17:00:00Z'), // Overdue
    project: {
      key: 'PROJ',
      name: 'Main Project'
    },
    issueType: 'Bug',
    description: 'Critical security issue in payment processing that needs immediate attention.',
    components: ['Backend', 'Payment'],
    labels: ['security', 'critical', 'payment']
  }
};

// Sample notification histories with different interaction patterns
export const testNotificationHistories: Record<string, NotificationHistory> = {
  'PROJ-001': {
    issueKey: 'PROJ-001',
    notifications: [
      {
        id: 'notif-001-1',
        issueKey: 'PROJ-001',
        userId: 'responsive-user-123',
        createdAt: new Date('2024-01-13T10:00:00Z'),
        scheduledFor: new Date('2024-01-13T10:00:00Z'),
        deliveredAt: new Date('2024-01-13T10:01:00Z'),
        acknowledgedAt: new Date('2024-01-13T10:03:00Z'),
        priority: 'high',
        context: {
          type: 'stale-reminder',
          issueData: testIssues.staleHighPriority,
          userWorkload: {
            totalAssignedIssues: 5,
            overdueIssues: 0,
            staleDaysAverage: 4.2,
            recentActivityScore: 7.8,
            currentCapacityLevel: 'moderate'
          }
        }
      },
      {
        id: 'notif-001-2',
        issueKey: 'PROJ-001',
        userId: 'responsive-user-123',
        createdAt: new Date('2024-01-14T14:00:00Z'),
        scheduledFor: new Date('2024-01-14T14:00:00Z'),
        deliveredAt: new Date('2024-01-14T14:01:00Z'),
        acknowledgedAt: new Date('2024-01-14T14:02:00Z'),
        priority: 'high',
        context: {
          type: 'deadline-warning',
          issueData: testIssues.staleHighPriority,
          userWorkload: {
            totalAssignedIssues: 5,
            overdueIssues: 0,
            staleDaysAverage: 4.2,
            recentActivityScore: 7.8,
            currentCapacityLevel: 'moderate'
          }
        }
      }
    ],
    lastNudgeDate: new Date('2024-01-14T14:00:00Z'),
    totalNudgeCount: 2,
    effectivenessScore: 8.5,
    userResponsePattern: ['acknowledged', 'acknowledged']
  },

  'PROJ-002': {
    issueKey: 'PROJ-002',
    notifications: [
      {
        id: 'notif-002-1',
        issueKey: 'PROJ-002',
        userId: 'selective-user-456',
        createdAt: new Date('2024-01-15T09:00:00Z'),
        scheduledFor: new Date('2024-01-15T09:00:00Z'),
        deliveredAt: new Date('2024-01-15T09:01:00Z'),
        dismissedAt: new Date('2024-01-15T09:02:00Z'),
        priority: 'medium',
        context: {
          type: 'deadline-warning',
          issueData: testIssues.approachingDeadline,
          userWorkload: {
            totalAssignedIssues: 3,
            overdueIssues: 0,
            staleDaysAverage: 2.1,
            recentActivityScore: 9.2,
            currentCapacityLevel: 'light'
          }
        }
      }
    ],
    lastNudgeDate: new Date('2024-01-15T09:00:00Z'),
    totalNudgeCount: 1,
    effectivenessScore: 3.0,
    userResponsePattern: ['dismissed']
  }
};

// Sample team configurations
export const testTeamConfigurations: Record<string, TeamConfiguration> = {
  'PROJ': {
    projectKey: 'PROJ',
    projectName: 'Main Project',
    adminUserId: 'manager@example.com',
    teamSettings: {
      enableTeamNotifications: true,
      teamEncouragementFrequency: 'moderate',
      escalationRules: [
        {
          triggerCondition: 'overdue-critical',
          escalateAfterHours: 24,
          escalateToRoles: ['admin', 'lead'],
          notificationTemplate: 'escalation-critical-template',
          maxEscalations: 3
        },
        {
          triggerCondition: 'sla-breach-imminent',
          escalateAfterHours: 4,
          escalateToRoles: ['lead'],
          notificationTemplate: 'sla-warning-template',
          maxEscalations: 2
        }
      ],
      celebrationSettings: {
        enableAchievementRecognition: true,
        celebrateMilestones: true,
        teamWinNotifications: true,
        personalBestRecognition: true,
        celebrationFrequency: 'immediate'
      },
      burnoutPrevention: {
        enableWorkloadMonitoring: true,
        maxNotificationsPerDay: 8,
        respectQuietHours: true,
        autoReduceFrequencyOnHeavyLoad: true,
        burnoutRecoveryPeriodDays: 3
      }
    },
    memberPreferences: {
      'responsive-user-123': testUsers.responsive.preferences as any,
      'selective-user-456': testUsers.selective.preferences as any,
      'overwhelmed-user-789': testUsers.overwhelmed.preferences as any
    },
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-15T12:00:00Z')
  }
};

// Encouraging message templates for testing tone consistency
export const encouragingMessageTemplates = {
  staleReminder: [
    "Hey there! Your amazing work on {issueKey} is fantastic, and when you have a moment, it would love a quick update! ✨",
    "{issueKey} has been waiting patiently for your brilliant insights. No rush - just a gentle reminder! 🌟",
    "Your expertise is needed! {issueKey} would benefit from your wonderful attention when you're ready. 💫",
    "Just a friendly heads up - {issueKey} might appreciate some of your thoughtful care when convenient! 🤝",
    "No pressure at all! {issueKey} is simply waiting for your magic touch when you have time. 🎨"
  ],
  
  deadlineWarning: [
    "Heads up! {issueKey} is due {timeframe}, but we have total confidence you'll handle it perfectly! 💪✨",
    "Just a cheerful reminder: {issueKey} would love to be completed by its deadline. You've got this! 🚀🌟",
    "{issueKey} is approaching its deadline, but with your amazing skills, it'll be fantastic! 🎯⭐",
    "Gentle nudge: {issueKey} has a deadline coming up {timeframe}. We believe in your abilities! 🌱💪",
    "Friendly reminder that {issueKey} would appreciate your attention before {timeframe}. You're doing great! 🌈"
  ],

  achievementRecognition: [
    "Amazing work! You've been consistently updating your tickets. {issueKey} is the only one feeling a bit lonely. 🏆",
    "Fantastic progress this week! Your dedication is inspiring. Just {issueKey} looking for some love! ⭐",
    "You're absolutely crushing it! {completedCount} issues completed, with just {issueKey} waiting for attention. 🎉",
    "Incredible momentum! Your team spirit shines through. {issueKey} would love to join the completed list! 🚀",
    "Outstanding job! You're making excellent progress. {issueKey} is excited to be your next success! 🌟"
  ],

  teamEncouragement: [
    "The team is doing phenomenal work! Here are some tickets that could use attention when everyone has time: {issueList}",
    "Great collective effort, everyone! These issues are ready for the team's expertise: {issueList}",
    "Amazing teamwork! Let's keep this momentum going with these gentle reminders: {issueList}",
    "Fantastic collaboration! These tickets would benefit from the team's brilliant minds: {issueList}",
    "The project is moving beautifully! Here are opportunities for continued excellence: {issueList}"
  ]
};

// Performance test data generators
export const generateLargeTestDataset = (size: number) => {
  const issues = [];
  const users = [];
  const notifications = [];

  for (let i = 0; i < size; i++) {
    // Generate test issues
    issues.push({
      key: `PERF-${String(i).padStart(4, '0')}`,
      summary: `Performance test issue ${i}`,
      status: ['To Do', 'In Progress', 'Code Review', 'Done'][Math.floor(Math.random() * 4)],
      priority: ['Low', 'Medium', 'High', 'Critical'][Math.floor(Math.random() * 4)],
      assignee: `user-${Math.floor(Math.random() * Math.min(100, size / 10))}@example.com`,
      reporter: 'tester@example.com',
      created: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      updated: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      dueDate: Math.random() > 0.5 ? new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000) : null,
      project: { key: 'PERF', name: 'Performance Test Project' },
      issueType: ['Bug', 'Story', 'Task', 'Improvement'][Math.floor(Math.random() * 4)],
      components: ['Frontend', 'Backend', 'API', 'Database'].slice(0, Math.floor(Math.random() * 3) + 1),
      labels: ['test', 'performance', 'automated'].slice(0, Math.floor(Math.random() * 2) + 1)
    });

    // Generate test users (fewer than issues)
    if (i < size / 10) {
      users.push({
        userId: `user-${i}@example.com`,
        displayName: `Test User ${i}`,
        email: `user-${i}@example.com`,
        preferences: {
          notificationSettings: {
            frequency: ['minimal', 'gentle', 'moderate'][Math.floor(Math.random() * 3)],
            maxDailyNotifications: Math.floor(Math.random() * 10) + 1,
            staleDaysThreshold: Math.floor(Math.random() * 7) + 1,
            deadlineWarningDays: Math.floor(Math.random() * 5) + 1,
            enabledTypes: ['stale-reminder', 'deadline-warning', 'progress-update'],
            preferredDeliveryMethods: ['in-app']
          },
          personalizedSettings: {
            preferredTone: ['encouraging', 'casual', 'professional'][Math.floor(Math.random() * 3)],
            encouragementStyle: ['cheerful', 'supportive', 'gentle'][Math.floor(Math.random() * 3)],
            timeZone: 'UTC'
          }
        }
      });
    }

    // Generate notifications (more than issues)
    for (let j = 0; j < 2; j++) {
      notifications.push({
        id: `perf-notif-${i}-${j}`,
        issueKey: issues[Math.floor(Math.random() * issues.length)]?.key || `PERF-${i}`,
        userId: `user-${Math.floor(Math.random() * Math.min(100, size / 10))}@example.com`,
        notificationType: ['stale-reminder', 'deadline-warning', 'progress-update'][Math.floor(Math.random() * 3)],
        deliveredAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        responseTime: Math.random() * 5000,
        response: ['actioned', 'acknowledged', 'dismissed', 'snoozed'][Math.floor(Math.random() * 4)],
        effectivenessScore: Math.random() * 10
      });
    }
  }

  return { issues, users, notifications };
};

export default {
  testUsers,
  testIssues,
  testNotificationHistories,
  testTeamConfigurations,
  encouragingMessageTemplates,
  generateLargeTestDataset
};