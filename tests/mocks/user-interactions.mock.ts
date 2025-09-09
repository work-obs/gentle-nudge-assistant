/**
 * Mock user interactions and behaviors for testing
 * Simulates realistic user response patterns to notifications
 */

import { UserResponse } from '@/types/notification';

// Mock user behavior patterns
export type UserBehaviorProfile = 
  | 'responsive' // Quickly acknowledges and acts on notifications
  | 'selective' // Only responds to high-priority notifications
  | 'dismissive' // Often dismisses notifications without action
  | 'procrastinator' // Snoozes notifications frequently
  | 'overwhelmed'; // May not respond due to high workload

// User interaction simulation
export class MockUserInteraction {
  constructor(
    private behaviorProfile: UserBehaviorProfile = 'responsive',
    private responseDelayMs: number = 1000
  ) {}

  // Simulate user response to a notification
  async simulateResponse(notificationPriority: string, notificationType: string): Promise<UserResponse> {
    // Add realistic delay
    await new Promise(resolve => setTimeout(resolve, this.responseDelayMs));

    switch (this.behaviorProfile) {
      case 'responsive':
        return this.getResponsiveResponse(notificationPriority, notificationType);
      
      case 'selective':
        return this.getSelectiveResponse(notificationPriority, notificationType);
      
      case 'dismissive':
        return this.getDismissiveResponse(notificationPriority, notificationType);
      
      case 'procrastinator':
        return this.getProcrastinatorResponse(notificationPriority, notificationType);
      
      case 'overwhelmed':
        return this.getOverwhelmedResponse(notificationPriority, notificationType);
      
      default:
        return 'acknowledged';
    }
  }

  private getResponsiveResponse(priority: string, type: string): UserResponse {
    // Responsive users act on most notifications
    if (priority === 'urgent' || priority === 'high') {
      return 'actioned';
    }
    if (type === 'achievement-recognition') {
      return 'acknowledged';
    }
    return Math.random() > 0.3 ? 'actioned' : 'acknowledged';
  }

  private getSelectiveResponse(priority: string, type: string): UserResponse {
    // Selective users only act on high-priority items
    if (priority === 'urgent') {
      return 'actioned';
    }
    if (priority === 'high') {
      return Math.random() > 0.5 ? 'actioned' : 'acknowledged';
    }
    if (type === 'achievement-recognition') {
      return 'acknowledged';
    }
    return Math.random() > 0.7 ? 'acknowledged' : 'dismissed';
  }

  private getDismissiveResponse(priority: string, type: string): UserResponse {
    // Dismissive users often ignore notifications
    if (priority === 'urgent') {
      return Math.random() > 0.3 ? 'actioned' : 'dismissed';
    }
    if (type === 'achievement-recognition') {
      return Math.random() > 0.5 ? 'acknowledged' : 'dismissed';
    }
    return 'dismissed';
  }

  private getProcrastinatorResponse(priority: string, type: string): UserResponse {
    // Procrastinators frequently snooze
    if (priority === 'urgent') {
      return Math.random() > 0.4 ? 'actioned' : 'snoozed';
    }
    if (type === 'achievement-recognition') {
      return 'acknowledged';
    }
    return Math.random() > 0.6 ? 'snoozed' : 'dismissed';
  }

  private getOverwhelmedResponse(priority: string, type: string): UserResponse {
    // Overwhelmed users may not respond or respond slowly
    if (Math.random() > 0.7) {
      return 'dismissed'; // Too busy to deal with it
    }
    if (priority === 'urgent') {
      return 'actioned';
    }
    if (type === 'achievement-recognition') {
      return Math.random() > 0.5 ? 'acknowledged' : 'dismissed';
    }
    return Math.random() > 0.8 ? 'acknowledged' : 'dismissed';
  }
}

// Factory for creating different user behavior patterns
export const createUserBehavior = {
  responsive: () => new MockUserInteraction('responsive', 500),
  selective: () => new MockUserInteraction('selective', 2000),
  dismissive: () => new MockUserInteraction('dismissive', 100),
  procrastinator: () => new MockUserInteraction('procrastinator', 3000),
  overwhelmed: () => new MockUserInteraction('overwhelmed', 10000)
};

