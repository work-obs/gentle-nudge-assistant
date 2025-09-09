/**
 * StalenessDetector - Analyzes issue update patterns and activity to determine staleness
 *
 * This component intelligently detects when issues have become stale by analyzing:
 * - Last update timestamps across different activity types
 * - Historical activity patterns for context
 * - Assignee and project-level activity
 * - Issue type and priority considerations
 */

import {
  JiraIssue,
  StalenessAnalysis,
  StalenessConfig,
  StalenessFactors,
  AssigneeActivity,
  ProjectActivity,
  ActivityPattern,
  AnalyticsCache,
} from '../types/analytics';

export class StalenessDetector {
  private config: StalenessConfig;
  private cache: AnalyticsCache;

  constructor(config: StalenessConfig, cache: AnalyticsCache) {
    this.config = config;
    this.cache = cache;
  }

  /**
   * Analyzes an issue for staleness indicators
   */
  async analyzeStaleness(issue: JiraIssue): Promise<StalenessAnalysis> {
    const now = new Date();
    const lastUpdate = new Date(issue.fields.updated);
    const created = new Date(issue.fields.created);

    const daysSinceLastUpdate = this.calculateDaysDifference(lastUpdate, now);
    const daysSinceCreation = this.calculateDaysDifference(created, now);

    // Get additional activity data
    const daysSinceLastComment = await this.getDaysSinceLastComment(issue);
    const daysSinceLastWorklog = await this.getDaysSinceLastWorklog(issue);

    // Analyze activity patterns
    const activityPattern = await this.analyzeActivityPattern(issue);
    const factors = await this.analyzeStalenessFactors(issue);

    // Determine staleness level
    const staleness = this.determineStalenessLevel(
      daysSinceLastUpdate,
      issue.fields.issuetype.name,
      issue.fields.priority.name,
      factors
    );

    // Calculate confidence score
    const confidence = this.calculateConfidenceScore(
      issue,
      factors,
      activityPattern,
      daysSinceCreation
    );

    const isStale = staleness !== 'fresh' && staleness !== 'aging';

    return {
      daysSinceLastUpdate,
      daysSinceLastComment,
      daysSinceLastWorklog,
      activityPattern,
      isStale,
      staleness,
      confidence,
      factors,
    };
  }

