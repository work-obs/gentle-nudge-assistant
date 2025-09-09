/**
 * Comprehensive Jira API mocks for testing
 * Provides realistic mock responses for various Jira REST API endpoints
 */

import { JiraIssueData, NotificationType } from '@/types/notification';

// Mock Jira issue data
export const createMockJiraIssue = (overrides: Partial<JiraIssueData> = {}): JiraIssueData => ({
  key: 'GNA-123',
  summary: 'Implement user preference settings',
  status: 'In Progress',
  priority: 'Medium',
  assignee: 'john.doe@company.com',
  reporter: 'jane.smith@company.com',
  created: new Date('2024-01-10T09:00:00Z'),
  updated: new Date('2024-01-12T16:30:00Z'),
  dueDate: new Date('2024-01-20T17:00:00Z'),
  project: {
    key: 'GNA',
    name: 'Gentle Nudge Assistant'
  },
  issueType: 'Story',
  description: 'As a user, I want to customize my notification preferences so that I can receive gentle reminders in my preferred style.',
  components: ['Frontend', 'Settings'],
  labels: ['enhancement', 'user-experience'],
  ...overrides
});

// Collection of various mock issues for different test scenarios
export const mockJiraIssues = {
  staleIssue: createMockJiraIssue({
    key: 'GNA-001',
    summary: 'Fix notification timing bug',
    status: 'In Progress',
    updated: new Date('2024-01-05T10:00:00Z'), // 10 days ago
    priority: 'High'
  }),

  overdueIssue: createMockJiraIssue({
    key: 'GNA-002',
    summary: 'Add accessibility features',
    status: 'To Do',
    dueDate: new Date('2024-01-12T17:00:00Z'), // 3 days ago
    priority: 'Medium'
  }),

  urgentIssue: createMockJiraIssue({
    key: 'GNA-003',
    summary: 'Critical security patch',
    status: 'In Review',
    priority: 'Critical',
    dueDate: new Date('2024-01-16T09:00:00Z'), // Tomorrow
    updated: new Date('2024-01-15T14:00:00Z')
  }),

  completedIssue: createMockJiraIssue({
    key: 'GNA-004',
    summary: 'Improve encouraging message templates',
    status: 'Done',
    priority: 'Low',
    updated: new Date('2024-01-15T11:30:00Z')
  }),

  newIssue: createMockJiraIssue({
    key: 'GNA-005',
    summary: 'Research user feedback patterns',
    status: 'To Do',
    created: new Date('2024-01-15T08:00:00Z'),
    updated: new Date('2024-01-15T08:00:00Z'),
    priority: 'Low'
  })
};

// Mock API responses for different Jira endpoints
export const mockJiraResponses = {
  // GET /rest/api/3/search - Search for issues
  searchIssues: {
    expand: 'schema,names',
    startAt: 0,
    maxResults: 50,
    total: 5,
    issues: Object.values(mockJiraIssues).map(issue => ({
      id: `1000${Math.random().toString().substr(2, 3)}`,
      key: issue.key,
      fields: {
        summary: issue.summary,
        status: { name: issue.status },
        priority: { name: issue.priority },
        assignee: {
          accountId: 'user-123',
          displayName: 'John Doe',
          emailAddress: issue.assignee
        },
        reporter: {
          accountId: 'user-456', 
          displayName: 'Jane Smith',
          emailAddress: issue.reporter
        },
        created: issue.created.toISOString(),
        updated: issue.updated.toISOString(),
        duedate: issue.dueDate?.toISOString(),
        project: issue.project,
        issuetype: { name: issue.issueType },
        description: {
          content: [{
            content: [{
              text: issue.description,
              type: 'text'
            }],
            type: 'paragraph'
          }],
          type: 'doc',
          version: 1
        },
        components: issue.components.map(name => ({ name })),
        labels: issue.labels
      }
    }))
  },

  // GET /rest/api/3/issue/{issueKey} - Get single issue
  getIssue: (issueKey: string) => {
    const issue = Object.values(mockJiraIssues).find(i => i.key === issueKey) || mockJiraIssues.staleIssue;
    return {
      id: `1000${Math.random().toString().substr(2, 3)}`,
      key: issue.key,
      fields: {
        summary: issue.summary,
        status: { name: issue.status },
        priority: { name: issue.priority },
        assignee: {
          accountId: 'user-123',
          displayName: 'John Doe',
          emailAddress: issue.assignee
        },
        created: issue.created.toISOString(),
        updated: issue.updated.toISOString(),
        duedate: issue.dueDate?.toISOString(),
        project: issue.project,
        issuetype: { name: issue.issueType },
        description: {
          content: [{
            content: [{
              text: issue.description,
              type: 'text'
            }],
            type: 'paragraph'
          }],
          type: 'doc',
          version: 1
        }
      }
    };
  },

  // GET /rest/api/3/user/search - Search users
  searchUsers: {
    values: [
      {
        accountId: 'user-123',
        displayName: 'John Doe',
        emailAddress: 'john.doe@company.com',
        active: true
      },
      {
        accountId: 'user-456',
        displayName: 'Jane Smith', 
        emailAddress: 'jane.smith@company.com',
        active: true
      }
    ]
  },

  // GET /rest/api/3/project/{projectKey} - Get project details
  getProject: {
    id: '10000',
    key: 'GNA',
    name: 'Gentle Nudge Assistant',
    projectTypeKey: 'software',
    simplified: false,
    style: 'next-gen',
    isPrivate: false,
    lead: {
      accountId: 'user-123',
      displayName: 'John Doe'
    }
  },

  // Error responses
  errors: {
    notFound: {
      errorMessages: ['Issue does not exist or you do not have permission to see it.'],
      errors: {}
    },
    unauthorized: {
      errorMessages: ['You do not have permission to access this resource.'],
      errors: {}
    },
    rateLimited: {
      errorMessages: ['Rate limit exceeded. Try again later.'],
      errors: {}
    }
  }
};

