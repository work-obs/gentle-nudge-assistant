/**
 * DeadlineMonitor - Tracks due dates, SLA timelines, and deadline proximity
 *
 * This component provides intelligent deadline monitoring by analyzing:
 * - Due dates and fix version release dates
 * - SLA configurations and breach predictions
 * - Business day calculations and holiday considerations
 * - Context-aware urgency scoring
 */

import {
  JiraIssue,
  DeadlineAnalysis,
  DeadlineConfig,
  SLAStatus,
  SLAConfig,
  AnalyticsCache,
} from '../types/analytics';

export class DeadlineMonitor {
  private config: DeadlineConfig;
  private cache: AnalyticsCache;

  constructor(config: DeadlineConfig, cache: AnalyticsCache) {
    this.config = config;
    this.cache = cache;
  }

  /**
   * Analyzes an issue for deadline-related concerns
   */
  async analyzeDeadlines(issue: JiraIssue): Promise<DeadlineAnalysis> {
    const now = new Date();

    // Analyze due date if present
    const dueDateAnalysis = this.analyzeDueDate(issue, now);

    // Analyze fix version dates
    const fixVersionAnalysis = this.analyzeFixVersions(issue, now);

    // Determine SLA status
    const slaStatus = await this.analyzeSLAStatus(issue, now);

    // Calculate overall urgency
    const urgency = this.calculateUrgency(
      dueDateAnalysis,
      fixVersionAnalysis,
      slaStatus,
      issue
    );

    return {
      hasDueDate: dueDateAnalysis.hasDueDate,
      dueDate: dueDateAnalysis.dueDate,
      daysUntilDue: dueDateAnalysis.daysUntilDue,
      hasFixVersion: fixVersionAnalysis.hasFixVersion,
      fixVersionDate: fixVersionAnalysis.fixVersionDate,
      daysUntilRelease: fixVersionAnalysis.daysUntilRelease,
      urgency,
      slaStatus,
      timeRemaining: this.calculateTimeRemaining(dueDateAnalysis.dueDate, now),
    };
  }

