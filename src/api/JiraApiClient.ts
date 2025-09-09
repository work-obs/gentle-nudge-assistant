/**
 * JiraApiClient - Handles Jira API integration with caching and batching
 * 
 * This client provides efficient access to Jira data by implementing:
 * - Smart caching strategies to minimize API calls
 * - Batched requests for bulk operations
 * - Rate limiting and error handling
 * - Field selection optimization
 */

import { 
  JiraIssue, 
  AnalyticsCache,
  CachedIssueData,
  BatchAnalysisRequest,
  UserPreferences,
  ProjectConfiguration 
} from '../types/analytics';

// Forge bridge import (would be available in actual Forge environment)
// import { invoke } from '@forge/bridge';

interface JiraSearchRequest {
  jql: string;
  startAt?: number;
  maxResults?: number;
  fields?: string[];
  expand?: string[];
}

interface JiraSearchResponse {
  startAt: number;
  maxResults: number;
  total: number;
  issues: JiraIssue[];
}

interface JiraApiConfig {
  batchSize: number;
  cacheTTL: {
    issues: number; // minutes
    users: number;
    projects: number;
  };
  rateLimiting: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
  retryConfig: {
    maxRetries: number;
    baseDelay: number; // milliseconds
  };
}

export class JiraApiClient {
  private cache: AnalyticsCache;
  private config: JiraApiConfig;
  private requestQueue: Array<() => Promise<any>>;
  private requestCount: { minute: number; hour: number };
  private lastRequestReset: { minute: number; hour: number };

  constructor(cache: AnalyticsCache, config?: Partial<JiraApiConfig>) {
    this.cache = cache;
    this.config = {
      batchSize: 50,
      cacheTTL: {
        issues: 15,
        users: 60,
        projects: 240
      },
      rateLimiting: {
        requestsPerMinute: 100,
        requestsPerHour: 5000
      },
      retryConfig: {
        maxRetries: 3,
        baseDelay: 1000
      },
      ...config
    };
    
    this.requestQueue = [];
    this.requestCount = { minute: 0, hour: 0 };
    this.lastRequestReset = { minute: Date.now(), hour: Date.now() };
  }

  /**
   * Fetches issues with intelligent caching and batching
   */
  async getIssues(jql: string, options: {
    useCache?: boolean;
    fields?: string[];
    maxResults?: number;
  } = {}): Promise<JiraIssue[]> {
    const { useCache = true, fields, maxResults = 100 } = options;
    
    // Check cache first if enabled
    if (useCache) {
      const cachedResults = this.getCachedIssues(jql);
      if (cachedResults.length > 0) {
        return cachedResults;
      }
    }
    
    // Prepare optimized field list
    const optimizedFields = this.getOptimizedFields(fields);
    
    // Execute search with pagination
    const allIssues: JiraIssue[] = [];
    let startAt = 0;
    const batchSize = Math.min(this.config.batchSize, maxResults);
    
    while (allIssues.length < maxResults) {
      const remainingResults = maxResults - allIssues.length;
      const currentBatchSize = Math.min(batchSize, remainingResults);
      
      const searchRequest: JiraSearchRequest = {
        jql,
        startAt,
        maxResults: currentBatchSize,
        fields: optimizedFields
      };
      
      try {
        const response = await this.executeJiraSearch(searchRequest);
        
        if (response.issues.length === 0) {
          break; // No more issues
        }
        
        allIssues.push(...response.issues);
        
        // Cache individual issues
        if (useCache) {
          response.issues.forEach(issue => this.cacheIssue(issue));
        }
        
        startAt += response.issues.length;
        
        // Break if we've got all available issues
        if (startAt >= response.total) {
          break;
        }
        
      } catch (error) {
        console.error('Failed to fetch issues batch:', error);
        break;
      }
    }
    
    return allIssues;
  }

  /**
   * Fetches a single issue with caching
   */
  async getIssue(issueKey: string, options: {
    useCache?: boolean;
    fields?: string[];
  } = {}): Promise<JiraIssue | null> {
    const { useCache = true, fields } = options;
    
    // Check cache first
    if (useCache) {
      const cached = this.cache.issues.get(issueKey);
      if (cached && cached.expiresAt > new Date()) {
        return cached.issue;
      }
    }
    
    try {
      const optimizedFields = this.getOptimizedFields(fields);
      const issue = await this.executeJiraGetIssue(issueKey, optimizedFields);
      
      if (useCache && issue) {
        this.cacheIssue(issue);
      }
      
      return issue;
    } catch (error) {
      console.error(`Failed to fetch issue ${issueKey}:`, error);
      return null;
    }
  }