// Mock functions for setting up API responses in tests
export const mockJiraAPI = {
  // Mock successful search response
  mockSearchSuccess: (issues = Object.values(mockJiraIssues)) => {
    const mockBridge = global.__FORGE_BRIDGE__;
    mockBridge?.requestJira.mockResolvedValueOnce({
      status: 200,
      data: {
        ...mockJiraResponses.searchIssues,
        issues: issues.map(issue => mockJiraResponses.searchIssues.issues.find(i => i.key === issue.key))
      }
    });
  },

  // Mock issue details response
  mockGetIssue: (issueKey: string) => {
    const mockBridge = global.__FORGE_BRIDGE__;
    mockBridge?.requestJira.mockResolvedValueOnce({
      status: 200,
      data: mockJiraResponses.getIssue(issueKey)
    });
  },

  // Mock API error responses
  mockError: (errorType: 'notFound' | 'unauthorized' | 'rateLimited' = 'notFound') => {
    const mockBridge = global.__FORGE_BRIDGE__;
    const statusCodes = {
      notFound: 404,
      unauthorized: 403,
      rateLimited: 429
    };
    
    mockBridge?.requestJira.mockRejectedValueOnce({
      status: statusCodes[errorType],
      data: mockJiraResponses.errors[errorType]
    });
  },

  // Mock empty search results
  mockEmptySearch: () => {
    const mockBridge = global.__FORGE_BRIDGE__;
    mockBridge?.requestJira.mockResolvedValueOnce({
      status: 200,
      data: {
        ...mockJiraResponses.searchIssues,
        total: 0,
        issues: []
      }
    });
  }
};

// Test data factories for creating test scenarios
export const createTestScenario = (scenarioType: NotificationType) => {
  const scenarios = {
    'stale-reminder': {
      issues: [mockJiraIssues.staleIssue],
      expectedNotifications: 1,
      description: 'User has stale issues that need attention'
    },
    'deadline-warning': {
      issues: [mockJiraIssues.urgentIssue, mockJiraIssues.overdueIssue],
      expectedNotifications: 2,
      description: 'User has issues approaching deadlines'
    },
    'progress-update': {
      issues: [mockJiraIssues.completedIssue],
      expectedNotifications: 1,
      description: 'User has made progress and deserves recognition'
    },
    'team-encouragement': {
      issues: Object.values(mockJiraIssues),
      expectedNotifications: 1,
      description: 'Team-wide encouragement based on overall progress'
    },
    'achievement-recognition': {
      issues: [mockJiraIssues.completedIssue],
      expectedNotifications: 1,
      description: 'Recognition for completing tasks'
    }
  };

  return scenarios[scenarioType];
};

export default mockJiraAPI;