  /**
   * Batch analyze multiple issues for deadline concerns
   */
  async batchAnalyzeDeadlines(
    issues: JiraIssue[]
  ): Promise<Map<string, DeadlineAnalysis>> {
    const results = new Map<string, DeadlineAnalysis>();
    const batchSize = 50;

    for (let i = 0; i < issues.length; i += batchSize) {
      const batch = issues.slice(i, i + batchSize);
      const batchPromises = batch.map(async issue => {
        try {
          const analysis = await this.analyzeDeadlines(issue);
          return { key: issue.key, analysis };
        } catch (error) {
          console.warn(`Failed to analyze deadlines for ${issue.key}:`, error);
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
   * Analyzes due date information
   */
  private analyzeDueDate(
    issue: JiraIssue,
    now: Date
  ): {
    hasDueDate: boolean;
    dueDate?: Date;
    daysUntilDue?: number;
  } {
    if (!issue.fields.duedate) {
      return { hasDueDate: false };
    }

    const dueDate = new Date(issue.fields.duedate);
    const daysUntilDue = this.config.businessDaysOnly
      ? this.calculateBusinessDays(now, dueDate)
      : this.calculateCalendarDays(now, dueDate);

    return {
      hasDueDate: true,
      dueDate,
      daysUntilDue,
    };
  }

  /**
   * Analyzes fix version release dates
   */
  private analyzeFixVersions(
    issue: JiraIssue,
    now: Date
  ): {
    hasFixVersion: boolean;
    fixVersionDate?: Date;
    daysUntilRelease?: number;
  } {
    const fixVersions = issue.fields.fixVersions || [];

    if (fixVersions.length === 0) {
      return { hasFixVersion: false };
    }

    // Find the earliest release date among fix versions
    const releaseDates = fixVersions
      .filter(version => version.releaseDate)
      .map(version => new Date(version.releaseDate!))
      .sort((a, b) => a.getTime() - b.getTime());

    if (releaseDates.length === 0) {
      return { hasFixVersion: true };
    }

    const earliestReleaseDate = releaseDates[0];
    const daysUntilRelease = this.config.businessDaysOnly
      ? this.calculateBusinessDays(now, earliestReleaseDate)
      : this.calculateCalendarDays(now, earliestReleaseDate);

    return {
      hasFixVersion: true,
      fixVersionDate: earliestReleaseDate,
      daysUntilRelease,
    };
  }

  /**
   * Analyzes SLA status for the issue
   */
  private async analyzeSLAStatus(
    issue: JiraIssue,
    now: Date
  ): Promise<SLAStatus> {
    const applicableSLAs = this.findApplicableSLAs(issue);

    if (applicableSLAs.length === 0) {
      return {
        hasSLA: false,
        slaHealth: 'safe',
      };
    }

    // Use the most restrictive SLA
    const primarySLA = applicableSLAs.sort(
      (a, b) => a.timeLimit - b.timeLimit
    )[0];

    const issueCreated = new Date(issue.fields.created);
    const slaDeadline = this.calculateSLADeadline(issueCreated, primarySLA);

    const timeToBreachSLA =
      this.config.businessDaysOnly && primarySLA.businessHoursOnly
        ? this.calculateBusinessHours(now, slaDeadline)
        : (slaDeadline.getTime() - now.getTime()) / (1000 * 60 * 60); // hours

    const slaHealth = this.determineSLAHealth(timeToBreachSLA, primarySLA);

    return {
      hasSLA: true,
      slaType: primarySLA.type,
      slaDeadline,
      timeToBreachSLA: Math.max(0, timeToBreachSLA),
      slaHealth,
    };
  }

  /**
   * Finds applicable SLA configurations for an issue
   */
  private findApplicableSLAs(issue: JiraIssue): SLAConfig[] {
    return this.config.slaConfigurations.filter(sla => {
      // Check if priority matches
      const priorityMatches =
        sla.priority.length === 0 ||
        sla.priority.includes(issue.fields.priority.name);

      // Check if issue type matches
      const typeMatches =
        sla.issueTypes.length === 0 ||
        sla.issueTypes.includes(issue.fields.issuetype.name);

      return priorityMatches && typeMatches;
    });
  }

  /**
   * Calculates SLA deadline based on creation time and SLA config
   */
  private calculateSLADeadline(created: Date, sla: SLAConfig): Date {
    const deadline = new Date(created);

    if (sla.businessHoursOnly) {
      // Add business hours only
      let hoursToAdd = sla.timeLimit;
      const currentDate = new Date(deadline);

      while (hoursToAdd > 0) {
        if (
          this.isBusinessDay(currentDate) &&
          this.isBusinessHour(currentDate)
        ) {
          hoursToAdd--;
        }
        currentDate.setHours(currentDate.getHours() + 1);
      }

      return currentDate;
    } else {
      // Simple calendar hours addition
      deadline.setHours(deadline.getHours() + sla.timeLimit);
      return deadline;
    }
  }

  /**
   * Determines SLA health status based on time remaining
   */
  private determineSLAHealth(
    timeToBreachHours: number,
    sla: SLAConfig
  ): SLAStatus['slaHealth'] {
    if (timeToBreachHours <= 0) {
      return 'breached';
    }

    const percentRemaining = timeToBreachHours / sla.timeLimit;

    if (percentRemaining <= 0.1) {
      // Less than 10% time remaining
      return 'critical';
    } else if (percentRemaining <= 0.25) {
      // Less than 25% time remaining
      return 'warning';
    } else {
      return 'safe';
    }
  }

  /**
   * Calculates overall urgency based on all deadline factors
   */
  private calculateUrgency(
    dueDateAnalysis: any,
    fixVersionAnalysis: any,
    slaStatus: SLAStatus,
    issue: JiraIssue
  ): DeadlineAnalysis['urgency'] {
    let urgencyScore = 0;

    // Due date urgency
    if (
      dueDateAnalysis.hasDueDate &&
      dueDateAnalysis.daysUntilDue !== undefined
    ) {
      if (dueDateAnalysis.daysUntilDue <= 0) urgencyScore += 4;
      else if (dueDateAnalysis.daysUntilDue <= 1) urgencyScore += 3;
      else if (dueDateAnalysis.daysUntilDue <= 3) urgencyScore += 2;
      else if (dueDateAnalysis.daysUntilDue <= 7) urgencyScore += 1;
    }

    // Fix version urgency
    if (
      fixVersionAnalysis.hasFixVersion &&
      fixVersionAnalysis.daysUntilRelease !== undefined
    ) {
      if (fixVersionAnalysis.daysUntilRelease <= 0) urgencyScore += 3;
      else if (fixVersionAnalysis.daysUntilRelease <= 2) urgencyScore += 2;
      else if (fixVersionAnalysis.daysUntilRelease <= 7) urgencyScore += 1;
    }

    // SLA urgency
    if (slaStatus.hasSLA) {
      switch (slaStatus.slaHealth) {
        case 'breached':
          urgencyScore += 4;
          break;
        case 'critical':
          urgencyScore += 3;
          break;
        case 'warning':
          urgencyScore += 2;
          break;
        default:
          break;
      }
    }

    // Priority influence
    const priorityMultiplier = this.getPriorityMultiplier(
      issue.fields.priority.name
    );
    urgencyScore *= priorityMultiplier;

    // Convert score to urgency level
    if (urgencyScore >= 8) return 'critical';
    else if (urgencyScore >= 5) return 'high';
    else if (urgencyScore >= 2) return 'medium';
    else return 'low';
  }

  /**
   * Gets priority multiplier for urgency calculations
   */
  private getPriorityMultiplier(priority: string): number {
    const multipliers: Record<string, number> = {
      Blocker: 1.5,
      Critical: 1.4,
      High: 1.2,
      Medium: 1.0,
      Low: 0.8,
      Lowest: 0.6,
    };

    return multipliers[priority] || 1.0;
  }

  /**
   * Calculates remaining time with detailed breakdown
   */
  private calculateTimeRemaining(
    dueDate?: Date,
    now: Date = new Date()
  ): DeadlineAnalysis['timeRemaining'] {
    if (!dueDate) return undefined;

    const timeDiff = dueDate.getTime() - now.getTime();
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const businessDaysRemaining = this.calculateBusinessDays(now, dueDate);

    return {
      days: Math.max(0, days),
      hours: Math.max(0, hours),
      businessDaysRemaining: Math.max(0, businessDaysRemaining),
    };
  }

  /**
   * Calculates business days between two dates
   */
  private calculateBusinessDays(start: Date, end: Date): number {
    if (start >= end) return 0;

    let businessDays = 0;
    const current = new Date(start);

    while (current < end) {
      if (this.isBusinessDay(current)) {
        businessDays++;
      }
      current.setDate(current.getDate() + 1);
    }

    return businessDays;
  }

  /**
   * Calculates calendar days between two dates
   */
  private calculateCalendarDays(start: Date, end: Date): number {
    const timeDiff = end.getTime() - start.getTime();
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  }

  /**
   * Calculates business hours between two dates
   */
  private calculateBusinessHours(start: Date, end: Date): number {
    if (start >= end) return 0;

    let businessHours = 0;
    const current = new Date(start);

    while (current < end) {
      if (this.isBusinessDay(current) && this.isBusinessHour(current)) {
        businessHours++;
      }
      current.setHours(current.getHours() + 1);
    }

    return businessHours;
  }

  /**
   * Checks if a date is a business day
   */
  private isBusinessDay(date: Date): boolean {
    const day = date.getDay();
    const isWeekend = day === 0 || day === 6; // Sunday or Saturday

    if (isWeekend) return false;

    // Check if it's a configured holiday
    const dateString = date.toISOString().split('T')[0];
    return !this.config.holidays.includes(dateString);
  }

  /**
   * Checks if a time is within business hours (9 AM - 5 PM by default)
   */
  private isBusinessHour(date: Date): boolean {
    const hour = date.getHours();
    return hour >= 9 && hour < 17;
  }

  /**
   * Identifies issues approaching deadlines that need attention
   */
  async findIssuesNeedingDeadlineAttention(issues: JiraIssue[]): Promise<{
    critical: JiraIssue[];
    high: JiraIssue[];
    medium: JiraIssue[];
    upcoming: JiraIssue[];
  }> {
    const analyses = await this.batchAnalyzeDeadlines(issues);

    const critical: JiraIssue[] = [];
    const high: JiraIssue[] = [];
    const medium: JiraIssue[] = [];
    const upcoming: JiraIssue[] = [];

    for (const issue of issues) {
      const analysis = analyses.get(issue.key);
      if (!analysis) continue;

      switch (analysis.urgency) {
        case 'critical':
          critical.push(issue);
          break;
        case 'high':
          high.push(issue);
          break;
        case 'medium':
          medium.push(issue);
          break;
        case 'low':
          if (
            (analysis.daysUntilDue && analysis.daysUntilDue <= 7) ||
            (analysis.daysUntilRelease && analysis.daysUntilRelease <= 14)
          ) {
            upcoming.push(issue);
          }
          break;
      }
    }

    return { critical, high, medium, upcoming };
  }

  /**
   * Gets deadline warning threshold for a specific priority level
   */
  getWarningThreshold(urgency: DeadlineAnalysis['urgency']): number {
    return (
      this.config.warningThresholds[urgency] ||
      this.config.warningThresholds.low
    );
  }

  /**
   * Updates deadline monitoring configuration
   */
  updateConfiguration(newConfig: Partial<DeadlineConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Merge SLA configurations
    if (newConfig.slaConfigurations) {
      this.config.slaConfigurations = newConfig.slaConfigurations;
    }

    // Merge holidays
    if (newConfig.holidays) {
      this.config.holidays = [
        ...new Set([...this.config.holidays, ...newConfig.holidays]),
      ];
    }
  }

  /**
   * Gets current configuration
   */
  getConfiguration(): DeadlineConfig {
    return { ...this.config };
  }

  /**
   * Adds a new SLA configuration
   */
  addSLAConfiguration(slaConfig: SLAConfig): void {
    this.config.slaConfigurations.push(slaConfig);
  }

  /**
   * Removes an SLA configuration by name
   */
  removeSLAConfiguration(name: string): void {
    this.config.slaConfigurations = this.config.slaConfigurations.filter(
      sla => sla.name !== name
    );
  }

  /**
   * Adds holidays to the configuration
   */
  addHolidays(holidays: string[]): void {
    this.config.holidays = [...new Set([...this.config.holidays, ...holidays])];
  }
}