  /**
   * Batch fetch issues by keys with intelligent caching
   */
  async getIssuesByKeys(issueKeys: string[], options: {
    useCache?: boolean;
    fields?: string[];
  } = {}): Promise<Map<string, JiraIssue>> {
    const { useCache = true, fields } = options;
    const results = new Map<string, JiraIssue>();
    const keysToFetch: string[] = [];
    
    // Check cache for each issue
    if (useCache) {
      for (const key of issueKeys) {
        const cached = this.cache.issues.get(key);
        if (cached && cached.expiresAt > new Date()) {
          results.set(key, cached.issue);
        } else {
          keysToFetch.push(key);
        }
      }
    } else {
      keysToFetch.push(...issueKeys);
    }
    
    // Batch fetch remaining issues
    if (keysToFetch.length > 0) {
      const jql = `key in (${keysToFetch.map(key => `"${key}"`).join(',')})`;
      const fetchedIssues = await this.getIssues(jql, { 
        useCache: false, 
        fields, 
        maxResults: keysToFetch.length 
      });
      
      fetchedIssues.forEach(issue => {
        results.set(issue.key, issue);
        if (useCache) {
          this.cacheIssue(issue);
        }
      });
    }
    
    return results;
  }

  /**
   * Fetches user assigned issues with workload context
   */
  async getUserAssignedIssues(userId: string, options: {
    includeResolved?: boolean;
    maxResults?: number;
    fields?: string[];
  } = {}): Promise<JiraIssue[]> {
    const { includeResolved = false, maxResults = 200, fields } = options;
    
    let jql = `assignee = "${userId}"`;
    if (!includeResolved) {
      jql += ' AND status not in (Done, Resolved, Closed)';
    }
    
    // Order by updated date to get most recent activity first
    jql += ' ORDER BY updated DESC';
    
    return this.getIssues(jql, { fields, maxResults });
  }

  /**
   * Fetches project issues with filtering options
   */
  async getProjectIssues(projectId: string, options: {
    statusCategories?: string[];
    priorities?: string[];
    maxResults?: number;
    fields?: string[];
  } = {}): Promise<JiraIssue[]> {
    const { statusCategories, priorities, maxResults = 500, fields } = options;
    
    let jql = `project = "${projectId}"`;
    
    if (statusCategories && statusCategories.length > 0) {
      jql += ` AND statusCategory in (${statusCategories.map(s => `"${s}"`).join(',')})`;
    }
    
    if (priorities && priorities.length > 0) {
      jql += ` AND priority in (${priorities.map(p => `"${p}"`).join(',')})`;
    }
    
    jql += ' ORDER BY priority DESC, updated ASC';
    
    return this.getIssues(jql, { fields, maxResults });
  }

  /**
   * Fetches stale issues based on update criteria
   */
  async getStaleIssues(options: {
    daysSinceUpdate: number;
    projectIds?: string[];
    priorities?: string[];
    assignees?: string[];
    maxResults?: number;
  }): Promise<JiraIssue[]> {
    const { daysSinceUpdate, projectIds, priorities, assignees, maxResults = 200 } = options;
    
    let jql = `updated < -${daysSinceUpdate}d AND status not in (Done, Resolved, Closed)`;
    
    if (projectIds && projectIds.length > 0) {
      jql += ` AND project in (${projectIds.map(id => `"${id}"`).join(',')})`;
    }
    
    if (priorities && priorities.length > 0) {
      jql += ` AND priority in (${priorities.map(p => `"${p}"`).join(',')})`;
    }
    
    if (assignees && assignees.length > 0) {
      jql += ` AND assignee in (${assignees.map(a => `"${a}"`).join(',')})`;
    }
    
    jql += ' ORDER BY updated ASC'; // Oldest first
    
    return this.getIssues(jql, { maxResults });
  }

  /**
   * Fetches issues approaching deadlines
   */
  async getIssuesNearDeadlines(options: {
    daysUntilDue: number;
    projectIds?: string[];
    priorities?: string[];
    maxResults?: number;
  }): Promise<JiraIssue[]> {
    const { daysUntilDue, projectIds, priorities, maxResults = 200 } = options;
    
    let jql = `duedate <= ${daysUntilDue}d AND status not in (Done, Resolved, Closed)`;
    
    if (projectIds && projectIds.length > 0) {
      jql += ` AND project in (${projectIds.map(id => `"${id}"`).join(',')})`;
    }
    
    if (priorities && priorities.length > 0) {
      jql += ` AND priority in (${priorities.map(p => `"${p}"`).join(',')})`;
    }
    
    jql += ' ORDER BY duedate ASC'; // Most urgent first
    
    return this.getIssues(jql, { maxResults });
  }

