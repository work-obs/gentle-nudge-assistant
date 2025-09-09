/**
 * UserWorkloadCalculator - Analyzes user workload and optimizes notification timing
 * 
 * This component prevents overwhelming users with notifications by analyzing:
 * - Current workload and capacity
 * - Stress indicators and activity patterns
 * - Notification frequency and timing optimization
 * - Team workload distribution and balance
 */

import { 
  JiraIssue, 
  WorkloadImpact, 
  WorkloadConfig,
  UserWorkload,
  TeamWorkload,
  NotificationFrequency,
  StressIndicators,
  UserPreferences,
  AnalyticsCache 
} from '../types/analytics';

export class UserWorkloadCalculator {
  private config: WorkloadConfig;
  private cache: AnalyticsCache;

  constructor(config: WorkloadConfig, cache: AnalyticsCache) {
    this.config = config;
    this.cache = cache;
  }

  /**
   * Analyzes workload impact for notification decision making
   */
  async analyzeWorkloadImpact(
    issue: JiraIssue, 
    userPreferences: UserPreferences
  ): Promise<WorkloadImpact> {
    const assigneeId = issue.fields.assignee?.accountId;
    
    if (!assigneeId) {
      return this.createDefaultWorkloadImpact(issue, 'no_assignee');
    }

    const assigneeWorkload = await this.calculateUserWorkload(assigneeId);
    const teamWorkload = await this.calculateTeamWorkload(issue.fields.project.id);
    const notificationFrequency = await this.calculateNotificationFrequency(
      assigneeId, 
      userPreferences
    );
    
    const optimalNotificationTime = this.calculateOptimalNotificationTime(
      assigneeWorkload,
      userPreferences,
      notificationFrequency
    );
    
    const shouldNotify = this.shouldSendNotification(
      assigneeWorkload,
      teamWorkload,
      notificationFrequency,
      issue
    );
    
    const notificationReason = this.determineNotificationReason(
      shouldNotify,
      assigneeWorkload,
      notificationFrequency,
      issue
    );

    return {
      assigneeWorkload,
      teamWorkload,
      notificationFrequency,
      optimalNotificationTime,
      shouldNotify,
      notificationReason
    };
  }

