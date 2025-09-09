/**
 * Integration tests for Jira API interactions
 * Tests real API calls with mocked responses for reliable testing
 */

import { describe, beforeEach, afterEach, it, expect, jest } from '@jest/globals';
import { mockBridge } from '../../setup/forge.setup';
import { mockJiraAPI, mockJiraIssues, mockJiraResponses } from '../../mocks/jira-api.mock';

// Mock implementation of issue fetcher service
class MockIssueFetcher {
  async fetchUserAssignedIssues(userId: string, options: any = {}) {
    const jql = `assignee = "${userId}" AND resolution = Unresolved`;
    
    try {
      const response = await mockBridge.requestJira(`/rest/api/3/search`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        params: {
          jql,
          maxResults: options.maxResults || 50,
          startAt: options.startAt || 0,
          fields: options.fields || 'summary,status,priority,assignee,created,updated,duedate,project,issuetype'
        }
      });

      return this.transformJiraResponse(response.data);
    } catch (error) {
      throw new Error(`Failed to fetch user issues: ${error}`);
    }
  }

  async fetchStaleIssues(userId: string, staleDaysThreshold: number = 3) {
    const staleDate = new Date();
    staleDate.setDate(staleDate.getDate() - staleDaysThreshold);
    
    const jql = `assignee = "${userId}" AND updated < "${staleDate.toISOString().split('T')[0]}" AND resolution = Unresolved`;

    try {
      const response = await mockBridge.requestJira(`/rest/api/3/search`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        params: { jql, maxResults: 100 }
      });

      return this.transformJiraResponse(response.data);
    } catch (error) {
      throw new Error(`Failed to fetch stale issues: ${error}`);
    }
  }

  async fetchIssuesApproachingDeadline(userId: string, warningDays: number = 2) {
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + warningDays);
    
    const jql = `assignee = "${userId}" AND due <= "${warningDate.toISOString().split('T')[0]}" AND resolution = Unresolved`;

    try {
      const response = await mockBridge.requestJira(`/rest/api/3/search`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        params: { jql, maxResults: 100 }
      });

      return this.transformJiraResponse(response.data);
    } catch (error) {
      throw new Error(`Failed to fetch issues approaching deadline: ${error}`);
    }
  }

  async fetchIssueDetails(issueKey: string) {
    try {
      const response = await mockBridge.requestJira(`/rest/api/3/issue/${issueKey}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      return this.transformSingleIssue(response.data);
    } catch (error) {
      throw new Error(`Failed to fetch issue details for ${issueKey}: ${error}`);
    }
  }

  async fetchProjectIssues(projectKey: string, options: any = {}) {
    const jql = `project = "${projectKey}" AND resolution = Unresolved`;

    try {
      const response = await mockBridge.requestJira(`/rest/api/3/search`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        params: {
          jql,
          maxResults: options.maxResults || 100,
          orderBy: options.orderBy || 'updated DESC'
        }
      });

      return this.transformJiraResponse(response.data);
    } catch (error) {
      throw new Error(`Failed to fetch project issues for ${projectKey}: ${error}`);
    }
  }

  async fetchUserWorkload(userId: string) {
    try {
      // Fetch all assigned issues
      const assignedResponse = await this.fetchUserAssignedIssues(userId);
      
      // Fetch overdue issues
      const overdueJql = `assignee = "${userId}" AND due < now() AND resolution = Unresolved`;
      const overdueResponse = await mockBridge.requestJira(`/rest/api/3/search`, {
        method: 'GET',
        params: { jql: overdueJql }
      });

      const assignedIssues = assignedResponse.issues;
      const overdueIssues = this.transformJiraResponse(overdueResponse.data).issues;

      // Calculate staleness metrics
      const now = new Date();
      const staleDays = assignedIssues.map(issue => {
        const daysDiff = Math.floor((now.getTime() - issue.updated.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff;
      });

      const staleDaysAverage = staleDays.length > 0 
        ? staleDays.reduce((a, b) => a + b, 0) / staleDays.length 
        : 0;

      // Calculate activity score based on recent updates
      const recentUpdates = assignedIssues.filter(issue => {
        const daysSinceUpdate = Math.floor((now.getTime() - issue.updated.getTime()) / (1000 * 60 * 60 * 24));
        return daysSinceUpdate <= 7; // Within last week
      });

      const recentActivityScore = Math.min(10, (recentUpdates.length / Math.max(1, assignedIssues.length)) * 10);

      // Determine capacity level
      let currentCapacityLevel: 'light' | 'moderate' | 'heavy' | 'overloaded' = 'light';
      if (assignedIssues.length > 15) currentCapacityLevel = 'overloaded';
      else if (assignedIssues.length > 10) currentCapacityLevel = 'heavy';
      else if (assignedIssues.length > 5) currentCapacityLevel = 'moderate';

      return {
        totalAssignedIssues: assignedIssues.length,
        overdueIssues: overdueIssues.length,
        staleDaysAverage,
        recentActivityScore,
        currentCapacityLevel
      };
    } catch (error) {
      throw new Error(`Failed to fetch user workload: ${error}`);
    }
  }

  private transformJiraResponse(data: any) {
    return {
      total: data.total,
      startAt: data.startAt,
      maxResults: data.maxResults,
      issues: data.issues.map((issue: any) => this.transformSingleIssue(issue))
    };
  }

  private transformSingleIssue(issue: any) {
    return {
      key: issue.key,
      summary: issue.fields.summary,
      status: issue.fields.status?.name || 'Unknown',
      priority: issue.fields.priority?.name || 'Medium',
      assignee: issue.fields.assignee?.emailAddress || 'Unassigned',
      reporter: issue.fields.reporter?.emailAddress || 'Unknown',
      created: new Date(issue.fields.created),
      updated: new Date(issue.fields.updated),
      dueDate: issue.fields.duedate ? new Date(issue.fields.duedate) : undefined,
      project: {
        key: issue.fields.project?.key || '',
        name: issue.fields.project?.name || ''
      },
      issueType: issue.fields.issuetype?.name || 'Task',
      description: this.extractDescription(issue.fields.description),
      components: issue.fields.components?.map((c: any) => c.name) || [],
      labels: issue.fields.labels || []
    };
  }

  private extractDescription(description: any): string {
    if (!description) return '';
    
    // Handle Atlassian Document Format (ADF)
    if (description.content) {
      return description.content
        .map((node: any) => {
          if (node.content) {
            return node.content
              .map((textNode: any) => textNode.text || '')
              .join('');
          }
          return '';
        })
        .join('\n');
    }
    
    return description.toString();
  }
}

describe('Jira API Integration', () => {
  let issueFetcher: MockIssueFetcher;

  beforeEach(() => {
    issueFetcher = new MockIssueFetcher();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('User Issue Fetching', () => {
    it('should fetch user assigned issues successfully', async () => {
      mockJiraAPI.mockSearchSuccess();

      const result = await issueFetcher.fetchUserAssignedIssues('user-123');

      expect(mockBridge.requestJira).toHaveBeenCalledWith('/rest/api/3/search', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        params: expect.objectContaining({
          jql: 'assignee = "user-123" AND resolution = Unresolved'
        })
      });

      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('issues');
      expect(Array.isArray(result.issues)).toBe(true);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should handle pagination parameters correctly', async () => {
      mockJiraAPI.mockSearchSuccess();

      await issueFetcher.fetchUserAssignedIssues('user-123', {
        maxResults: 25,
        startAt: 50
      });

      expect(mockBridge.requestJira).toHaveBeenCalledWith('/rest/api/3/search', 
        expect.objectContaining({
          params: expect.objectContaining({
            maxResults: 25,
            startAt: 50
          })
        })
      );
    });

    it('should handle custom field selection', async () => {
      mockJiraAPI.mockSearchSuccess();

      await issueFetcher.fetchUserAssignedIssues('user-123', {
        fields: 'summary,status,priority'
      });

      expect(mockBridge.requestJira).toHaveBeenCalledWith('/rest/api/3/search',
        expect.objectContaining({
          params: expect.objectContaining({
            fields: 'summary,status,priority'
          })
        })
      );
    });

    it('should transform Jira response to internal format', async () => {
      mockJiraAPI.mockSearchSuccess();

      const result = await issueFetcher.fetchUserAssignedIssues('user-123');
      const issue = result.issues[0];

      expect(issue).toHaveProperty('key');
      expect(issue).toHaveProperty('summary');
      expect(issue).toHaveProperty('status');
      expect(issue).toHaveProperty('priority');
      expect(issue).toHaveProperty('created');
      expect(issue).toHaveProperty('updated');
      expect(issue.created).toBeInstanceOf(Date);
      expect(issue.updated).toBeInstanceOf(Date);
    });
  });

  describe('Stale Issue Detection', () => {
    it('should fetch stale issues with correct JQL', async () => {
      mockJiraAPI.mockSearchSuccess([mockJiraIssues.staleIssue]);

      const result = await issueFetcher.fetchStaleIssues('user-123', 5);

      const expectedJqlPattern = /assignee = "user-123" AND updated < "\d{4}-\d{2}-\d{2}" AND resolution = Unresolved/;
      const actualCall = mockBridge.requestJira.mock.calls[0];
      expect(actualCall[1].params.jql).toMatch(expectedJqlPattern);

      expect(result.issues).toBeTruthy();
    });

    it('should handle different stale day thresholds', async () => {
      mockJiraAPI.mockSearchSuccess();

      await issueFetcher.fetchStaleIssues('user-123', 7);

      const call = mockBridge.requestJira.mock.calls[0];
      const jql = call[1].params.jql;
      
      // Should calculate date 7 days ago
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - 7);
      const expectedDateStr = expectedDate.toISOString().split('T')[0];
      
      expect(jql).toContain(expectedDateStr);
    });

    it('should filter stale issues correctly', async () => {
      const staleIssue = {
        ...mockJiraIssues.staleIssue,
        updated: new Date('2024-01-01T10:00:00Z') // Very old
      };
      mockJiraAPI.mockSearchSuccess([staleIssue]);

      const result = await issueFetcher.fetchStaleIssues('user-123', 3);

      expect(result.issues).toHaveLength(1);
      const issue = result.issues[0];
      expect(issue.key).toBe(staleIssue.key);
    });
  });

  describe('Deadline Monitoring', () => {
    it('should fetch issues approaching deadline', async () => {
      mockJiraAPI.mockSearchSuccess([mockJiraIssues.urgentIssue]);

      const result = await issueFetcher.fetchIssuesApproachingDeadline('user-123', 3);

      const expectedJqlPattern = /assignee = "user-123" AND due <= "\d{4}-\d{2}-\d{2}" AND resolution = Unresolved/;
      const actualCall = mockBridge.requestJira.mock.calls[0];
      expect(actualCall[1].params.jql).toMatch(expectedJqlPattern);

      expect(result.issues).toBeTruthy();
    });

    it('should calculate warning dates correctly', async () => {
      mockJiraAPI.mockSearchSuccess();

      await issueFetcher.fetchIssuesApproachingDeadline('user-123', 5);

      const call = mockBridge.requestJira.mock.calls[0];
      const jql = call[1].params.jql;
      
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + 5);
      const expectedDateStr = expectedDate.toISOString().split('T')[0];
      
      expect(jql).toContain(expectedDateStr);
    });
  });

  describe('Issue Details Fetching', () => {
    it('should fetch single issue details', async () => {
      const issueKey = 'GNA-123';
      mockJiraAPI.mockGetIssue(issueKey);

      const result = await issueFetcher.fetchIssueDetails(issueKey);

      expect(mockBridge.requestJira).toHaveBeenCalledWith(`/rest/api/3/issue/${issueKey}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      expect(result).toHaveProperty('key', issueKey);
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('status');
    });

    it('should handle missing issue gracefully', async () => {
      const issueKey = 'NONEXISTENT-123';
      mockJiraAPI.mockError('notFound');

      await expect(issueFetcher.fetchIssueDetails(issueKey))
        .rejects.toThrow(`Failed to fetch issue details for ${issueKey}`);
    });
  });

  describe('Project Issue Fetching', () => {
    it('should fetch project issues with correct JQL', async () => {
      const projectKey = 'GNA';
      mockJiraAPI.mockSearchSuccess();

      await issueFetcher.fetchProjectIssues(projectKey);

      expect(mockBridge.requestJira).toHaveBeenCalledWith('/rest/api/3/search',
        expect.objectContaining({
          params: expect.objectContaining({
            jql: `project = "${projectKey}" AND resolution = Unresolved`
          })
        })
      );
    });

    it('should handle project options correctly', async () => {
      mockJiraAPI.mockSearchSuccess();

      await issueFetcher.fetchProjectIssues('GNA', {
        maxResults: 200,
        orderBy: 'priority DESC'
      });

      expect(mockBridge.requestJira).toHaveBeenCalledWith('/rest/api/3/search',
        expect.objectContaining({
          params: expect.objectContaining({
            maxResults: 200,
            orderBy: 'priority DESC'
          })
        })
      );
    });
  });

  describe('User Workload Calculation', () => {
    it('should calculate comprehensive workload metrics', async () => {
      // Mock assigned issues response
      mockBridge.requestJira
        .mockResolvedValueOnce({
          status: 200,
          data: mockJiraResponses.searchIssues
        })
        // Mock overdue issues response
        .mockResolvedValueOnce({
          status: 200,
          data: {
            ...mockJiraResponses.searchIssues,
            total: 2,
            issues: [mockJiraResponses.searchIssues.issues[0], mockJiraResponses.searchIssues.issues[1]]
          }
        });

      const workload = await issueFetcher.fetchUserWorkload('user-123');

      expect(workload).toHaveProperty('totalAssignedIssues');
      expect(workload).toHaveProperty('overdueIssues');
      expect(workload).toHaveProperty('staleDaysAverage');
      expect(workload).toHaveProperty('recentActivityScore');
      expect(workload).toHaveProperty('currentCapacityLevel');

      expect(typeof workload.totalAssignedIssues).toBe('number');
      expect(typeof workload.staleDaysAverage).toBe('number');
      expect(workload.recentActivityScore).toBeGreaterThanOrEqual(0);
      expect(workload.recentActivityScore).toBeLessThanOrEqual(10);
      expect(['light', 'moderate', 'heavy', 'overloaded']).toContain(workload.currentCapacityLevel);
    });

    it('should determine capacity levels correctly', async () => {
      // Test different workload scenarios
      const scenarios = [
        { totalIssues: 3, expectedCapacity: 'light' },
        { totalIssues: 8, expectedCapacity: 'moderate' },
        { totalIssues: 12, expectedCapacity: 'heavy' },
        { totalIssues: 20, expectedCapacity: 'overloaded' }
      ];

      for (const scenario of scenarios) {
        const mockIssues = Array(scenario.totalIssues).fill(null).map((_, i) => ({
          ...mockJiraResponses.searchIssues.issues[0],
          key: `TEST-${i}`,
          id: `${1000 + i}`
        }));

        mockBridge.requestJira
          .mockResolvedValueOnce({
            status: 200,
            data: {
              ...mockJiraResponses.searchIssues,
              total: scenario.totalIssues,
              issues: mockIssues
            }
          })
          .mockResolvedValueOnce({
            status: 200,
            data: { ...mockJiraResponses.searchIssues, total: 0, issues: [] }
          });

        const workload = await issueFetcher.fetchUserWorkload('user-123');
        expect(workload.currentCapacityLevel).toBe(scenario.expectedCapacity);
        
        jest.clearAllMocks();
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle API authentication errors', async () => {
      mockJiraAPI.mockError('unauthorized');

      await expect(issueFetcher.fetchUserAssignedIssues('user-123'))
        .rejects.toThrow('Failed to fetch user issues');
    });

    it('should handle API rate limiting', async () => {
      mockJiraAPI.mockError('rateLimited');

      await expect(issueFetcher.fetchUserAssignedIssues('user-123'))
        .rejects.toThrow('Failed to fetch user issues');
    });

    it('should handle network errors gracefully', async () => {
      mockBridge.requestJira.mockRejectedValue(new Error('Network error'));

      await expect(issueFetcher.fetchUserAssignedIssues('user-123'))
        .rejects.toThrow('Failed to fetch user issues');
    });

    it('should handle empty search results', async () => {
      mockJiraAPI.mockEmptySearch();

      const result = await issueFetcher.fetchUserAssignedIssues('user-123');

      expect(result.total).toBe(0);
      expect(result.issues).toHaveLength(0);
    });
  });

  describe('Data Transformation', () => {
    it('should handle missing optional fields gracefully', async () => {
      const incompleteIssue = {
        key: 'INCOMPLETE-1',
        fields: {
          summary: 'Incomplete issue',
          // Missing many fields
        }
      };

      mockBridge.requestJira.mockResolvedValue({
        status: 200,
        data: {
          total: 1,
          startAt: 0,
          maxResults: 50,
          issues: [incompleteIssue]
        }
      });

      const result = await issueFetcher.fetchUserAssignedIssues('user-123');
      const issue = result.issues[0];

      expect(issue.key).toBe('INCOMPLETE-1');
      expect(issue.summary).toBe('Incomplete issue');
      expect(issue.status).toBe('Unknown');
      expect(issue.priority).toBe('Medium');
      expect(issue.assignee).toBe('Unassigned');
    });

    it('should parse Atlassian Document Format descriptions', async () => {
      const adfDescription = {
        content: [
          {
            content: [
              { text: 'This is a test ', type: 'text' },
              { text: 'description', type: 'text' }
            ],
            type: 'paragraph'
          }
        ],
        type: 'doc',
        version: 1
      };

      const issueWithAdf = {
        key: 'ADF-1',
        fields: {
          summary: 'Issue with ADF description',
          description: adfDescription
        }
      };

      mockBridge.requestJira.mockResolvedValue({
        status: 200,
        data: {
          total: 1,
          issues: [issueWithAdf]
        }
      });

      const result = await issueFetcher.fetchUserAssignedIssues('user-123');
      const issue = result.issues[0];

      expect(issue.description).toBe('This is a test description');
    });
  });
});