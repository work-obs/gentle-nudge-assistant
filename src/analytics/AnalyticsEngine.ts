/**
 * AnalyticsEngine - Main orchestrator for issue analytics and detection
 *
 * This engine coordinates all analytics components to provide comprehensive
 * issue analysis and intelligent notification decisions. It manages:
 * - Component orchestration and data flow
 * - Batch processing and performance optimization
 * - Result aggregation and ranking
 * - Configuration management across all components
 */

import {
  JiraIssue,
  IssueAnalysisResult,
  AnalyticsConfiguration,
  AnalyticsCache,
  BatchAnalysisRequest,
  BatchAnalysisResult,
  AnalysisError,
  PerformanceMetrics,
  UserPreferences,
  RecommendedAction,
} from '../types/analytics';

import { StalenessDetector } from './StalenessDetector';
import { DeadlineMonitor } from './DeadlineMonitor';
import { ContextAnalyzer } from './ContextAnalyzer';
import { UserWorkloadCalculator } from './UserWorkloadCalculator';
import { JiraApiClient } from '../api/JiraApiClient';

export class AnalyticsEngine {
  private config: AnalyticsConfiguration;
  private cache: AnalyticsCache;
  private jiraClient: JiraApiClient;

  // Component instances
  private stalenessDetector: StalenessDetector;
  private deadlineMonitor: DeadlineMonitor;
  private contextAnalyzer: ContextAnalyzer;
  private workloadCalculator: UserWorkloadCalculator;

  // Performance tracking
  private performanceMetrics: PerformanceMetrics;
  private analysisQueue: Map<string, BatchAnalysisRequest>;

  constructor(config: AnalyticsConfiguration) {
    this.config = config;
    this.cache = this.initializeCache();
    this.jiraClient = new JiraApiClient(this.cache, {
      batchSize: config.general.batchSizes.apiRequests,
      cacheTTL: {
        issues: config.general.cacheSettings.issueDataTTL,
        users: config.general.cacheSettings.userWorkloadTTL,
        projects: config.general.cacheSettings.projectDataTTL,
      },
    });

    // Initialize components
    this.stalenessDetector = new StalenessDetector(
      config.staleness,
      this.cache
    );
    this.deadlineMonitor = new DeadlineMonitor(config.deadlines, this.cache);
    this.contextAnalyzer = new ContextAnalyzer(config.context, this.cache);
    this.workloadCalculator = new UserWorkloadCalculator(
      config.workload,
      this.cache
    );

    // Initialize performance tracking
    this.performanceMetrics = this.initializePerformanceMetrics();
    this.analysisQueue = new Map();
  }

  /**
   * Analyzes a single issue comprehensively
   */
  async analyzeIssue(
    issue: JiraIssue,
    userPreferences?: UserPreferences
  ): Promise<IssueAnalysisResult> {
    const startTime = performance.now();

    try {
      // Run all analyses in parallel for efficiency
      const [staleness, deadline, context, workload] = await Promise.all([
        this.config.general.enabledComponents.staleness
          ? this.stalenessDetector.analyzeStaleness(issue)
          : Promise.resolve(this.getDefaultStalenessAnalysis()),

        this.config.general.enabledComponents.deadlines
          ? this.deadlineMonitor.analyzeDeadlines(issue)
          : Promise.resolve(this.getDefaultDeadlineAnalysis()),

        this.config.general.enabledComponents.context
          ? this.contextAnalyzer.analyzeContext(issue)
          : Promise.resolve(this.getDefaultContextAnalysis()),

        this.config.general.enabledComponents.workload && userPreferences
          ? this.workloadCalculator.analyzeWorkloadImpact(
              issue,
              userPreferences
            )
          : Promise.resolve(this.getDefaultWorkloadImpact(issue)),
      ]);

      // Calculate overall score and recommendation
      const overallScore = this.calculateOverallScore(
        staleness,
        deadline,
        context,
        workload
      );
      const recommendedAction = this.determineRecommendedAction(
        issue,
        staleness,
        deadline,
        context,
        workload,
        overallScore
      );

      const result: IssueAnalysisResult = {
        issueKey: issue.key,
        staleness,
        deadline,
        context,
        workload,
        overallScore,
        recommendedAction,
        lastAnalyzed: new Date(),
      };

      // Cache the result
      this.cacheAnalysisResult(issue.key, result);

      // Update performance metrics
      const processingTime = performance.now() - startTime;
      this.updatePerformanceMetrics(processingTime, true);

      return result;
    } catch (error) {
      const processingTime = performance.now() - startTime;
      this.updatePerformanceMetrics(processingTime, false);

      console.error(`Failed to analyze issue ${issue.key}:`, error);
      throw error;
    }
  }