// Mock user interaction events for UI testing
export const mockUIInteractions = {
  // Click notification acknowledgment button
  acknowledgeNotification: jest.fn().mockResolvedValue({
    response: 'acknowledged',
    timestamp: new Date(),
    actionTaken: false
  }),

  // Click dismiss button
  dismissNotification: jest.fn().mockResolvedValue({
    response: 'dismissed',
    timestamp: new Date(),
    actionTaken: false
  }),

  // Click snooze button
  snoozeNotification: jest.fn().mockResolvedValue({
    response: 'snoozed',
    timestamp: new Date(),
    snoozeUntil: new Date(Date.now() + 3600000), // 1 hour from now
    actionTaken: false
  }),

  // Click action button (e.g., "View Issue")
  actionNotification: jest.fn().mockResolvedValue({
    response: 'actioned',
    timestamp: new Date(),
    actionTaken: true,
    actionType: 'navigate_to_issue'
  }),

  // Simulate hover over notification
  hoverNotification: jest.fn().mockResolvedValue({
    event: 'hover',
    timestamp: new Date(),
    duration: Math.random() * 5000 // Random hover duration
  }),

  // Simulate opening notification details
  expandNotification: jest.fn().mockResolvedValue({
    event: 'expand',
    timestamp: new Date(),
    expanded: true
  }),

  // Reset all interaction mocks
  resetMocks: () => {
    jest.clearAllMocks();
    Object.values(mockUIInteractions).forEach(mock => {
      if (typeof mock === 'function' && 'mockClear' in mock) {
        mock.mockClear();
      }
    });
  }
};

// Mock analytics tracking for user interactions
export const mockAnalytics = {
  // Track notification impression
  trackNotificationShown: jest.fn(),

  // Track user response
  trackUserResponse: jest.fn(),

  // Track notification effectiveness
  trackEffectiveness: jest.fn(),

  // Track user engagement patterns
  trackEngagement: jest.fn(),

  // Get mock analytics data for testing
  getMockEngagementData: () => ({
    totalNotifications: 50,
    responseRate: 0.68,
    actionRate: 0.34,
    dismissalRate: 0.32,
    averageResponseTime: 4200, // milliseconds
    preferredResponseTimes: [
      { hour: 9, responseRate: 0.85 },
      { hour: 14, responseRate: 0.72 },
      { hour: 16, responseRate: 0.59 }
    ],
    effectiveNotificationTypes: [
      { type: 'stale-reminder', effectiveness: 7.2 },
      { type: 'deadline-warning', effectiveness: 8.9 },
      { type: 'achievement-recognition', effectiveness: 9.1 }
    ]
  }),

  // Reset analytics mocks
  resetMocks: () => {
    Object.values(mockAnalytics).forEach(mock => {
      if (typeof mock === 'function' && 'mockClear' in mock) {
        mock.mockClear();
      }
    });
  }
};

// Test scenarios for different interaction patterns
export const interactionScenarios = {
  // High engagement scenario
  highEngagement: {
    profile: 'responsive',
    expectedResponseRate: 0.85,
    expectedActionRate: 0.65,
    description: 'User actively engages with most notifications'
  },

  // Moderate engagement scenario
  moderateEngagement: {
    profile: 'selective',
    expectedResponseRate: 0.55,
    expectedActionRate: 0.30,
    description: 'User selectively responds to relevant notifications'
  },

  // Low engagement scenario
  lowEngagement: {
    profile: 'dismissive',
    expectedResponseRate: 0.25,
    expectedActionRate: 0.05,
    description: 'User frequently dismisses notifications'
  },

  // Burnout scenario
  burnout: {
    profile: 'overwhelmed',
    expectedResponseRate: 0.15,
    expectedActionRate: 0.10,
    description: 'User is overwhelmed and rarely responds'
  }
};

// Helper functions for testing user interactions
export const interactionTestHelpers = {
  // Simulate a series of user interactions
  simulateInteractionSequence: async (
    interactions: Array<{
      type: 'acknowledge' | 'dismiss' | 'snooze' | 'action';
      delay?: number;
    }>
  ) => {
    const results = [];
    
    for (const interaction of interactions) {
      if (interaction.delay) {
        await new Promise(resolve => setTimeout(resolve, interaction.delay));
      }
      
      const result = await mockUIInteractions[`${interaction.type}Notification`]();
      results.push(result);
    }
    
    return results;
  },

  // Generate random interaction pattern for testing
  generateRandomInteractions: (count: number, behaviorProfile: UserBehaviorProfile) => {
    const interactions = [];
    const userBehavior = new MockUserInteraction(behaviorProfile);
    
    for (let i = 0; i < count; i++) {
      interactions.push({
        type: 'acknowledge',
        priority: Math.random() > 0.8 ? 'high' : 'medium',
        notificationType: 'stale-reminder'
      });
    }
    
    return interactions;
  },

  // Assert interaction expectations
  expectInteractionPattern: (
    interactions: any[],
    expectedPattern: {
      responseRate: number;
      actionRate: number;
      tolerance: number;
    }
  ) => {
    const totalInteractions = interactions.length;
    const responses = interactions.filter(i => i.response !== 'dismissed').length;
    const actions = interactions.filter(i => i.actionTaken).length;
    
    const actualResponseRate = responses / totalInteractions;
    const actualActionRate = actions / totalInteractions;
    
    expect(actualResponseRate).toBeCloseTo(expectedPattern.responseRate, expectedPattern.tolerance);
    expect(actualActionRate).toBeCloseTo(expectedPattern.actionRate, expectedPattern.tolerance);
  }
};

export default mockUIInteractions;