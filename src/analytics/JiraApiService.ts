/**
 * JiraApiService - Integration with Jira Cloud REST API v3
 * Handles fetching issue data, user information, and project details
 */

import { requestJira } from '@forge/bridge';
import * as _ from 'lodash';
import { differenceInDays, differenceInHours, parseISO } from 'date-fns';

import {
  JiraIssueData,
  UserWorkloadInfo,
  TeamMetrics,
  DeadlineInfo,
  ServiceResponse,
  GentleNudgeError
} from '../types';

interface JiraIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    status: {
      name: string;
      statusCategory: {
        key: string;
      };
    };
    priority: {
      name: string;
      id: string;
    };
    assignee?: {
      accountId: string;
      displayName: string;
      emailAddress: string;
    };
    reporter: {
      accountId: string;
      displayName: string;
      emailAddress: string;
    };
    created: string;
    updated: string;
    duedate?: string;
    project: {
      key: string;
      name: string;
      id: string;
    };
    issuetype: {
      name: string;
      id: string;
    };
    description?: string;
    components: Array<{
      name: string;
      id: string;
    }>;
    labels: string[];
    resolution?: {
      name: string;
    };
    resolutiondate?: string;
  };
}

interface JiraSearchResult {
  expand: string;
  startAt: number;
  maxResults: number;
  total: number;
  issues: JiraIssue[];
}

interface JiraUser {
  accountId: string;
  displayName: string;
  emailAddress: string;
  active: boolean;
  timeZone: string;
}

interface JiraProject {
  id: string;
  key: string;
  name: string;
  description?: string;
  lead: {
    accountId: string;
    displayName: string;
  };
  issueTypes: Array<{
    id: string;
    name: string;
  }>;
}

interface IssueSearchOptions {
  jql?: string;
  fields?: string[];
  expand?: string[];
  maxResults?: number;
  startAt?: number;
}

export class JiraApiService {
  private readonly DEFAULT_FIELDS = [
    'summary', 'status', 'priority', 'assignee', 'reporter', 'created',
    'updated', 'duedate', 'project', 'issuetype', 'description',
    'components', 'labels', 'resolution', 'resolutiondate'
  ];

  private readonly API_RATE_LIMIT = 1000; // ms between requests
  private lastRequestTime = 0;

