/**
 * Forge Storage mocks for testing data persistence
 * Simulates Forge's key-value storage with realistic behavior
 */

import { UserPreferences, TeamConfiguration } from '@/types/user';
import { NotificationHistory } from '@/types/notification';

// In-memory storage to simulate Forge storage behavior
class MockForgeStorage {
  private storage = new Map<string, any>();

  // Mock the get method
  get = jest.fn(async (key: string) => {
    return this.storage.get(key) || null;
  });

  // Mock the set method
  set = jest.fn(async (key: string, value: any) => {
    this.storage.set(key, value);
  });

  // Mock the delete method
  delete = jest.fn(async (key: string) => {
    const existed = this.storage.has(key);
    this.storage.delete(key);
    return existed;
  });

  // Mock the query method
  query = jest.fn(async () => {
    const results = Array.from(this.storage.entries()).map(([key, value]) => ({
      key,
      value
    }));
    
    return {
      results,
      nextCursor: null
    };
  });

  // Test helper methods
  clear() {
    this.storage.clear();
    jest.clearAllMocks();
  }

  getStorageContents() {
    return Object.fromEntries(this.storage);
  }

  seedData(data: Record<string, any>) {
    Object.entries(data).forEach(([key, value]) => {
      this.storage.set(key, value);
    });
  }
}

// Create global mock storage instance
export const mockStorage = new MockForgeStorage();

// Test data for seeding storage
export const testStorageData = {
  // User preferences
  'user:user-123:preferences': {
    userId: 'user-123',
    displayName: 'Test User',
    email: 'test@example.com',
    notificationSettings: {
      frequency: 'gentle',
      enabledTypes: ['stale-reminder', 'deadline-warning'],
      quietHours: {
        enabled: true,
        start: '18:00',
        end: '09:00',
        timezone: 'America/New_York',
        respectWeekends: true,
        respectHolidays: true
      },
      staleDaysThreshold: 3,
      deadlineWarningDays: 2,
      maxDailyNotifications: 5,
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
    },
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z')
  } as UserPreferences,

  // Notification history
  'notification-history:GNA-123': {
    issueKey: 'GNA-123',
    notifications: [
      {
        id: 'notif-1',
        issueKey: 'GNA-123',
        userId: 'user-123',
        createdAt: new Date('2024-01-14T14:00:00Z'),
        scheduledFor: new Date('2024-01-14T14:00:00Z'),
        deliveredAt: new Date('2024-01-14T14:01:00Z'),
        acknowledgedAt: new Date('2024-01-14T14:05:00Z'),
        priority: 'medium',
        context: {
          type: 'stale-reminder',
          issueData: null,
          userWorkload: null
        }
      }
    ],
    lastNudgeDate: new Date('2024-01-14T14:00:00Z'),
    totalNudgeCount: 1,
    effectivenessScore: 8.5,
    userResponsePattern: ['acknowledged']
  } as NotificationHistory,

  // Team configuration
  'team:GNA:config': {
    projectKey: 'GNA',
    projectName: 'Gentle Nudge Assistant',
    adminUserId: 'admin-123',
    teamSettings: {
      enableTeamNotifications: true,
      teamEncouragementFrequency: 'moderate',
      escalationRules: [
        {
          triggerCondition: 'overdue-critical',
          escalateAfterHours: 24,
          escalateToRoles: ['admin', 'lead'],
          notificationTemplate: 'escalation-critical',
          maxEscalations: 3
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
    memberPreferences: {},
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z')
  } as TeamConfiguration
};

// Storage helper functions for tests
export const storageHelpers = {
  // Set up common test data
  setupTestData: () => {
    mockStorage.seedData(testStorageData);
  },

  // Create user preferences for testing
  createUserPreferences: (userId: string, overrides: Partial<UserPreferences> = {}) => {
    const preferences: UserPreferences = {
      ...testStorageData['user:user-123:preferences'],
      userId,
      ...overrides
    };
    
    mockStorage.set(`user:${userId}:preferences`, preferences);
    return preferences;
  },

  // Create notification history for testing
  createNotificationHistory: (issueKey: string, overrides: Partial<NotificationHistory> = {}) => {
    const history: NotificationHistory = {
      issueKey,
      notifications: [],
      lastNudgeDate: new Date(),
      totalNudgeCount: 0,
      effectivenessScore: 5.0,
      userResponsePattern: [],
      ...overrides
    };
    
    mockStorage.set(`notification-history:${issueKey}`, history);
    return history;
  },

  // Simulate storage errors
  simulateStorageError: (operation: 'get' | 'set' | 'delete' | 'query' = 'get') => {
    const error = new Error('Storage operation failed');
    mockStorage[operation] = jest.fn().mockRejectedValue(error);
    return error;
  },

  // Assert storage operations
  expectStorageGet: (key: string, expectedValue?: any) => {
    expect(mockStorage.get).toHaveBeenCalledWith(key);
    if (expectedValue !== undefined) {
      expect(mockStorage.get).toHaveResolvedWith(expectedValue);
    }
  },

  expectStorageSet: (key: string, expectedValue: any) => {
    expect(mockStorage.set).toHaveBeenCalledWith(key, expectedValue);
  },

  expectStorageDelete: (key: string) => {
    expect(mockStorage.delete).toHaveBeenCalledWith(key);
  }
};

// Export the mock for use in tests
export default mockStorage;