  /**
   * Batch analyze workload impact for multiple issues
   */
  async batchAnalyzeWorkloadImpact(
    issues: JiraIssue[],
    userPreferences: Map<string, UserPreferences>
  ): Promise<Map<string, WorkloadImpact>> {
    const results = new Map<string, WorkloadImpact>();
    const batchSize = 25; // Smaller batch for workload analysis due to complexity
    
    for (let i = 0; i < issues.length; i += batchSize) {
      const batch = issues.slice(i, i + batchSize);
      const batchPromises = batch.map(async (issue) => {
        try {
          const assigneeId = issue.fields.assignee?.accountId;
          const prefs = assigneeId ? userPreferences.get(assigneeId) : undefined;
          
          if (!prefs) {
            // Use default preferences if not found
            const defaultPrefs = this.getDefaultUserPreferences(assigneeId || 'anonymous');
            const analysis = await this.analyzeWorkloadImpact(issue, defaultPrefs);
            return { key: issue.key, analysis };
          }
          
          const analysis = await this.analyzeWorkloadImpact(issue, prefs);
          return { key: issue.key, analysis };
        } catch (error) {
          console.warn(`Failed to analyze workload impact for ${issue.key}:`, error);
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
   * Calculates user workload metrics
   */
  private async calculateUserWorkload(userId: string): Promise<UserWorkload> {
    // Check cache first
    const cached = this.cache.users.get(userId);
    if (cached && cached.expiresAt > new Date()) {
      return cached.workload;
    }

    // Calculate workload metrics
    const currentOpenIssues = await this.getCurrentOpenIssues(userId);
    const recentlyCompletedIssues = await this.getRecentlyCompletedIssues(userId);
    const averageResolutionTime = await this.getAverageResolutionTime(userId);
    const workloadCapacity = this.determineWorkloadCapacity(
      currentOpenIssues,
      recentlyCompletedIssues,
      averageResolutionTime
    );
    
    const stressIndicators = await this.analyzeStressIndicators(userId);
    const preferredWorkingHours = await this.getPreferredWorkingHours(userId);

    const workload: UserWorkload = {
      userId,
      currentOpenIssues,
      recentlyCompletedIssues,
      averageResolutionTime,
      workloadCapacity,
      stressIndicators,
      preferredWorkingHours
    };

    // Cache the result
    this.cacheUserWorkload(userId, workload);
    
    return workload;
  }

  /**
   * Calculates team workload metrics
   */
  private async calculateTeamWorkload(projectId: string): Promise<TeamWorkload> {
    // Check cache first
    const cached = this.cache.projects.get(projectId);
    if (cached && cached.expiresAt > new Date()) {
      return cached.teamMetrics;
    }

    const totalActiveIssues = await this.getProjectActiveIssues(projectId);
    const averageAge = await this.getAverageIssueAge(projectId);
    const teamCapacity = this.determineTeamCapacity(totalActiveIssues, averageAge);
    const distributionBalance = await this.calculateDistributionBalance(projectId);
    const collaborationScore = await this.calculateCollaborationScore(projectId);

    const teamWorkload: TeamWorkload = {
      projectId,
      totalActiveIssues,
      averageAge,
      teamCapacity,
      distributionBalance,
      collaborationScore
    };

    // Cache the result
    this.cacheTeamWorkload(projectId, teamWorkload);
    
    return teamWorkload;
  }

  /**
   * Calculates notification frequency metrics
   */
  private async calculateNotificationFrequency(
    userId: string,
    userPreferences: UserPreferences
  ): Promise<NotificationFrequency> {
    const recentNotifications = await this.getRecentNotificationCount(userId);
    const lastNotificationTime = await this.getLastNotificationTime(userId);
    const userPreference = userPreferences.notificationFrequency;
    
    const frequencyScore = this.calculateFrequencyScore(
      recentNotifications,
      lastNotificationTime,
      userPreference
    );
    
    const cooldownPeriod = this.config.cooldownPeriods[userPreference];

    return {
      recentNotifications,
      lastNotificationTime,
      userPreference,
      frequencyScore,
      cooldownPeriod
    };
  }

  /**
   * Determines if a notification should be sent
   */
  private shouldSendNotification(
    userWorkload: UserWorkload,
    teamWorkload: TeamWorkload,
    notificationFrequency: NotificationFrequency,
    issue: JiraIssue
  ): boolean {
    // Don't notify if user has disabled notifications
    if (notificationFrequency.userPreference === 'disabled') {
      return false;
    }

    // Don't notify if user is over capacity and stressed
    if (userWorkload.workloadCapacity === 'over_capacity' && 
        userWorkload.stressIndicators.overallStressLevel === 'critical') {
      return false;
    }

    // Don't notify if we've exceeded daily limits
    if (notificationFrequency.recentNotifications >= this.config.notificationLimits.daily) {
      return false;
    }

    // Don't notify if still in cooldown period
    if (notificationFrequency.lastNotificationTime) {
      const hoursSinceLastNotification = 
        (Date.now() - notificationFrequency.lastNotificationTime.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceLastNotification < notificationFrequency.cooldownPeriod) {
        return false;
      }
    }

    // Don't notify if team is overloaded (unless critical issue)
    if (teamWorkload.teamCapacity === 'critical' && 
        issue.fields.priority.name !== 'Blocker' && 
        issue.fields.priority.name !== 'Critical') {
      return false;
    }

    // Additional checks based on frequency preference
    switch (notificationFrequency.userPreference) {
      case 'minimal':
        // Only notify for high priority or blocking issues
        return issue.fields.priority.name === 'Blocker' || 
               issue.fields.priority.name === 'Critical';
      
      case 'gentle':
        // More lenient notification policy
        return userWorkload.workloadCapacity !== 'over_capacity';
      
      case 'moderate':
        // Balanced approach
        return userWorkload.stressIndicators.overallStressLevel !== 'critical';
      
      default:
        return true;
    }
  }

  /**
   * Calculates optimal time for sending notification
   */
  private calculateOptimalNotificationTime(
    userWorkload: UserWorkload,
    userPreferences: UserPreferences,
    notificationFrequency: NotificationFrequency
  ): Date {
    const now = new Date();
    const workingHours = userWorkload.preferredWorkingHours;
    
    // Check if current time is within working hours
    const currentHour = now.getHours();
    const isWithinWorkingHours = 
      currentHour >= workingHours.start && currentHour < workingHours.end;
    
    // If within working hours and not in cooldown, send immediately
    if (isWithinWorkingHours && this.canSendImmediately(notificationFrequency)) {
      return now;
    }
    
    // Calculate next optimal time
    const nextOptimalTime = new Date(now);
    
    // If outside working hours, schedule for next working day start
    if (currentHour >= workingHours.end) {
      nextOptimalTime.setDate(nextOptimalTime.getDate() + 1);
      nextOptimalTime.setHours(workingHours.start, 0, 0, 0);
    } else if (currentHour < workingHours.start) {
      nextOptimalTime.setHours(workingHours.start, 0, 0, 0);
    }
    
    // Skip weekends for business hours
    while (nextOptimalTime.getDay() === 0 || nextOptimalTime.getDay() === 6) {
      nextOptimalTime.setDate(nextOptimalTime.getDate() + 1);
    }
    
    // Account for stress levels - delay if user is highly stressed
    if (userWorkload.stressIndicators.overallStressLevel === 'high') {
      nextOptimalTime.setHours(nextOptimalTime.getHours() + 2);
    }
    
    return nextOptimalTime;
  }

  /**
   * Determines reason for notification decision
   */
  private determineNotificationReason(
    shouldNotify: boolean,
    userWorkload: UserWorkload,
    notificationFrequency: NotificationFrequency,
    issue: JiraIssue
  ): string {
    if (!shouldNotify) {
      if (notificationFrequency.userPreference === 'disabled') {
        return 'User has disabled notifications';
      }
      if (userWorkload.workloadCapacity === 'over_capacity') {
        return 'User is at capacity - avoiding additional stress';
      }
      if (notificationFrequency.recentNotifications >= this.config.notificationLimits.daily) {
        return 'Daily notification limit reached';
      }
      if (notificationFrequency.lastNotificationTime) {
        const hoursSince = (Date.now() - notificationFrequency.lastNotificationTime.getTime()) / (1000 * 60 * 60);
        if (hoursSince < notificationFrequency.cooldownPeriod) {
          return `In cooldown period (${Math.round(notificationFrequency.cooldownPeriod - hoursSince)} hours remaining)`;
        }
      }
      return 'Workload conditions not optimal for notification';
    }
    
    // Reasons for sending notification
    const reasons: string[] = [];
    
    if (issue.fields.priority.name === 'Blocker' || issue.fields.priority.name === 'Critical') {
      reasons.push('High priority issue');
    }
    
    if (userWorkload.workloadCapacity === 'optimal') {
      reasons.push('User has optimal capacity');
    }
    
    if (notificationFrequency.userPreference === 'moderate' || notificationFrequency.userPreference === 'gentle') {
      reasons.push('User preferences allow notification');
    }
    
    return reasons.length > 0 ? reasons.join(', ') : 'Conditions favorable for gentle nudge';
  }

  // Helper methods for workload calculation

  private async getCurrentOpenIssues(userId: string): Promise<number> {
    // In real implementation, would query Jira API
    // For now, return reasonable estimates based on typical workloads
    return Math.floor(Math.random() * 15) + 3; // 3-18 issues
  }

  private async getRecentlyCompletedIssues(userId: string): Promise<number> {
    // In real implementation, would query issues completed in last 30 days
    return Math.floor(Math.random() * 10) + 2; // 2-12 issues
  }

  private async getAverageResolutionTime(userId: string): Promise<number> {
    // In real implementation, would calculate from historical data
    return Math.floor(Math.random() * 10) + 2; // 2-12 days
  }

  private determineWorkloadCapacity(
    openIssues: number,
    recentCompleted: number,
    avgResolutionTime: number
  ): UserWorkload['workloadCapacity'] {
    // Calculate capacity score based on workload indicators
    let capacityScore = 0;
    
    // Open issues factor (more issues = higher load)
    if (openIssues > 15) capacityScore += 3;
    else if (openIssues > 10) capacityScore += 2;
    else if (openIssues > 5) capacityScore += 1;
    
    // Resolution time factor (slower = higher load)
    if (avgResolutionTime > 8) capacityScore += 2;
    else if (avgResolutionTime > 5) capacityScore += 1;
    
    // Recent completion factor (fewer completions = potential overload)
    if (recentCompleted < 3) capacityScore += 1;
    else if (recentCompleted > 8) capacityScore -= 1;
    
    if (capacityScore >= 5) return 'over_capacity';
    else if (capacityScore >= 3) return 'near_capacity';
    else if (capacityScore <= 0) return 'under';
    else return 'optimal';
  }

  private async analyzeStressIndicators(userId: string): Promise<StressIndicators> {
    // In real implementation, would analyze activity patterns
    const rapidStatusChanges = Math.floor(Math.random() * 5);
    const lateNightActivity = Math.floor(Math.random() * 3);
    const weekendActivity = Math.floor(Math.random() * 2);
    const delayedResponses = Math.floor(Math.random() * 4);
    
    // Calculate overall stress level
    const stressScore = rapidStatusChanges + lateNightActivity * 2 + weekendActivity * 3 + delayedResponses;
    
    let overallStressLevel: StressIndicators['overallStressLevel'];
    if (stressScore >= 10) overallStressLevel = 'critical';
    else if (stressScore >= 6) overallStressLevel = 'high';
    else if (stressScore >= 3) overallStressLevel = 'moderate';
    else overallStressLevel = 'low';

    return {
      rapidStatusChanges,
      lateNightActivity,
      weekendActivity,
      delayedResponses,
      overallStressLevel
    };
  }

  private async getPreferredWorkingHours(userId: string): Promise<UserWorkload['preferredWorkingHours']> {
    // In real implementation, would get from user preferences
    return {
      start: 9,
      end: 17,
      timezone: 'America/New_York'
    };
  }

  private async getProjectActiveIssues(projectId: string): Promise<number> {
    // In real implementation, would query Jira API
    return Math.floor(Math.random() * 100) + 20; // 20-120 issues
  }

  private async getAverageIssueAge(projectId: string): Promise<number> {
    // In real implementation, would calculate from project data
    return Math.floor(Math.random() * 30) + 5; // 5-35 days
  }

  private determineTeamCapacity(totalIssues: number, averageAge: number): TeamWorkload['teamCapacity'] {
    let capacityScore = 0;
    
    if (totalIssues > 100) capacityScore += 2;
    else if (totalIssues > 50) capacityScore += 1;
    
    if (averageAge > 30) capacityScore += 2;
    else if (averageAge > 15) capacityScore += 1;
    
    if (capacityScore >= 4) return 'critical';
    else if (capacityScore >= 2) return 'overloaded';
    else if (capacityScore >= 1) return 'busy';
    else return 'healthy';
  }

  private async calculateDistributionBalance(projectId: string): Promise<number> {
    // In real implementation, would analyze issue distribution among team members
    return Math.random() * 0.5 + 0.5; // 0.5-1.0 (higher = more balanced)
  }

  private async calculateCollaborationScore(projectId: string): Promise<number> {
    // In real implementation, would analyze team collaboration patterns
    return Math.random() * 0.4 + 0.6; // 0.6-1.0
  }

  private async getRecentNotificationCount(userId: string): Promise<number> {
    // In real implementation, would query notification log
    return Math.floor(Math.random() * 5); // 0-5 notifications today
  }

  private async getLastNotificationTime(userId: string): Promise<Date | undefined> {
    // In real implementation, would get from notification log
    const hoursAgo = Math.floor(Math.random() * 24);
    return hoursAgo === 0 ? undefined : new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
  }

  private calculateFrequencyScore(
    recentNotifications: number,
    lastNotificationTime?: Date,
    userPreference: NotificationFrequency['userPreference'] = 'moderate'
  ): number {
    let score = 1.0;
    
    // Reduce score based on recent notifications
    score -= recentNotifications * 0.15;
    
    // Reduce score if last notification was recent
    if (lastNotificationTime) {
      const hoursSince = (Date.now() - lastNotificationTime.getTime()) / (1000 * 60 * 60);
      if (hoursSince < 4) score -= 0.3;
      else if (hoursSince < 12) score -= 0.15;
    }
    
    // Adjust based on user preference
    const preferenceMultiplier = {
      'disabled': 0,
      'minimal': 0.3,
      'gentle': 0.7,
      'moderate': 1.0
    };
    
    score *= preferenceMultiplier[userPreference];
    
    return Math.max(0, Math.min(1, score));
  }

  private canSendImmediately(notificationFrequency: NotificationFrequency): boolean {
    return notificationFrequency.frequencyScore > 0.5 && 
           notificationFrequency.recentNotifications < this.config.notificationLimits.daily;
  }

  private createDefaultWorkloadImpact(issue: JiraIssue, reason: string): WorkloadImpact {
    const now = new Date();
    
    return {
      assigneeWorkload: {
        userId: 'unassigned',
        currentOpenIssues: 0,
        recentlyCompletedIssues: 0,
        averageResolutionTime: 0,
        workloadCapacity: 'under',
        stressIndicators: {
          rapidStatusChanges: 0,
          lateNightActivity: 0,
          weekendActivity: 0,
          delayedResponses: 0,
          overallStressLevel: 'low'
        },
        preferredWorkingHours: {
          start: 9,
          end: 17,
          timezone: 'UTC'
        }
      },
      teamWorkload: {
        projectId: issue.fields.project.id,
        totalActiveIssues: 0,
        averageAge: 0,
        teamCapacity: 'healthy',
        distributionBalance: 1.0,
        collaborationScore: 1.0
      },
      notificationFrequency: {
        recentNotifications: 0,
        userPreference: 'moderate',
        frequencyScore: 0,
        cooldownPeriod: 0
      },
      optimalNotificationTime: now,
      shouldNotify: false,
      notificationReason: reason
    };
  }

  private getDefaultUserPreferences(userId: string): UserPreferences {
    return {
      userId,
      notificationFrequency: 'moderate',
      quietHours: {
        start: '18:00',
        end: '09:00',
        timezone: 'UTC'
      },
      preferredTone: 'encouraging',
      staleDaysThreshold: 7,
      deadlineWarningDays: 3,
      enabledNotificationTypes: ['stale_reminder', 'deadline_warning']
    };
  }

  private cacheUserWorkload(userId: string, workload: UserWorkload): void {
    const expiresAt = new Date(Date.now() + this.config.capacityThresholds.optimal * 60 * 1000);
    this.cache.users.set(userId, {
      userId,
      workload,
      preferences: this.getDefaultUserPreferences(userId),
      timestamp: new Date(),
      expiresAt
    });
  }

  private cacheTeamWorkload(projectId: string, teamWorkload: TeamWorkload): void {
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour cache
    this.cache.projects.set(projectId, {
      projectId,
      teamMetrics: teamWorkload,
      configuration: {
        projectId,
        teamNudgePolicy: 'individual',
        escalationRules: [],
        customSLAs: [],
        workingHours: {
          start: 9,
          end: 17,
          timezone: 'UTC'
        },
        holidays: []
      },
      timestamp: new Date(),
      expiresAt
    });
  }

  /**
   * Updates workload calculation configuration
   */
  updateConfiguration(newConfig: Partial<WorkloadConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Gets current configuration
   */
  getConfiguration(): WorkloadConfig {
    return { ...this.config };
  }

  /**
   * Analyzes team workload distribution for insights
   */
  async analyzeTeamWorkloadDistribution(projectId: string): Promise<{
    overloadedUsers: string[];
    underutilizedUsers: string[];
    balanceScore: number;
    recommendations: string[];
  }> {
    // In real implementation, would analyze all team members
    const teamWorkload = await this.calculateTeamWorkload(projectId);
    
    return {
      overloadedUsers: [], // Would contain actual user IDs
      underutilizedUsers: [],
      balanceScore: teamWorkload.distributionBalance,
      recommendations: [
        'Consider redistributing high-priority issues',
        'Review team capacity for upcoming sprint',
        'Identify opportunities for knowledge sharing'
      ]
    };
  }

  /**
   * Predicts optimal notification windows for a user
   */
  async predictOptimalNotificationWindows(userId: string, days: number = 7): Promise<{
    windows: Array<{ start: Date; end: Date; score: number }>;
    bestTimes: Date[];
  }> {
    const userWorkload = await this.calculateUserWorkload(userId);
    const workingHours = userWorkload.preferredWorkingHours;
    
    const windows: Array<{ start: Date; end: Date; score: number }> = [];
    const bestTimes: Date[] = [];
    
    // Generate prediction windows (simplified implementation)
    for (let day = 0; day < days; day++) {
      const date = new Date();
      date.setDate(date.getDate() + day);
      
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      
      // Morning window
      const morningStart = new Date(date);
      morningStart.setHours(workingHours.start, 0, 0, 0);
      const morningEnd = new Date(date);
      morningEnd.setHours(workingHours.start + 2, 0, 0, 0);
      
      windows.push({
        start: morningStart,
        end: morningEnd,
        score: 0.8 // High score for morning notifications
      });
      
      if (userWorkload.stressIndicators.overallStressLevel === 'low') {
        bestTimes.push(morningStart);
      }
    }
    
    return { windows, bestTimes };
  }
}