  /**
   * Batch analyzes multiple issues efficiently
   */
  async batchAnalyzeIssues(
    request: BatchAnalysisRequest
  ): Promise<BatchAnalysisResult> {
    const startTime = performance.now();
    const results: IssueAnalysisResult[] = [];
    const errors: AnalysisError[] = [];

    try {
      // Fetch issues if needed
      const issues = await this.jiraClient.getIssuesByKeys(request.issueKeys);
      const userPreferencesMap = await this.getUserPreferencesMap(
        Array.from(issues.values())
      );

      // Process in batches for memory management
      const batchSize = this.config.general.batchSizes.issueAnalysis;
      const issueArray = Array.from(issues.values());

      for (let i = 0; i < issueArray.length; i += batchSize) {
        const batch = issueArray.slice(i, i + batchSize);

        // Run batch analysis based on type
        switch (request.analysisType) {
          case 'full':
            const fullResults = await this.runFullBatchAnalysis(
              batch,
              userPreferencesMap
            );
            results.push(...fullResults.results);
            errors.push(...fullResults.errors);
            break;

          case 'staleness_only':
            const stalenessResults = await this.runStalenessOnlyAnalysis(batch);
            results.push(...stalenessResults.results);
            errors.push(...stalenessResults.errors);
            break;

          case 'deadlines_only':
            const deadlineResults = await this.runDeadlinesOnlyAnalysis(batch);
            results.push(...deadlineResults.results);
            errors.push(...deadlineResults.errors);
            break;

          case 'workload_only':
            const workloadResults = await this.runWorkloadOnlyAnalysis(
              batch,
              userPreferencesMap
            );
            results.push(...workloadResults.results);
            errors.push(...workloadResults.errors);
            break;
        }
      }

      const processingTime = performance.now() - startTime;

      return {
        requestId: request.requestId,
        results,
        errors,
        processingTime,
        timestamp: new Date(),
      };
    } catch (error) {
      const processingTime = performance.now() - startTime;

      return {
        requestId: request.requestId,
        results,
        errors: [
          {
            component: 'api',
            error: error instanceof Error ? error.message : 'Unknown error',
            severity: 'critical',
          },
        ],
        processingTime,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Finds issues that need attention based on configured criteria
   */
  async findIssuesNeedingAttention(
    options: {
      projectIds?: string[];
      assignees?: string[];
      maxResults?: number;
      analysisTypes?: Array<'staleness' | 'deadlines' | 'context' | 'workload'>;
    } = {}
  ): Promise<{
    highPriority: IssueAnalysisResult[];
    medium: IssueAnalysisResult[];
    upcoming: IssueAnalysisResult[];
    insights: {
      totalAnalyzed: number;
      averageScore: number;
      criticalCount: number;
      recommendations: string[];
    };
  }> {
    const {
      projectIds,
      assignees,
      maxResults = 500,
      analysisTypes = ['staleness', 'deadlines'],
    } = options;

    // Build JQL for fetching relevant issues
    let jql = 'status not in (Done, Resolved, Closed)';

    if (projectIds && projectIds.length > 0) {
      jql += ` AND project in (${projectIds.map(id => `"${id}"`).join(',')})`;
    }

    if (assignees && assignees.length > 0) {
      jql += ` AND assignee in (${assignees.map(a => `"${a}"`).join(',')})`;
    }

    jql += ' ORDER BY updated ASC, priority DESC';

    // Fetch and analyze issues
    const issues = await this.jiraClient.getIssues(jql, { maxResults });
    const userPreferencesMap = await this.getUserPreferencesMap(issues);

    // Analyze all issues
    const analysisPromises = issues.map(issue => {
      const userPrefs = issue.fields.assignee
        ? userPreferencesMap.get(issue.fields.assignee.accountId)
        : undefined;
      return this.analyzeIssue(issue, userPrefs).catch(error => {
        console.warn(`Failed to analyze ${issue.key}:`, error);
        return null;
      });
    });

    const analyses = (await Promise.all(analysisPromises)).filter(
      Boolean
    ) as IssueAnalysisResult[];

    // Categorize results
    const highPriority: IssueAnalysisResult[] = [];
    const medium: IssueAnalysisResult[] = [];
    const upcoming: IssueAnalysisResult[] = [];

    analyses.forEach(analysis => {
      if (
        analysis.overallScore >= 0.8 ||
        analysis.recommendedAction.urgency === 'critical'
      ) {
        highPriority.push(analysis);
      } else if (
        analysis.overallScore >= 0.6 ||
        analysis.recommendedAction.urgency === 'high'
      ) {
        medium.push(analysis);
      } else if (analysis.overallScore >= 0.4) {
        upcoming.push(analysis);
      }
    });

    // Generate insights
    const insights = this.generateInsights(analyses);

    return {
      highPriority: this.sortAnalysesByScore(highPriority),
      medium: this.sortAnalysesByScore(medium),
      upcoming: this.sortAnalysesByScore(upcoming),
      insights,
    };
  }

  /**
   * Gets comprehensive analytics for a project
   */
  async getProjectAnalytics(projectId: string): Promise<{
    overview: {
      totalIssues: number;
      staleIssues: number;
      overdueIssues: number;
      highPriorityIssues: number;
    };
    trends: {
      stalenessDistribution: Record<string, number>;
      urgencyDistribution: Record<string, number>;
      workloadDistribution: Record<string, number>;
    };
    recommendations: string[];
    teamInsights: {
      overloadedUsers: string[];
      underutilizedUsers: string[];
      collaborationScore: number;
    };
  }> {
    const issues = await this.jiraClient.getProjectIssues(projectId, {
      maxResults: 1000,
    });
    const userPreferencesMap = await this.getUserPreferencesMap(issues);

    // Analyze all project issues
    const analysisPromises = issues.map(issue => {
      const userPrefs = issue.fields.assignee
        ? userPreferencesMap.get(issue.fields.assignee.accountId)
        : undefined;
      return this.analyzeIssue(issue, userPrefs).catch(() => null);
    });

    const analyses = (await Promise.all(analysisPromises)).filter(
      Boolean
    ) as IssueAnalysisResult[];

    // Calculate overview metrics
    const overview = {
      totalIssues: analyses.length,
      staleIssues: analyses.filter(a => a.staleness.isStale).length,
      overdueIssues: analyses.filter(
        a =>
          a.deadline.daysUntilDue !== undefined && a.deadline.daysUntilDue < 0
      ).length,
      highPriorityIssues: analyses.filter(a => a.context.priorityScore > 0.7)
        .length,
    };

    // Calculate trends
    const trends = this.calculateProjectTrends(analyses);

    // Generate recommendations
    const recommendations = this.generateProjectRecommendations(
      analyses,
      overview
    );

    // Team insights
    const teamInsights = await this.generateTeamInsights(projectId, analyses);

    return { overview, trends, recommendations, teamInsights };
  }

  // Helper methods for batch analysis

  private async runFullBatchAnalysis(
    issues: JiraIssue[],
    userPreferencesMap: Map<string, UserPreferences>
  ): Promise<{ results: IssueAnalysisResult[]; errors: AnalysisError[] }> {
    const results: IssueAnalysisResult[] = [];
    const errors: AnalysisError[] = [];

    for (const issue of issues) {
      try {
        const userPrefs = issue.fields.assignee
          ? userPreferencesMap.get(issue.fields.assignee.accountId)
          : undefined;
        const result = await this.analyzeIssue(issue, userPrefs);
        results.push(result);
      } catch (error) {
        errors.push({
          issueKey: issue.key,
          component: 'api',
          error: error instanceof Error ? error.message : 'Unknown error',
          severity: 'error',
        });
      }
    }

    return { results, errors };
  }

  private async runStalenessOnlyAnalysis(
    issues: JiraIssue[]
  ): Promise<{ results: IssueAnalysisResult[]; errors: AnalysisError[] }> {
    const results: IssueAnalysisResult[] = [];
    const errors: AnalysisError[] = [];

    try {
      const stalenessResults =
        await this.stalenessDetector.batchAnalyzeStaleness(issues);

      for (const issue of issues) {
        const staleness = stalenessResults.get(issue.key);
        if (staleness) {
          const result: IssueAnalysisResult = {
            issueKey: issue.key,
            staleness,
            deadline: this.getDefaultDeadlineAnalysis(),
            context: this.getDefaultContextAnalysis(),
            workload: this.getDefaultWorkloadImpact(issue),
            overallScore: staleness.isStale ? 0.8 : 0.3,
            recommendedAction: {
              actionType: staleness.isStale ? 'gentle_reminder' : 'no_action',
              urgency: staleness.staleness === 'very_stale' ? 'high' : 'medium',
              message: `Issue has been ${staleness.staleness} for ${staleness.daysSinceLastUpdate} days`,
              suggestedActions: ['Review and update status'],
              timing: { immediate: staleness.isStale },
            },
            lastAnalyzed: new Date(),
          };
          results.push(result);
        }
      }
    } catch (error) {
      errors.push({
        component: 'staleness',
        error:
          error instanceof Error ? error.message : 'Staleness analysis failed',
        severity: 'error',
      });
    }

    return { results, errors };
  }

  private async runDeadlinesOnlyAnalysis(
    issues: JiraIssue[]
  ): Promise<{ results: IssueAnalysisResult[]; errors: AnalysisError[] }> {
    const results: IssueAnalysisResult[] = [];
    const errors: AnalysisError[] = [];

    try {
      const deadlineResults =
        await this.deadlineMonitor.batchAnalyzeDeadlines(issues);

      for (const issue of issues) {
        const deadline = deadlineResults.get(issue.key);
        if (deadline) {
          const result: IssueAnalysisResult = {
            issueKey: issue.key,
            staleness: this.getDefaultStalenessAnalysis(),
            deadline,
            context: this.getDefaultContextAnalysis(),
            workload: this.getDefaultWorkloadImpact(issue),
            overallScore:
              deadline.urgency === 'critical'
                ? 0.9
                : deadline.urgency === 'high'
                  ? 0.7
                  : 0.4,
            recommendedAction: {
              actionType:
                deadline.urgency === 'critical'
                  ? 'priority_alert'
                  : 'deadline_notification',
              urgency: deadline.urgency,
              message: deadline.hasDueDate
                ? `Due in ${deadline.daysUntilDue} days`
                : 'Approaching deadline',
              suggestedActions: ['Review timeline', 'Update progress'],
              timing: { immediate: deadline.urgency === 'critical' },
            },
            lastAnalyzed: new Date(),
          };
          results.push(result);
        }
      }
    } catch (error) {
      errors.push({
        component: 'deadline',
        error:
          error instanceof Error ? error.message : 'Deadline analysis failed',
        severity: 'error',
      });
    }

    return { results, errors };
  }

  private async runWorkloadOnlyAnalysis(
    issues: JiraIssue[],
    userPreferencesMap: Map<string, UserPreferences>
  ): Promise<{ results: IssueAnalysisResult[]; errors: AnalysisError[] }> {
    const results: IssueAnalysisResult[] = [];
    const errors: AnalysisError[] = [];

    try {
      const workloadResults =
        await this.workloadCalculator.batchAnalyzeWorkloadImpact(
          issues,
          userPreferencesMap
        );

      for (const issue of issues) {
        const workload = workloadResults.get(issue.key);
        if (workload) {
          const result: IssueAnalysisResult = {
            issueKey: issue.key,
            staleness: this.getDefaultStalenessAnalysis(),
            deadline: this.getDefaultDeadlineAnalysis(),
            context: this.getDefaultContextAnalysis(),
            workload,
            overallScore: workload.shouldNotify ? 0.6 : 0.2,
            recommendedAction: {
              actionType: workload.shouldNotify
                ? 'workload_suggestion'
                : 'no_action',
              urgency: 'low',
              message: workload.notificationReason,
              suggestedActions: workload.shouldNotify
                ? ['Consider gentle reminder']
                : ['No action needed'],
              timing: {
                immediate: false,
                scheduledTime: workload.optimalNotificationTime,
              },
            },
            lastAnalyzed: new Date(),
          };
          results.push(result);
        }
      }
    } catch (error) {
      errors.push({
        component: 'workload',
        error:
          error instanceof Error ? error.message : 'Workload analysis failed',
        severity: 'error',
      });
    }

    return { results, errors };
  }

  // Scoring and recommendation methods

  private calculateOverallScore(
    staleness: any,
    deadline: any,
    context: any,
    workload: any
  ): number {
    let score = 0;
    let totalWeight = 0;

    // Staleness contribution (weight: 0.3)
    if (this.config.general.enabledComponents.staleness) {
      const stalenessScore = staleness.isStale
        ? staleness.staleness === 'abandoned'
          ? 1.0
          : 0.7
        : 0.2;
      score += stalenessScore * 0.3;
      totalWeight += 0.3;
    }

    // Deadline contribution (weight: 0.4)
    if (this.config.general.enabledComponents.deadlines) {
      const deadlineScore =
        deadline.urgency === 'critical'
          ? 1.0
          : deadline.urgency === 'high'
            ? 0.8
            : deadline.urgency === 'medium'
              ? 0.5
              : 0.2;
      score += deadlineScore * 0.4;
      totalWeight += 0.4;
    }

    // Context contribution (weight: 0.2)
    if (this.config.general.enabledComponents.context) {
      const contextScore =
        (context.priorityScore +
          context.typeScore +
          context.projectImportance) /
        3;
      score += contextScore * 0.2;
      totalWeight += 0.2;
    }

    // Workload contribution (weight: 0.1)
    if (this.config.general.enabledComponents.workload) {
      const workloadScore = workload.shouldNotify ? 0.6 : 0.3;
      score += workloadScore * 0.1;
      totalWeight += 0.1;
    }

    return totalWeight > 0 ? score / totalWeight : 0;
  }

  private determineRecommendedAction(
    issue: JiraIssue,
    staleness: any,
    deadline: any,
    context: any,
    workload: any,
    overallScore: number
  ): RecommendedAction {
    // Determine action type and urgency
    let actionType: RecommendedAction['actionType'] = 'no_action';
    let urgency: RecommendedAction['urgency'] = 'low';
    let suggestedActions: string[] = [];

    // Priority-based decisions
    if (deadline.urgency === 'critical' || overallScore >= 0.9) {
      actionType = 'priority_alert';
      urgency = 'critical';
      suggestedActions = [
        'Immediate attention required',
        'Review and prioritize',
        'Consider escalation',
      ];
    } else if (deadline.urgency === 'high' || overallScore >= 0.7) {
      actionType = 'deadline_notification';
      urgency = 'high';
      suggestedActions = [
        'Review progress',
        'Update status',
        'Check dependencies',
      ];
    } else if (staleness.isStale && workload.shouldNotify) {
      actionType = 'gentle_reminder';
      urgency = 'medium';
      suggestedActions = ['Quick status update', 'Review and comment'];
    } else if (workload.shouldNotify && overallScore >= 0.4) {
      actionType = 'workload_suggestion';
      urgency = 'low';
      suggestedActions = [
        'Consider when convenient',
        'Review in next planning session',
      ];
    }

    // Generate message
    const message = this.generateActionMessage(
      issue,
      staleness,
      deadline,
      actionType,
      urgency
    );

    // Determine timing
    const timing = {
      immediate: urgency === 'critical' || urgency === 'high',
      scheduledTime:
        urgency === 'low' ? workload.optimalNotificationTime : undefined,
      delayReason: !workload.shouldNotify
        ? workload.notificationReason
        : undefined,
    };

    return {
      actionType,
      urgency,
      message,
      suggestedActions,
      timing,
    };
  }

  private generateActionMessage(
    issue: JiraIssue,
    staleness: any,
    deadline: any,
    actionType: RecommendedAction['actionType'],
    urgency: RecommendedAction['urgency']
  ): string {
    const issueKey = issue.key;
    const summary = issue.fields.summary;

    switch (actionType) {
      case 'priority_alert':
        return `🚨 ${issueKey}: "${summary}" requires immediate attention! ${deadline.hasDueDate ? `Due ${deadline.daysUntilDue > 0 ? `in ${deadline.daysUntilDue} days` : 'now'}` : ''}`;

      case 'deadline_notification':
        return `⏰ ${issueKey}: "${summary}" is approaching its deadline. ${deadline.hasDueDate ? `Due in ${deadline.daysUntilDue} days` : 'Timeline needs review'}.`;

      case 'gentle_reminder':
        return `🌟 ${issueKey}: "${summary}" could use a quick check-in. It's been ${staleness.daysSinceLastUpdate} days since the last update.`;

      case 'workload_suggestion':
        return `💡 ${issueKey}: "${summary}" might benefit from your attention when you have a moment.`;

      default:
        return `${issueKey}: No immediate action needed.`;
    }
  }

  // Utility methods

  private async getUserPreferencesMap(
    issues: JiraIssue[]
  ): Promise<Map<string, UserPreferences>> {
    const userIds = new Set<string>();
    issues.forEach(issue => {
      if (issue.fields.assignee) {
        userIds.add(issue.fields.assignee.accountId);
      }
    });

    const preferencesMap = new Map<string, UserPreferences>();

    // In real implementation, would fetch from storage/database
    // For now, create default preferences
    for (const userId of userIds) {
      preferencesMap.set(userId, {
        userId,
        notificationFrequency: 'moderate',
        quietHours: { start: '18:00', end: '09:00', timezone: 'UTC' },
        preferredTone: 'encouraging',
        staleDaysThreshold: 7,
        deadlineWarningDays: 3,
        enabledNotificationTypes: ['stale_reminder', 'deadline_warning'],
      });
    }

    return preferencesMap;
  }

  private sortAnalysesByScore(
    analyses: IssueAnalysisResult[]
  ): IssueAnalysisResult[] {
    return analyses.sort((a, b) => b.overallScore - a.overallScore);
  }

  private generateInsights(analyses: IssueAnalysisResult[]): {
    totalAnalyzed: number;
    averageScore: number;
    criticalCount: number;
    recommendations: string[];
  } {
    const totalAnalyzed = analyses.length;
    const averageScore =
      analyses.reduce((sum, a) => sum + a.overallScore, 0) / totalAnalyzed;
    const criticalCount = analyses.filter(
      a => a.recommendedAction.urgency === 'critical'
    ).length;

    const recommendations: string[] = [];

    if (criticalCount > 0) {
      recommendations.push(`${criticalCount} issues need immediate attention`);
    }

    const staleCount = analyses.filter(a => a.staleness.isStale).length;
    if (staleCount > totalAnalyzed * 0.3) {
      recommendations.push(
        'High number of stale issues detected - consider team review'
      );
    }

    const overdueCount = analyses.filter(
      a => a.deadline.daysUntilDue !== undefined && a.deadline.daysUntilDue < 0
    ).length;
    if (overdueCount > 0) {
      recommendations.push(
        `${overdueCount} overdue issues need timeline review`
      );
    }

    return { totalAnalyzed, averageScore, criticalCount, recommendations };
  }

  private calculateProjectTrends(analyses: IssueAnalysisResult[]): {
    stalenessDistribution: Record<string, number>;
    urgencyDistribution: Record<string, number>;
    workloadDistribution: Record<string, number>;
  } {
    const stalenessDistribution: Record<string, number> = {};
    const urgencyDistribution: Record<string, number> = {};
    const workloadDistribution: Record<string, number> = {};

    analyses.forEach(analysis => {
      // Staleness distribution
      const staleness = analysis.staleness.staleness;
      stalenessDistribution[staleness] =
        (stalenessDistribution[staleness] || 0) + 1;

      // Urgency distribution
      const urgency = analysis.recommendedAction.urgency;
      urgencyDistribution[urgency] = (urgencyDistribution[urgency] || 0) + 1;

      // Workload distribution
      const capacity = analysis.workload.assigneeWorkload.workloadCapacity;
      workloadDistribution[capacity] =
        (workloadDistribution[capacity] || 0) + 1;
    });

    return { stalenessDistribution, urgencyDistribution, workloadDistribution };
  }

  private generateProjectRecommendations(
    analyses: IssueAnalysisResult[],
    overview: any
  ): string[] {
    const recommendations: string[] = [];

    if (overview.staleIssues / overview.totalIssues > 0.4) {
      recommendations.push(
        'Consider implementing regular issue review sessions'
      );
    }

    if (overview.overdueIssues > 0) {
      recommendations.push('Review project timelines and resource allocation');
    }

    if (overview.highPriorityIssues / overview.totalIssues > 0.3) {
      recommendations.push(
        'High concentration of priority issues - consider sprint planning review'
      );
    }

    return recommendations;
  }

  private async generateTeamInsights(
    projectId: string,
    analyses: IssueAnalysisResult[]
  ): Promise<{
    overloadedUsers: string[];
    underutilizedUsers: string[];
    collaborationScore: number;
  }> {
    // In real implementation, would analyze team workload distribution
    return {
      overloadedUsers: [],
      underutilizedUsers: [],
      collaborationScore: 0.75,
    };
  }

  // Default value generators

  private getDefaultStalenessAnalysis(): any {
    return {
      daysSinceLastUpdate: 0,
      daysSinceLastComment: 0,
      daysSinceLastWorklog: 0,
      activityPattern: {
        weekdayActivity: [],
        hourlyActivity: [],
        activityTrend: 'stable',
        seasonalFactors: {},
      },
      isStale: false,
      staleness: 'fresh',
      confidence: 0.5,
      factors: {},
    };
  }

  private getDefaultDeadlineAnalysis(): any {
    return {
      hasDueDate: false,
      hasFixVersion: false,
      urgency: 'low',
      slaStatus: { hasSLA: false, slaHealth: 'safe' },
    };
  }

  private getDefaultContextAnalysis(): any {
    return {
      priorityScore: 0.5,
      typeScore: 0.5,
      projectImportance: 0.5,
      businessImpact: {},
      technicalComplexity: {},
      stakeholderVisibility: {},
      contextualFactors: {},
    };
  }

  private getDefaultWorkloadImpact(issue: JiraIssue): any {
    return {
      assigneeWorkload: {
        userId: issue.fields.assignee?.accountId || 'unassigned',
        currentOpenIssues: 0,
        recentlyCompletedIssues: 0,
        averageResolutionTime: 0,
        workloadCapacity: 'optimal',
        stressIndicators: { overallStressLevel: 'low' },
        preferredWorkingHours: { start: 9, end: 17, timezone: 'UTC' },
      },
      teamWorkload: {
        projectId: issue.fields.project.id,
        totalActiveIssues: 0,
        averageAge: 0,
        teamCapacity: 'healthy',
        distributionBalance: 1.0,
        collaborationScore: 1.0,
      },
      notificationFrequency: {
        recentNotifications: 0,
        userPreference: 'moderate',
        frequencyScore: 0.5,
        cooldownPeriod: 4,
      },
      optimalNotificationTime: new Date(),
      shouldNotify: false,
      notificationReason: 'Default analysis - no specific workload data',
    };
  }

  // Cache and performance management

  private initializeCache(): AnalyticsCache {
    return {
      issues: new Map(),
      users: new Map(),
      projects: new Map(),
      analysis: new Map(),
    };
  }

  private initializePerformanceMetrics(): PerformanceMetrics {
    return {
      analysisTime: { average: 0, max: 0, min: 0 },
      apiCallCount: 0,
      cacheHitRate: 0,
      errorRate: 0,
      throughput: 0,
    };
  }

  private cacheAnalysisResult(
    issueKey: string,
    result: IssueAnalysisResult
  ): void {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 2); // 2 hour cache for analysis results

    this.cache.analysis.set(issueKey, {
      issueKey,
      result,
      timestamp: new Date(),
      expiresAt,
    });
  }

  private updatePerformanceMetrics(
    processingTime: number,
    success: boolean
  ): void {
    // Update analysis time metrics
    if (this.performanceMetrics.analysisTime.average === 0) {
      this.performanceMetrics.analysisTime.average = processingTime;
      this.performanceMetrics.analysisTime.min = processingTime;
      this.performanceMetrics.analysisTime.max = processingTime;
    } else {
      this.performanceMetrics.analysisTime.average =
        (this.performanceMetrics.analysisTime.average + processingTime) / 2;
      this.performanceMetrics.analysisTime.min = Math.min(
        this.performanceMetrics.analysisTime.min,
        processingTime
      );
      this.performanceMetrics.analysisTime.max = Math.max(
        this.performanceMetrics.analysisTime.max,
        processingTime
      );
    }

    // Update error rate
    if (!success) {
      this.performanceMetrics.errorRate =
        this.performanceMetrics.errorRate * 0.9 + 0.1; // Exponential moving average
    } else {
      this.performanceMetrics.errorRate *= 0.99; // Decay error rate on success
    }
  }

  /**
   * Updates engine configuration
   */
  updateConfiguration(newConfig: Partial<AnalyticsConfiguration>): void {
    this.config = { ...this.config, ...newConfig };

    // Update component configurations
    if (newConfig.staleness) {
      this.stalenessDetector.updateConfiguration(newConfig.staleness);
    }
    if (newConfig.deadlines) {
      this.deadlineMonitor.updateConfiguration(newConfig.deadlines);
    }
    if (newConfig.context) {
      this.contextAnalyzer.updateConfiguration(newConfig.context);
    }
    if (newConfig.workload) {
      this.workloadCalculator.updateConfiguration(newConfig.workload);
    }
  }

  /**
   * Gets current configuration
   */
  getConfiguration(): AnalyticsConfiguration {
    return { ...this.config };
  }

  /**
   * Gets performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * Clears all caches
   */
  clearCache(): void {
    this.cache.issues.clear();
    this.cache.users.clear();
    this.cache.projects.clear();
    this.cache.analysis.clear();
    this.jiraClient.clearExpiredCache();
  }

  /**
   * Gets cache statistics
   */
  getCacheStats(): {
    issues: number;
    users: number;
    projects: number;
    analysis: number;
    totalSize: number;
  } {
    return {
      issues: this.cache.issues.size,
      users: this.cache.users.size,
      projects: this.cache.projects.size,
      analysis: this.cache.analysis.size,
      totalSize:
        this.cache.issues.size +
        this.cache.users.size +
        this.cache.projects.size +
        this.cache.analysis.size,
    };
  }
}

export default AnalyticsEngine;