  /**
   * Fetches issue comments for staleness analysis
   */
  async getIssueComments(issueKey: string, options: {
    maxResults?: number;
    orderBy?: 'created' | '-created';
  } = {}): Promise<any[]> {
    const { maxResults = 50, orderBy = '-created' } = options;
    
    try {
      // In actual implementation, would use Forge bridge
      const comments = await this.executeApiRequest({
        url: `/rest/api/3/issue/${issueKey}/comment`,
        method: 'GET',
        params: {
          maxResults,
          orderBy
        }
      });
      
      return comments.comments || [];
    } catch (error) {
      console.error(`Failed to fetch comments for ${issueKey}:`, error);
      return [];
    }
  }

  /**
   * Fetches issue worklogs for activity analysis
   */
  async getIssueWorklogs(issueKey: string, options: {
    maxResults?: number;
  } = {}): Promise<any[]> {
    const { maxResults = 50 } = options;
    
    try {
      const worklogs = await this.executeApiRequest({
        url: `/rest/api/3/issue/${issueKey}/worklog`,
        method: 'GET',
        params: { maxResults }
      });
      
      return worklogs.worklogs || [];
    } catch (error) {
      console.error(`Failed to fetch worklogs for ${issueKey}:`, error);
      return [];
    }
  }

  /**
   * Caches an issue with TTL
   */
  private cacheIssue(issue: JiraIssue): void {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.config.cacheTTL.issues);
    