  /**
   * Fetches detailed information for a specific issue
   */
  async getIssue(issueKey: string): Promise<ServiceResponse<JiraIssueData>> {
    try {
      await this.enforceRateLimit();
      
      const response = await requestJira(`/rest/api/3/issue/${issueKey}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch issue: ${response.status} ${response.statusText}`);
      }

      const issue: JiraIssue = await response.json();
      const issueData = this.transformIssueData(issue);

      return { success: true, data: issueData };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'JIRA_ISSUE_FETCH_ERROR',
          message: 'Failed to fetch issue from Jira',
          details: error.message,
          timestamp: new Date(),
          issueKey
        }
      };
    }
  }

  /**
   * Searches for issues based on JQL query
   */
  async searchIssues(options: IssueSearchOptions): Promise<ServiceResponse<JiraIssueData[]>> {
    try {
      await this.enforceRateLimit();

      const params = new URLSearchParams();
      
      if (options.jql) params.append('jql', options.jql);
      if (options.fields) params.append('fields', options.fields.join(','));
      if (options.expand) params.append('expand', options.expand.join(','));
      if (options.maxResults) params.append('maxResults', options.maxResults.toString());
      if (options.startAt) params.append('startAt', options.startAt.toString());

      const response = await requestJira(`/rest/api/3/search?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to search issues: ${response.status} ${response.statusText}`);
      }

      const searchResult: JiraSearchResult = await response.json();
      const issues = searchResult.issues.map(issue => this.transformIssueData(issue));

      return { success: true, data: issues };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'JIRA_SEARCH_ERROR',
          message: 'Failed to search issues in Jira',
          details: error.message,
          timestamp: new Date()
        }
      };
    }
  }

  /**
   * Gets all issues assigned to a specific user
   */
  async getUserAssignedIssues(accountId: string): Promise<ServiceResponse<JiraIssueData[]>> {
    const jql = `assignee = "${accountId}" AND resolution = Unresolved ORDER BY updated DESC`;
    
    return this.searchIssues({
      jql,
      fields: this.DEFAULT_FIELDS,
      maxResults: 100
    });
  }

  /**
   * Gets stale issues (not updated for specified days) for a user
   */
  async getUserStaleIssues(accountId: string, staleDays: number = 3): Promise<ServiceResponse<JiraIssueData[]>> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - staleDays);
    const cutoffString = cutoffDate.toISOString().split('T')[0]; // YYYY-MM-DD format

    const jql = `assignee = "${accountId}" AND resolution = Unresolved AND updated < "${cutoffString}" ORDER BY updated ASC`;
    
    return this.searchIssues({
      jql,
      fields: this.DEFAULT_FIELDS,
      maxResults: 50
    });
  }

  /**
   * Gets issues approaching their due date
   */
  async getUserIssuesApproachingDeadline(
    accountId: string, 
    warningDays: number = 2
  ): Promise<ServiceResponse<JiraIssueData[]>> {
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + warningDays);
    const warningString = warningDate.toISOString().split('T')[0];

    const jql = `assignee = "${accountId}" AND resolution = Unresolved AND due <= "${warningString}" AND due >= now() ORDER BY due ASC`;
    
    return this.searchIssues({
      jql,
      fields: this.DEFAULT_FIELDS,
      maxResults: 20
    });
  }

  /**
   * Calculates user workload information
   */
  async calculateUserWorkload(accountId: string): Promise<ServiceResponse<UserWorkloadInfo>> {
    try {
      // Get all assigned issues
      const assignedResult = await this.getUserAssignedIssues(accountId);
      if (!assignedResult.success || !assignedResult.data) {
        throw new Error('Failed to get assigned issues');
      }

      const issues = assignedResult.data;
      const now = new Date();

      // Calculate metrics
      const totalAssignedIssues = issues.length;
      const overdueIssues = issues.filter(issue => 
        issue.dueDate && issue.dueDate < now
      ).length;

      // Calculate average days since last update
      const daysSinceUpdate = issues.map(issue => 
        differenceInDays(now, issue.updated)
      );
      const staleDaysAverage = daysSinceUpdate.length > 0 
        ? daysSinceUpdate.reduce((sum, days) => sum + days, 0) / daysSinceUpdate.length 
        : 0;

      // Calculate recent activity score (higher is better)
      const recentActivityScore = this.calculateActivityScore(issues, now);

      // Determine capacity level
      const currentCapacityLevel = this.determineCapacityLevel(
        totalAssignedIssues,
        overdueIssues,
        staleDaysAverage
      );

      const workloadInfo: UserWorkloadInfo = {
        totalAssignedIssues,
        overdueIssues,
        staleDaysAverage,
        recentActivityScore,
        currentCapacityLevel
      };

      return { success: true, data: workloadInfo };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'WORKLOAD_CALCULATION_ERROR',
          message: 'Failed to calculate user workload',
          details: error.message,
          timestamp: new Date(),
          userId: accountId
        }
      };
    }
  }

  /**
   * Gets team metrics for a project
   */
  async getTeamMetrics(projectKey: string): Promise<ServiceResponse<TeamMetrics>> {
    try {
      // Get project information
      const projectResult = await this.getProject(projectKey);
      if (!projectResult.success || !projectResult.data) {
        throw new Error('Failed to get project information');
      }

      // Get project issues for metrics calculation
      const issuesResult = await this.searchIssues({
        jql: `project = "${projectKey}" ORDER BY updated DESC`,
        maxResults: 200
      });

      if (!issuesResult.success || !issuesResult.data) {
        throw new Error('Failed to get project issues');
      }

      const issues = issuesResult.data;
      const metrics = this.calculateTeamMetricsFromIssues(issues, projectKey);

      return { success: true, data: metrics };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'TEAM_METRICS_ERROR',
          message: 'Failed to calculate team metrics',
          details: error.message,
          timestamp: new Date()
        }
      };
    }
  }

  /**
   * Gets user information
   */
  async getUser(accountId: string): Promise<ServiceResponse<JiraUser>> {
    try {
      await this.enforceRateLimit();

      const response = await requestJira(`/rest/api/3/user?accountId=${accountId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user: ${response.status} ${response.statusText}`);
      }

      const user: JiraUser = await response.json();
      return { success: true, data: user };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'JIRA_USER_FETCH_ERROR',
          message: 'Failed to fetch user from Jira',
          details: error.message,
          timestamp: new Date(),
          userId: accountId
        }
      };
    }
  }

  /**
   * Gets project information
   */
  async getProject(projectKey: string): Promise<ServiceResponse<JiraProject>> {
    try {
      await this.enforceRateLimit();

      const response = await requestJira(`/rest/api/3/project/${projectKey}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch project: ${response.status} ${response.statusText}`);
      }

      const project: JiraProject = await response.json();
      return { success: true, data: project };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'JIRA_PROJECT_FETCH_ERROR',
          message: 'Failed to fetch project from Jira',
          details: error.message,
          timestamp: new Date()
        }
      };
    }
  }

  /**
   * Creates deadline information for an issue
   */
  createDeadlineInfo(issue: JiraIssueData): DeadlineInfo | undefined {
    if (!issue.dueDate) return undefined;

    const now = new Date();
    const daysRemaining = differenceInDays(issue.dueDate, now);
    const hoursRemaining = differenceInHours(issue.dueDate, now);
    
    return {
      dueDate: issue.dueDate,
      daysRemaining: Math.max(0, daysRemaining),
      isOverdue: issue.dueDate < now,
      slaBreachRisk: this.calculateSlaBreachRisk(hoursRemaining, issue.priority),
      bufferTime: Math.max(0, hoursRemaining)
    };
  }

  /**
   * Validates JQL query syntax
   */
  async validateJqlQuery(jql: string): Promise<ServiceResponse<boolean>> {
    try {
      await this.enforceRateLimit();

      const response = await requestJira('/rest/api/3/jql/parse', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ queries: [jql] })
      });

      if (!response.ok) {
        throw new Error(`Failed to validate JQL: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      const isValid = result.queries && result.queries[0] && result.queries[0].structure;

      return { success: true, data: !!isValid };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'JQL_VALIDATION_ERROR',
          message: 'Failed to validate JQL query',
          details: error.message,
          timestamp: new Date()
        }
      };
    }
  }

  private transformIssueData(jiraIssue: JiraIssue): JiraIssueData {
    return {
      key: jiraIssue.key,
      summary: jiraIssue.fields.summary,
      status: jiraIssue.fields.status.name,
      priority: jiraIssue.fields.priority.name,
      assignee: jiraIssue.fields.assignee?.accountId || '',
      reporter: jiraIssue.fields.reporter.accountId,
      created: parseISO(jiraIssue.fields.created),
      updated: parseISO(jiraIssue.fields.updated),
      dueDate: jiraIssue.fields.duedate ? parseISO(jiraIssue.fields.duedate) : undefined,
      project: {
        key: jiraIssue.fields.project.key,
        name: jiraIssue.fields.project.name
      },
      issueType: jiraIssue.fields.issuetype.name,
      description: jiraIssue.fields.description,
      components: jiraIssue.fields.components.map(c => c.name),
      labels: jiraIssue.fields.labels
    };
  }

  private calculateActivityScore(issues: JiraIssueData[], now: Date): number {
    if (issues.length === 0) return 0;

    // Calculate score based on recent updates
    const recentUpdates = issues.filter(issue => {
      const daysSinceUpdate = differenceInDays(now, issue.updated);
      return daysSinceUpdate <= 7; // Last 7 days
    });

    return Math.min(1, recentUpdates.length / Math.max(1, issues.length));
  }

  private determineCapacityLevel(
    totalIssues: number,
    overdueIssues: number,
    staleDaysAverage: number
  ): 'light' | 'moderate' | 'heavy' | 'overloaded' {
    // Define thresholds (these would be configurable in a real implementation)
    const LIGHT_THRESHOLD = 5;
    const MODERATE_THRESHOLD = 15;
    const HEAVY_THRESHOLD = 25;
    const OVERDUE_RATIO_THRESHOLD = 0.3;
    const STALE_DAYS_THRESHOLD = 7;

    const overdueRatio = totalIssues > 0 ? overdueIssues / totalIssues : 0;

    if (totalIssues <= LIGHT_THRESHOLD && overdueRatio < 0.1 && staleDaysAverage < 3) {
      return 'light';
    } else if (totalIssues <= MODERATE_THRESHOLD && overdueRatio < 0.2 && staleDaysAverage < 5) {
      return 'moderate';
    } else if (totalIssues <= HEAVY_THRESHOLD && overdueRatio < OVERDUE_RATIO_THRESHOLD && staleDaysAverage < STALE_DAYS_THRESHOLD) {
      return 'heavy';
    } else {
      return 'overloaded';
    }
  }

  private calculateTeamMetricsFromIssues(issues: JiraIssueData[], projectKey: string): TeamMetrics {
    const now = new Date();
    
    // Get unique assignees for team size
    const assignees = new Set(issues.map(issue => issue.assignee).filter(Boolean));
    const teamSize = assignees.size;

    // Calculate resolution time for resolved issues
    const resolvedIssues = issues.filter(issue => 
      issue.status.toLowerCase().includes('done') || 
      issue.status.toLowerCase().includes('resolved') ||
      issue.status.toLowerCase().includes('closed')
    );

    const resolutionTimes = resolvedIssues.map(issue => 
      differenceInDays(issue.updated, issue.created)
    );

    const averageResolutionTime = resolutionTimes.length > 0
      ? resolutionTimes.reduce((sum, time) => sum + time, 0) / resolutionTimes.length
      : 0;

    // Calculate team velocity (issues resolved per week)
    const lastWeekResolved = resolvedIssues.filter(issue => 
      differenceInDays(now, issue.updated) <= 7
    );
    const teamVelocity = lastWeekResolved.length;

    // Calculate completion rate
    const totalIssues = issues.length;
    const completionRate = totalIssues > 0 ? resolvedIssues.length / totalIssues : 0;

    // Simple morale calculation based on team performance
    let morale = 5; // Base neutral morale
    if (completionRate > 0.8) morale += 2;
    else if (completionRate > 0.6) morale += 1;
    else if (completionRate < 0.3) morale -= 2;

    if (averageResolutionTime < 7) morale += 1;
    else if (averageResolutionTime > 14) morale -= 1;

    morale = Math.max(1, Math.min(10, morale));

    return {
      projectKey,
      teamSize,
      averageResolutionTime,
      teamVelocity,
      morale,
      completionRate
    };
  }

  private calculateSlaBreachRisk(
    hoursRemaining: number, 
    priority: string
  ): 'none' | 'low' | 'medium' | 'high' {
    const priorityMultipliers: Record<string, number> = {
      'Highest': 0.5,
      'High': 0.7,
      'Medium': 1.0,
      'Low': 1.5,
      'Lowest': 2.0
    };

    const multiplier = priorityMultipliers[priority] || 1.0;
    const adjustedHours = hoursRemaining * multiplier;

    if (adjustedHours < 4) return 'high';
    if (adjustedHours < 12) return 'medium';
    if (adjustedHours < 24) return 'low';
    return 'none';
  }

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.API_RATE_LIMIT) {
      await new Promise(resolve => 
        setTimeout(resolve, this.API_RATE_LIMIT - timeSinceLastRequest)
      );
    }
    
    this.lastRequestTime = Date.now();
  }
}