  /**
   * Batch analyze multiple issues for staleness
   */
  async batchAnalyzeStaleness(
    issues: JiraIssue[]
  ): Promise<Map<string, StalenessAnalysis>> {
    const results = new Map<string, StalenessAnalysis>();
    const batchSize = 50; // Process in batches to manage memory

    for (let i = 0; i < issues.length; i += batchSize) {
      const batch = issues.slice(i, i + batchSize);
      const batchPromises = batch.map(async issue => {
        try {
          const analysis = await this.analyzeStaleness(issue);
          return { key: issue.key, analysis };
        } catch (error) {
          console.warn(`Failed to analyze staleness for ${issue.key}:`, error);
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(result => {
        if (result) {
          results.set(result.key, result.analysis);
        }
      });
    }

    return results;
  }

  /**
   * Determines the staleness level based on configuration and factors
   */
  private determineStalenessLevel(
    daysSinceUpdate: number,
    issueType: string,
    priority: string,
    factors: StalenessFactors
  ): StalenessAnalysis['staleness'] {
    // Apply multipliers based on issue type and priority
    const typeMultiplier = this.config.issueTypeMultipliers[issueType] || 1.0;
    const priorityMultiplier = this.config.priorityMultipliers[priority] || 1.0;

    const adjustedDays =
      daysSinceUpdate / (typeMultiplier * priorityMultiplier);

    // Account for recent activity that might extend freshness
    const activityAdjustment = this.calculateActivityAdjustment(factors);
    const finalDays = adjustedDays + activityAdjustment;

    if (finalDays <= this.config.thresholds.fresh) {
      return 'fresh';
    } else if (finalDays <= this.config.thresholds.aging) {
      return 'aging';
    } else if (finalDays <= this.config.thresholds.stale) {
      return 'stale';
    } else if (finalDays <= this.config.thresholds.veryStale) {
      return 'very_stale';
    } else {
      return 'abandoned';
    }
  }

  /**
   * Calculates activity-based adjustments to staleness thresholds
   */
  private calculateActivityAdjustment(factors: StalenessFactors): number {
    let adjustment = 0;

    // Recent comments extend freshness
    if (factors.hasRecentComments) {
      adjustment -= 2;
    }

    // Recent work logs are strong indicators of activity
    if (factors.hasRecentWorklogs) {
      adjustment -= 3;
    }

    // Status changes indicate progress
    if (factors.hasStatusChanges) {
      adjustment -= 1;
    }

    // High assignee activity suggests they're engaged
    if (factors.assigneeActivity.overallActivityScore > 0.7) {
      adjustment -= 1;
    }

    // Low project activity might mean issues naturally age slower
    if (factors.projectActivity.overallActivityScore < 0.3) {
      adjustment += 1;
    }

    return Math.max(-5, Math.min(5, adjustment)); // Cap adjustments
  }

  /**
   * Analyzes various factors that influence staleness perception
   */
  private async analyzeStalenessFactors(
    issue: JiraIssue
  ): Promise<StalenessFactors> {
    const assigneeActivity = issue.fields.assignee
      ? await this.analyzeAssigneeActivity(issue.fields.assignee.accountId)
      : this.getDefaultAssigneeActivity();

    const projectActivity = await this.analyzeProjectActivity(
      issue.fields.project.id
    );

    return {
      hasRecentComments: await this.hasRecentComments(issue),
      hasRecentWorklogs: await this.hasRecentWorklogs(issue),
      hasStatusChanges: await this.hasRecentStatusChanges(issue),
      assigneeActivity,
      projectActivity,
    };
  }

  /**
   * Analyzes assignee's overall activity and workload
   */
  private async analyzeAssigneeActivity(
    userId: string
  ): Promise<AssigneeActivity> {
    // Check cache first
    const cached = this.cache.users.get(userId);
    if (cached && cached.expiresAt > new Date()) {
      return cached.workload.stressIndicators.overallStressLevel === 'low'
        ? {
            overallActivityScore: 0.8,
            recentIssuesUpdated: 10,
            averageResponseTime: 24,
            workloadLevel: 'moderate',
          }
        : {
            overallActivityScore: 0.4,
            recentIssuesUpdated: 3,
            averageResponseTime: 72,
            workloadLevel: cached.workload
              .workloadCapacity as AssigneeActivity['workloadLevel'],
          };
    }

    // In a real implementation, this would fetch from Jira API
    // For now, return reasonable defaults
    return {
      overallActivityScore: 0.6,
      recentIssuesUpdated: 5,
      averageResponseTime: 48,
      workloadLevel: 'moderate',
    };
  }

  /**
   * Analyzes project-level activity patterns
   */
  private async analyzeProjectActivity(
    projectId: string
  ): Promise<ProjectActivity> {
    const cached = this.cache.projects.get(projectId);
    if (cached && cached.expiresAt > new Date()) {
      const teamMetrics = cached.teamMetrics;
      return {
        overallActivityScore:
          teamMetrics.teamCapacity === 'healthy' ? 0.8 : 0.4,
        teamSize: 8, // Would be derived from actual data
        recentIssueUpdates: teamMetrics.totalActiveIssues,
        projectHealth:
          teamMetrics.teamCapacity === 'healthy' ? 'healthy' : 'moderate',
      };
    }

    return {
      overallActivityScore: 0.6,
      teamSize: 6,
      recentIssueUpdates: 15,
      projectHealth: 'healthy',
    };
  }

  /**
   * Analyzes activity patterns over time
   */
  private async analyzeActivityPattern(
    issue: JiraIssue
  ): Promise<ActivityPattern> {
    // In a real implementation, this would analyze historical data
    // For now, return reasonable defaults based on current data

    const now = new Date();
    const isEndOfWeek = now.getDay() >= 4; // Thursday or later
    const isEndOfMonth = now.getDate() > 25;

    return {
      weekdayActivity: [0.3, 0.9, 1.0, 0.9, 0.7, 0.2, 0.1], // Sun-Sat
      hourlyActivity: Array.from({ length: 24 }, (_, i) => {
        // Simulate work hours activity
        if (i >= 9 && i <= 17) return 0.8;
        if (i >= 7 && i <= 19) return 0.4;
        return 0.1;
      }),
      activityTrend: 'stable',
      seasonalFactors: {
        isHolidayPeriod: this.isHolidayPeriod(now),
        isEndOfSprint: isEndOfWeek && isEndOfMonth, // Simplified logic
        isReleaseWeek: false, // Would check against release calendar
      },
    };
  }

  /**
   * Calculates confidence in the staleness assessment
   */
  private calculateConfidenceScore(
    issue: JiraIssue,
    factors: StalenessFactors,
    activityPattern: ActivityPattern,
    daysSinceCreation: number
  ): number {
    let confidence = 0.5; // Base confidence

    // More confidence if we have recent activity data
    if (factors.hasRecentComments || factors.hasRecentWorklogs) {
      confidence += 0.2;
    }

    // More confidence for older issues (pattern is more established)
    if (daysSinceCreation > 30) {
      confidence += 0.1;
    }

    // More confidence if assignee has clear activity patterns
    if (factors.assigneeActivity.overallActivityScore > 0.1) {
      confidence += 0.2;
    }

    // Account for seasonal factors that might affect confidence
    if (activityPattern.seasonalFactors.isHolidayPeriod) {
      confidence -= 0.1;
    }

    return Math.max(0.1, Math.min(1.0, confidence));
  }

  /**
   * Helper method to calculate days between dates
   */
  private calculateDaysDifference(from: Date, to: Date): number {
    const diffTime = Math.abs(to.getTime() - from.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Checks if there have been recent comments (placeholder implementation)
   */
  private async hasRecentComments(issue: JiraIssue): Promise<boolean> {
    // In real implementation, would fetch comments from Jira API
    // For now, simulate based on recent update activity
    const daysSinceUpdate = this.calculateDaysDifference(
      new Date(issue.fields.updated),
      new Date()
    );
    return daysSinceUpdate <= 3;
  }

  /**
   * Checks if there have been recent work logs (placeholder implementation)
   */
  private async hasRecentWorklogs(issue: JiraIssue): Promise<boolean> {
    if (issue.fields.worklog && issue.fields.worklog.worklogs.length > 0) {
      const latestWorklog = issue.fields.worklog.worklogs.sort(
        (a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()
      )[0];

      const daysSinceWorklog = this.calculateDaysDifference(
        new Date(latestWorklog.created),
        new Date()
      );

      return daysSinceWorklog <= 7;
    }
    return false;
  }

  /**
   * Checks for recent status changes (placeholder implementation)
   */
  private async hasRecentStatusChanges(issue: JiraIssue): Promise<boolean> {
    // In real implementation, would analyze changelog
    // For now, approximate based on update patterns
    return (
      this.calculateDaysDifference(
        new Date(issue.fields.updated),
        new Date()
      ) <= 5
    );
  }

  /**
   * Gets days since last comment (placeholder implementation)
   */
  private async getDaysSinceLastComment(issue: JiraIssue): Promise<number> {
    // Would fetch from comments API in real implementation
    return this.calculateDaysDifference(
      new Date(issue.fields.updated),
      new Date()
    );
  }

  /**
   * Gets days since last work log entry
   */
  private async getDaysSinceLastWorklog(issue: JiraIssue): Promise<number> {
    if (issue.fields.worklog && issue.fields.worklog.worklogs.length > 0) {
      const latestWorklog = issue.fields.worklog.worklogs.sort(
        (a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()
      )[0];

      return this.calculateDaysDifference(
        new Date(latestWorklog.created),
        new Date()
      );
    }

    // If no worklogs, use creation date as baseline
    return this.calculateDaysDifference(
      new Date(issue.fields.created),
      new Date()
    );
  }

  /**
   * Default assignee activity for unassigned issues
   */
  private getDefaultAssigneeActivity(): AssigneeActivity {
    return {
      overallActivityScore: 0,
      recentIssuesUpdated: 0,
      averageResponseTime: 0,
      workloadLevel: 'light',
    };
  }

  /**
   * Checks if current period is a holiday period
   */
  private isHolidayPeriod(date: Date): boolean {
    // Simplified holiday detection - in real implementation would use configuration
    const month = date.getMonth();
    const day = date.getDate();

    // Common holiday periods
    const isChristmasNewYear =
      (month === 11 && day > 20) || (month === 0 && day < 10);
    const isThanksgiving = month === 10 && day > 20 && day < 30;
    const isSummer = month >= 5 && month <= 7; // June-August

    return isChristmasNewYear || isThanksgiving || isSummer;
  }

  /**
   * Updates staleness configuration
   */
  updateConfiguration(newConfig: Partial<StalenessConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Gets current configuration
   */
  getConfiguration(): StalenessConfig {
    return { ...this.config };
  }
}
