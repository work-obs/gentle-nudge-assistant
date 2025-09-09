/**
 * Enhanced test utilities for Gentle Nudge Assistant
 * Provides custom render functions and testing helpers
 */

import React, { ReactElement, ReactNode } from 'react';
import { render, RenderOptions, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Test context providers
interface TestProvidersProps {
  children: ReactNode;
}

const TestProviders: React.FC<TestProvidersProps> = ({ children }) => {
  return (
    <div data-testid="test-provider">
      {children}
    </div>
  );
};

// Custom render function that includes providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: TestProviders, ...options }),
  };
};

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };

// Helper functions for testing encouraging messages
export const generateEncouragingMessage = (type: string) => {
  const templates = {
    'stale-reminder': [
      "Hey there! Your ticket {issueKey} has been waiting patiently for an update. When you have a moment, it would appreciate some attention! ✨",
      "Quick friendly reminder: {issueKey} might benefit from a status check. No rush - just keeping you in the loop! 🌟"
    ],
    'deadline-warning': [
      "Heads up! {issueKey} is due tomorrow, but we have confidence you'll handle it perfectly! 💪",
      "Gentle reminder: {issueKey} is approaching its deadline in {days} days. You've got this! 🚀"
    ],
    'achievement-recognition': [
      "Amazing work! You've been consistently updating your tickets. {issueKey} is the only one feeling a bit lonely.",
      "Great momentum this week! These tickets are ready for your expertise whenever you're available: {issueList}"
    ]
  };
  
  const typeTemplates = templates[type as keyof typeof templates] || templates['stale-reminder'];
  return typeTemplates[Math.floor(Math.random() * typeTemplates.length)];
};

// Helper to create test notification data
export const createTestNotification = (overrides = {}) => ({
  metadata: {
    id: 'test-notification-1',
    issueKey: 'TEST-123',
    userId: 'user-123',
    createdAt: new Date('2024-01-15T10:00:00Z'),
    scheduledFor: new Date('2024-01-15T14:00:00Z'),
    priority: 'medium' as const,
    context: {
      type: 'stale-reminder' as const,
      issueData: {
        key: 'TEST-123',
        summary: 'Test issue summary',
        status: 'In Progress',
        priority: 'Medium',
        assignee: 'user-123',
        reporter: 'reporter-456',
        created: new Date('2024-01-10T09:00:00Z'),
        updated: new Date('2024-01-12T16:30:00Z'),
        project: {
          key: 'TEST',
          name: 'Test Project'
        },
        issueType: 'Story',
        components: ['Frontend'],
        labels: ['enhancement']
      },
      userWorkload: {
        totalAssignedIssues: 5,
        overdueIssues: 1,
        staleDaysAverage: 3.2,
        recentActivityScore: 7.8,
        currentCapacityLevel: 'moderate' as const
      }
    }
  },
  content: {
    title: 'Gentle reminder about TEST-123',
    message: generateEncouragingMessage('stale-reminder').replace('{issueKey}', 'TEST-123'),
    tone: 'encouraging' as const,
    templateId: 'stale-reminder-v1',
    variables: {
      issueKey: 'TEST-123',
      daysSinceUpdate: 3,
      userDisplayName: 'Test User'
    }
  },
  ...overrides
});

// Helper to create test user preferences
export const createTestUserPreferences = (overrides = {}) => ({
  userId: 'user-123',
  displayName: 'Test User',
  email: 'test@example.com',
  notificationSettings: {
    frequency: 'gentle' as const,
    enabledTypes: ['stale-reminder', 'deadline-warning'] as const,
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
    preferredDeliveryMethods: ['in-app', 'banner'] as const
  },
  personalizedSettings: {
    preferredTone: 'encouraging' as const,
    encouragementStyle: 'cheerful' as const,
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
  updatedAt: new Date('2024-01-15T10:00:00Z'),
  ...overrides
});

// Helper to create test Jira issue data
export const createTestIssue = (overrides = {}) => ({
  key: 'TEST-123',
  summary: 'Test issue for gentle nudging',
  status: 'In Progress',
  priority: 'Medium',
  assignee: 'user-123',
  reporter: 'reporter-456',
  created: new Date('2024-01-10T09:00:00Z'),
  updated: new Date('2024-01-12T16:30:00Z'),
  dueDate: new Date('2024-01-20T17:00:00Z'),
  project: {
    key: 'TEST',
    name: 'Test Project'
  },
  issueType: 'Story',
  description: 'This is a test issue description for testing purposes.',
  components: ['Frontend', 'Backend'],
  labels: ['enhancement', 'user-story'],
  ...overrides
});

// Helper to wait for encouraging tone in text
export const waitForEncouragingText = async (container: HTMLElement, text: string) => {
  const { findByText } = customRender(<div>{text}</div>);
  const element = await findByText(text);
  expect(element.textContent).toHaveEncouragingTone();
  return element;
};

// Helper to simulate Forge API responses
export const mockForgeResponse = (endpoint: string, data: any) => {
  const mockBridge = global.__FORGE_BRIDGE__;
  if (mockBridge && mockBridge.requestJira) {
    mockBridge.requestJira.mockResolvedValueOnce({
      status: 200,
      data,
    });
  }
};

// Helper to simulate user interactions with gentle nudges
export const simulateGentleNudgeInteraction = async (
  user: ReturnType<typeof userEvent.setup>,
  actionType: 'acknowledge' | 'dismiss' | 'snooze' | 'action'
) => {
  const actionButtons = {
    acknowledge: 'Got it, thanks!',
    dismiss: 'Not now',
    snooze: 'Remind me later',
    action: 'View issue'
  };

  const buttonText = actionButtons[actionType];
  const button = await screen.findByRole('button', { name: buttonText });
  await user.click(button);
  
  return button;
};

// Helper to test notification timing
export const createTimingTestScenario = (scenario: 'working-hours' | 'quiet-hours' | 'weekend') => {
  const scenarios = {
    'working-hours': new Date('2024-01-15T14:00:00Z'), // Monday 2 PM
    'quiet-hours': new Date('2024-01-15T22:00:00Z'), // Monday 10 PM
    'weekend': new Date('2024-01-13T14:00:00Z') // Saturday 2 PM
  };

  return scenarios[scenario];
};