    this.cache.issues.set(issue.key, {
      issue,
      timestamp: new Date(),
      expiresAt
    });
  }

  /**
   * Gets cached issues matching a JQL query (simplified implementation)
   */
  private getCachedIssues(jql: string): JiraIssue[] {
    const cached: JiraIssue[] = [];
    const now = new Date();
    
    // Simplified cache lookup - in real implementation would parse JQL
    for (const [key, cachedData] of this.cache.issues.entries()) {
      if (cachedData.expiresAt > now) {
        // Simple JQL matching logic would go here
        cached.push(cachedData.issue);
      }
    }
    
    return cached;
  }

  /**
   * Gets optimized field list for API requests
   */
  private getOptimizedFields(requestedFields?: string[]): string[] {
    // Default fields needed for analytics
    const defaultFields = [
      'key', 'id', 'summary', 'description', 'status', 'priority', 
      'issuetype', 'assignee', 'reporter', 'project', 'created', 
      'updated', 'duedate', 'resolution', 'labels', 'components', 
      'fixVersions', 'customfield_10016' // Story points
    ];
    
    if (requestedFields) {
      // Merge requested fields with defaults, removing duplicates
      return [...new Set([...defaultFields, ...requestedFields])];
    }
    
    return defaultFields;
  }

  /**
   * Executes Jira search with rate limiting and error handling
   */
  private async executeJiraSearch(request: JiraSearchRequest): Promise<JiraSearchResponse> {
    await this.checkRateLimit();
    
    const searchParams = {
      url: '/rest/api/3/search',
      method: 'POST' as const,
      data: request
    };
    
    return this.executeApiRequestWithRetry(searchParams);
  }

  /**
   * Executes single issue fetch
   */
  private async executeJiraGetIssue(issueKey: string, fields: string[]): Promise<JiraIssue> {
    await this.checkRateLimit();
    
    const params = {
      url: `/rest/api/3/issue/${issueKey}`,
      method: 'GET' as const,
      params: {
        fields: fields.join(',')
      }
    };
    
    return this.executeApiRequestWithRetry(params);
  }

  /**
   * Generic API request executor with Forge bridge integration
   */
  private async executeApiRequest(params: {
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    data?: any;
    params?: any;
  }): Promise<any> {
    // In actual Forge environment, would use:
    // return await invoke('jira-api-request', params);
    
    // Mock implementation for development
    console.log(`[MOCK] API Request: ${params.method} ${params.url}`, params);
    
    // Return mock data based on URL
    if (params.url.includes('/search')) {
      return this.createMockSearchResponse();
    } else if (params.url.includes('/issue/')) {
      return this.createMockIssue();
    }
    
    return {};
  }

  /**
   * API request with retry logic
   */
  private async executeApiRequestWithRetry(params: any): Promise<any> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= this.config.retryConfig.maxRetries; attempt++) {
      try {
        return await this.executeApiRequest(params);
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on client errors (4xx)
        if (error && typeof error === 'object' && 'status' in error) {
          const status = (error as any).status;
          if (status >= 400 && status < 500) {
            throw error;
          }
        }
        
        if (attempt < this.config.retryConfig.maxRetries) {
          const delay = this.config.retryConfig.baseDelay * Math.pow(2, attempt);
          await this.sleep(delay);
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Rate limiting check
   */
  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    
    // Reset counters if needed
    if (now - this.lastRequestReset.minute > 60000) { // 1 minute
      this.requestCount.minute = 0;
      this.lastRequestReset.minute = now;
    }
    
    if (now - this.lastRequestReset.hour > 3600000) { // 1 hour
      this.requestCount.hour = 0;
      this.lastRequestReset.hour = now;
    }
    
    // Check rate limits
    if (this.requestCount.minute >= this.config.rateLimiting.requestsPerMinute) {
      const waitTime = 60000 - (now - this.lastRequestReset.minute);
      console.log(`Rate limit reached, waiting ${waitTime}ms`);
      await this.sleep(waitTime);
      return this.checkRateLimit();
    }
    
    if (this.requestCount.hour >= this.config.rateLimiting.requestsPerHour) {
      const waitTime = 3600000 - (now - this.lastRequestReset.hour);
      console.log(`Hourly rate limit reached, waiting ${waitTime}ms`);
      await this.sleep(waitTime);
      return this.checkRateLimit();
    }
    
    // Increment counters
    this.requestCount.minute++;
    this.requestCount.hour++;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Mock data creators for development
   */
  private createMockSearchResponse(): JiraSearchResponse {
    return {
      startAt: 0,
      maxResults: 50,
      total: 1,
      issues: [this.createMockIssue()]
    };
  }

  private createMockIssue(): JiraIssue {
    const now = new Date();
    const created = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000);
    const updated = new Date(created.getTime() + Math.random() * (now.getTime() - created.getTime()));
    
    return {
      id: '12345',
      key: 'TEST-123',
      fields: {
        summary: 'Sample issue for analytics testing',
        description: 'This is a sample issue used for testing the analytics system',
        status: {
          name: 'In Progress',
          statusCategory: {
            key: 'indeterminate',
            colorName: 'yellow'
          }
        },
        priority: {
          name: 'Medium',
          id: '3'
        },
        issuetype: {
          name: 'Story',
          id: '10001'
        },
        assignee: {
          accountId: 'user123',
          displayName: 'John Developer',
          emailAddress: 'john@example.com'
        },
        reporter: {
          accountId: 'reporter123',
          displayName: 'Jane Manager'
        },
        project: {
          id: '10000',
          key: 'TEST',
          name: 'Test Project'
        },
        created: created.toISOString(),
        updated: updated.toISOString(),
        duedate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        labels: ['frontend', 'urgent'],
        components: [
          { id: '10100', name: 'UI Components' }
        ],
        fixVersions: [
          { id: '10200', name: 'v2.1.0', releaseDate: '2024-12-31' }
        ],
        customfield_10016: 5, // Story points
        worklog: {
          total: 2,
          worklogs: [
            {
              id: 'worklog1',
              author: { accountId: 'user123' },
              created: updated.toISOString(),
              timeSpent: '2h',
              timeSpentSeconds: 7200
            }
          ]
        }
      }
    };
  }

  /**
   * Clears expired cache entries
   */
  clearExpiredCache(): void {
    const now = new Date();
    
    // Clear expired issues
    for (const [key, cached] of this.cache.issues.entries()) {
      if (cached.expiresAt <= now) {
        this.cache.issues.delete(key);
      }
    }
    
    // Clear expired users
    for (const [key, cached] of this.cache.users.entries()) {
      if (cached.expiresAt <= now) {
        this.cache.users.delete(key);
      }
    }
    
    // Clear expired projects
    for (const [key, cached] of this.cache.projects.entries()) {
      if (cached.expiresAt <= now) {
        this.cache.projects.delete(key);
      }
    }
  }

  /**
   * Gets cache statistics
   */
  getCacheStats(): {
    issues: { total: number; expired: number };
    users: { total: number; expired: number };
    projects: { total: number; expired: number };
  } {
    const now = new Date();
    
    const countExpired = (cache: Map<string, { expiresAt: Date }>) => {
      let expired = 0;
      for (const [, cached] of cache.entries()) {
        if (cached.expiresAt <= now) expired++;
      }
      return expired;
    };
    
    return {
      issues: {
        total: this.cache.issues.size,
        expired: countExpired(this.cache.issues as any)
      },
      users: {
        total: this.cache.users.size,
        expired: countExpired(this.cache.users as any)
      },
      projects: {
        total: this.cache.projects.size,
        expired: countExpired(this.cache.projects as any)
      }
    };
  }

  /**
   * Updates API configuration
   */
  updateConfiguration(newConfig: Partial<JiraApiConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Gets current configuration
   */
  getConfiguration(): JiraApiConfig {
    return { ...this.config };
  }
}