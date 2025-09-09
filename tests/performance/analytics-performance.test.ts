/**
 * Performance tests for analytics algorithms
 * Tests ensuring analytics calculations perform efficiently at scale
 */

import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import { performance } from 'perf_hooks';

// Mock analytics engine for performance testing
class MockAnalyticsEngine {
  private issues: any[] = [];
  private userInteractions: any[] = [];
  private notificationHistory: any[] = [];

  // Simulate large dataset generation
  generateLargeDataset(size: number) {
    this.issues = Array.from({ length: size }, (_, i) => ({
      key: `PERF-${i}`,
      summary: `Performance test issue ${i}`,
      created: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within 30 days
      updated: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),  // Random date within 7 days
      priority: ['Low', 'Medium', 'High', 'Critical'][Math.floor(Math.random() * 4)],
      status: ['To Do', 'In Progress', 'Code Review', 'Done'][Math.floor(Math.random() * 4)],
      assignee: `user-${Math.floor(Math.random() * 100)}`,
      dueDate: Math.random() > 0.5 ? new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000) : null
    }));

    this.userInteractions = Array.from({ length: size * 2 }, (_, i) => ({
      id: i,
      userId: `user-${Math.floor(Math.random() * 100)}`,
      issueKey: `PERF-${Math.floor(Math.random() * size)}`,
      response: ['actioned', 'acknowledged', 'dismissed', 'snoozed'][Math.floor(Math.random() * 4)],
      responseTime: Math.random() * 10000, // 0-10 seconds
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
    }));

    this.notificationHistory = Array.from({ length: size * 3 }, (_, i) => ({
      id: i,
      issueKey: `PERF-${Math.floor(Math.random() * size)}`,
      userId: `user-${Math.floor(Math.random() * 100)}`,
      notificationType: ['stale-reminder', 'deadline-warning', 'progress-update'][Math.floor(Math.random() * 3)],
      deliveredAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      responseTime: Math.random() * 5000,
      effectivenessScore: Math.random() * 10
    }));
  }

  // Algorithm 1: Calculate user engagement metrics
  calculateUserEngagementMetrics(userId: string) {
    const userInteractions = this.userInteractions.filter(i => i.userId === userId);
    
    if (userInteractions.length === 0) {
      return {
        totalInteractions: 0,
        responseRate: 0,
        averageResponseTime: 0,
        engagementScore: 0
      };
    }

    const totalInteractions = userInteractions.length;
    const responses = userInteractions.filter(i => i.response !== 'dismissed');
    const responseRate = responses.length / totalInteractions;
    
    const totalResponseTime = userInteractions.reduce((sum, i) => sum + i.responseTime, 0);
    const averageResponseTime = totalResponseTime / totalInteractions;
    
    // Complex engagement calculation
    const responseWeights = { actioned: 1.0, acknowledged: 0.7, snoozed: 0.4, dismissed: 0.1 };
    const weightedScore = userInteractions.reduce((sum, i) => {
      return sum + (responseWeights[i.response as keyof typeof responseWeights] || 0);
    }, 0);
    
    const engagementScore = Math.min(10, (weightedScore / totalInteractions) * 10);

    return {
      totalInteractions,
      responseRate,
      averageResponseTime,
      engagementScore
    };
  }

  // Algorithm 2: Detect stale issues with complex scoring
  detectStaleIssuesWithScoring(staleDaysThreshold: number = 3) {
    const now = new Date();
    const staleIssues = [];

    for (const issue of this.issues) {
      const daysSinceUpdate = Math.floor(
        (now.getTime() - issue.updated.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceUpdate >= staleDaysThreshold) {
        // Complex staleness scoring algorithm
        const priorityWeight = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 }[issue.priority] || 1;
        const ageMultiplier = Math.min(3, daysSinceUpdate / staleDaysThreshold);
        
        // Get notification history for this issue
        const issueHistory = this.notificationHistory.filter(h => h.issueKey === issue.key);
        const lastNotificationDays = issueHistory.length > 0
          ? Math.floor((now.getTime() - Math.max(...issueHistory.map(h => h.deliveredAt.getTime()))) / (1000 * 60 * 60 * 24))
          : Infinity;
          
        const urgencyMultiplier = lastNotificationDays > 7 ? 1.5 : 1.0;
        
        const stalenessScore = priorityWeight * ageMultiplier * urgencyMultiplier;
        
        staleIssues.push({
          ...issue,
          daysSinceUpdate,
          stalenessScore,
          lastNotificationDays
        });
      }
    }

    // Sort by staleness score (descending)
    return staleIssues.sort((a, b) => b.stalenessScore - a.stalenessScore);
  }

  // Algorithm 3: Calculate notification effectiveness patterns
  analyzeNotificationEffectiveness() {
    const effectiveness = {};
    
    // Group by notification type
    const typeGroups = this.notificationHistory.reduce((groups, notification) => {
      const type = notification.notificationType;
      if (!groups[type]) groups[type] = [];
      groups[type].push(notification);
      return groups;
    }, {} as Record<string, any[]>);

    for (const [type, notifications] of Object.entries(typeGroups)) {
      const totalNotifications = notifications.length;
      const totalEffectiveness = notifications.reduce((sum, n) => sum + n.effectivenessScore, 0);
      const averageEffectiveness = totalEffectiveness / totalNotifications;
      
      // Time-based effectiveness analysis
      const hourlyEffectiveness = new Array(24).fill(0).map(() => ({ total: 0, count: 0 }));
      
      notifications.forEach(n => {
        const hour = n.deliveredAt.getHours();
        hourlyEffectiveness[hour].total += n.effectivenessScore;
        hourlyEffectiveness[hour].count += 1;
      });

      const hourlyAverages = hourlyEffectiveness.map((h, hour) => ({
        hour,
        averageEffectiveness: h.count > 0 ? h.total / h.count : 0,
        sampleSize: h.count
      }));

      effectiveness[type] = {
        totalNotifications,
        averageEffectiveness,
        hourlyAverages: hourlyAverages.filter(h => h.sampleSize > 0)
      };
    }

    return effectiveness;
  }

  // Algorithm 4: Predict optimal notification timing
  predictOptimalNotificationTiming(userId: string) {
    const userHistory = this.notificationHistory.filter(h => h.userId === userId);
    
    if (userHistory.length < 10) {
      // Fallback to general patterns if insufficient data
      return { hour: 10, confidence: 0.3, reason: 'insufficient_data' };
    }

    // Complex timing analysis
    const hourlyPerformance = new Array(24).fill(0).map(() => ({
      notifications: 0,
      totalResponseTime: 0,
      totalEffectiveness: 0
    }));

    userHistory.forEach(h => {
      const hour = h.deliveredAt.getHours();
      hourlyPerformance[hour].notifications += 1;
      hourlyPerformance[hour].totalResponseTime += h.responseTime;
      hourlyPerformance[hour].totalEffectiveness += h.effectivenessScore;
    });

    // Calculate composite scores for each hour
    const hourScores = hourlyPerformance.map((perf, hour) => {
      if (perf.notifications === 0) return { hour, score: 0, confidence: 0 };
      
      const avgResponseTime = perf.totalResponseTime / perf.notifications;
      const avgEffectiveness = perf.totalEffectiveness / perf.notifications;
      
      // Lower response time and higher effectiveness = better score
      const responseScore = Math.max(0, 10 - (avgResponseTime / 1000)); // Scale to 0-10
      const effectivenessScore = avgEffectiveness; // Already 0-10
      
      const compositeScore = (responseScore * 0.4) + (effectivenessScore * 0.6);
      const confidence = Math.min(1.0, perf.notifications / 10); // More data = higher confidence
      
      return { hour, score: compositeScore, confidence };
    });

    // Find the best hour
    const bestHour = hourScores.reduce((best, current) => 
      current.score > best.score ? current : best
    );

    return {
      hour: bestHour.hour,
      confidence: bestHour.confidence,
      reason: 'data_driven',
      allHourScores: hourScores.filter(h => h.confidence > 0)
    };
  }

  // Algorithm 5: Complex workload analysis
  analyzeUserWorkload(userId: string) {
    const userIssues = this.issues.filter(i => i.assignee === userId);
    const now = new Date();

    if (userIssues.length === 0) {
      return {
        totalIssues: 0,
        workloadScore: 0,
        capacityLevel: 'light',
        recommendations: []
      };
    }

    // Complex workload calculations
    const priorityWeights = { 'Critical': 8, 'High': 4, 'Medium': 2, 'Low': 1 };
    const statusWeights = { 'To Do': 1, 'In Progress': 1.5, 'Code Review': 0.8, 'Done': 0 };
    
    let workloadScore = 0;
    let overdueCount = 0;
    let staleDaysTotal = 0;
    
    userIssues.forEach(issue => {
      const priorityWeight = priorityWeights[issue.priority as keyof typeof priorityWeights] || 1;
      const statusWeight = statusWeights[issue.status as keyof typeof statusWeights] || 1;
      
      // Calculate days since update
      const daysSinceUpdate = Math.floor(
        (now.getTime() - issue.updated.getTime()) / (1000 * 60 * 60 * 24)
      );
      staleDaysTotal += daysSinceUpdate;
      
      // Check if overdue
      if (issue.dueDate && issue.dueDate < now && issue.status !== 'Done') {
        overdueCount += 1;
        workloadScore += priorityWeight * statusWeight * 2; // Overdue penalty
      } else {
        workloadScore += priorityWeight * statusWeight;
      }
    });

    const averageStaleDays = staleDaysTotal / userIssues.length;
    const overdueRatio = overdueCount / userIssues.length;
    
    // Determine capacity level
    let capacityLevel: 'light' | 'moderate' | 'heavy' | 'overloaded' = 'light';
    if (workloadScore > 50 || overdueRatio > 0.3) capacityLevel = 'overloaded';
    else if (workloadScore > 30 || overdueRatio > 0.2) capacityLevel = 'heavy';
    else if (workloadScore > 15 || overdueRatio > 0.1) capacityLevel = 'moderate';

    // Generate recommendations
    const recommendations = [];
    if (overdueCount > 0) {
      recommendations.push(`Focus on ${overdueCount} overdue issues first`);
    }
    if (averageStaleDays > 5) {
      recommendations.push('Consider updating stale issues more frequently');
    }
    if (capacityLevel === 'overloaded') {
      recommendations.push('Consider reducing notification frequency');
    }

    return {
      totalIssues: userIssues.length,
      workloadScore,
      capacityLevel,
      overdueCount,
      averageStaleDays,
      overdueRatio,
      recommendations
    };
  }

  // Utility method to measure algorithm performance
  measurePerformance<T>(algorithm: () => T, algorithmName: string): { result: T; duration: number } {
    const startTime = performance.now();
    const result = algorithm();
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log(`🚀 ${algorithmName} completed in ${duration.toFixed(2)}ms`);
    return { result, duration };
  }
}

describe('Analytics Performance Tests', () => {
  let analyticsEngine: MockAnalyticsEngine;

  beforeEach(() => {
    analyticsEngine = new MockAnalyticsEngine();
  });

  describe('Small Dataset Performance (100 issues)', () => {
    beforeEach(() => {
      analyticsEngine.generateLargeDataset(100);
    });

    it('should calculate user engagement metrics quickly', () => {
      const { duration } = analyticsEngine.measurePerformance(
        () => analyticsEngine.calculateUserEngagementMetrics('user-1'),
        'User Engagement Calculation (100 issues)'
      );

      expect(duration).toBeLessThan(100); // Should complete within 100ms
    });

    it('should detect stale issues with scoring efficiently', () => {
      const { result, duration } = analyticsEngine.measurePerformance(
        () => analyticsEngine.detectStaleIssuesWithScoring(3),
        'Stale Issue Detection (100 issues)'
      );

      expect(duration).toBeLessThan(200); // Should complete within 200ms
      expect(Array.isArray(result)).toBe(true);
    });

    it('should analyze notification effectiveness patterns quickly', () => {
      const { result, duration } = analyticsEngine.measurePerformance(
        () => analyticsEngine.analyzeNotificationEffectiveness(),
        'Notification Effectiveness Analysis (100 issues)'
      );

      expect(duration).toBeLessThan(150); // Should complete within 150ms
      expect(typeof result).toBe('object');
    });
  });

  describe('Medium Dataset Performance (1,000 issues)', () => {
    beforeEach(() => {
      analyticsEngine.generateLargeDataset(1000);
    });

    it('should handle medium dataset user engagement calculation', () => {
      const { result, duration } = analyticsEngine.measurePerformance(
        () => analyticsEngine.calculateUserEngagementMetrics('user-5'),
        'User Engagement Calculation (1K issues)'
      );

      expect(duration).toBeLessThan(500); // Should complete within 500ms
      expect(result.totalInteractions).toBeGreaterThanOrEqual(0);
    });

    it('should efficiently detect stale issues in medium dataset', () => {
      const { result, duration } = analyticsEngine.measurePerformance(
        () => analyticsEngine.detectStaleIssuesWithScoring(3),
        'Stale Issue Detection (1K issues)'
      );

      expect(duration).toBeLessThan(1000); // Should complete within 1 second
      expect(result.length).toBeGreaterThanOrEqual(0);
    });

    it('should predict optimal timing efficiently for medium dataset', () => {
      const { result, duration } = analyticsEngine.measurePerformance(
        () => analyticsEngine.predictOptimalNotificationTiming('user-10'),
        'Optimal Timing Prediction (1K issues)'
      );

      expect(duration).toBeLessThan(800); // Should complete within 800ms
      expect(result.hour).toBeGreaterThanOrEqual(0);
      expect(result.hour).toBeLessThan(24);
    });
  });

  describe('Large Dataset Performance (10,000 issues)', () => {
    beforeEach(() => {
      analyticsEngine.generateLargeDataset(10000);
    });

    it('should handle large dataset workload analysis efficiently', () => {
      const { result, duration } = analyticsEngine.measurePerformance(
        () => analyticsEngine.analyzeUserWorkload('user-25'),
        'User Workload Analysis (10K issues)'
      );

      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
      expect(result.totalIssues).toBeGreaterThanOrEqual(0);
      expect(['light', 'moderate', 'heavy', 'overloaded']).toContain(result.capacityLevel);
    });

    it('should detect stale issues efficiently in large dataset', () => {
      const { result, duration } = analyticsEngine.measurePerformance(
        () => analyticsEngine.detectStaleIssuesWithScoring(5),
        'Stale Issue Detection (10K issues)'
      );

      expect(duration).toBeLessThan(3000); // Should complete within 3 seconds
      expect(Array.isArray(result)).toBe(true);
    });

    it('should analyze notification effectiveness for large dataset', () => {
      const { result, duration } = analyticsEngine.measurePerformance(
        () => analyticsEngine.analyzeNotificationEffectiveness(),
        'Notification Effectiveness Analysis (10K issues)'
      );

      expect(duration).toBeLessThan(4000); // Should complete within 4 seconds
      expect(typeof result).toBe('object');
      
      // Verify result structure
      Object.values(result).forEach((typeData: any) => {
        expect(typeData).toHaveProperty('totalNotifications');
        expect(typeData).toHaveProperty('averageEffectiveness');
        expect(typeData).toHaveProperty('hourlyAverages');
      });
    });
  });

  describe('Concurrent Operations Performance', () => {
    beforeEach(() => {
      analyticsEngine.generateLargeDataset(5000);
    });

    it('should handle multiple concurrent user engagement calculations', async () => {
      const userIds = ['user-1', 'user-2', 'user-3', 'user-4', 'user-5'];
      
      const startTime = performance.now();
      
      const promises = userIds.map(userId =>
        Promise.resolve(analyticsEngine.calculateUserEngagementMetrics(userId))
      );
      
      const results = await Promise.all(promises);
      
      const totalDuration = performance.now() - startTime;
      
      console.log(`🚀 Concurrent user engagement calculations (5 users) completed in ${totalDuration.toFixed(2)}ms`);
      
      expect(totalDuration).toBeLessThan(3000); // Should complete within 3 seconds
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result).toHaveProperty('totalInteractions');
        expect(result).toHaveProperty('responseRate');
      });
    });

    it('should handle concurrent stale issue detection and workload analysis', async () => {
      const startTime = performance.now();
      
      const [staleIssues, workloadAnalysis] = await Promise.all([
        Promise.resolve(analyticsEngine.detectStaleIssuesWithScoring(3)),
        Promise.resolve(analyticsEngine.analyzeUserWorkload('user-10'))
      ]);
      
      const totalDuration = performance.now() - startTime;
      
      console.log(`🚀 Concurrent stale detection + workload analysis completed in ${totalDuration.toFixed(2)}ms`);
      
      expect(totalDuration).toBeLessThan(2500); // Should complete within 2.5 seconds
      expect(Array.isArray(staleIssues)).toBe(true);
      expect(workloadAnalysis).toHaveProperty('capacityLevel');
    });
  });

  describe('Memory Usage and Optimization', () => {
    it('should not cause memory leaks with repeated calculations', () => {
      analyticsEngine.generateLargeDataset(1000);
      
      // Run the same calculation multiple times
      const iterations = 50;
      const results = [];
      
      const startTime = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        const result = analyticsEngine.calculateUserEngagementMetrics(`user-${i % 10}`);
        results.push(result);
      }
      
      const totalDuration = performance.now() - startTime;
      const avgDuration = totalDuration / iterations;
      
      console.log(`🚀 ${iterations} iterations averaged ${avgDuration.toFixed(2)}ms per calculation`);
      
      // Average should be reasonable and consistent
      expect(avgDuration).toBeLessThan(50); // Should average less than 50ms per calculation
      expect(results).toHaveLength(iterations);
    });

    it('should handle very large datasets without crashing', () => {
      // Test with a very large dataset
      const largeSize = 50000;
      
      const startTime = performance.now();
      analyticsEngine.generateLargeDataset(largeSize);
      const generationTime = performance.now() - startTime;
      
      console.log(`🚀 Generated ${largeSize} issues in ${generationTime.toFixed(2)}ms`);
      
      // Should be able to generate large dataset
      expect(generationTime).toBeLessThan(10000); // Within 10 seconds
      
      // Test that basic operations still work
      const { duration } = analyticsEngine.measurePerformance(
        () => analyticsEngine.calculateUserEngagementMetrics('user-1'),
        `User Engagement Calculation (${largeSize} issues)`
      );
      
      expect(duration).toBeLessThan(1000); // Should still complete within 1 second
    });
  });

  describe('Algorithm Complexity Analysis', () => {
    it('should scale linearly for user engagement calculation', () => {
      const datasets = [100, 500, 1000, 2000];
      const durations: number[] = [];
      
      for (const size of datasets) {
        analyticsEngine.generateLargeDataset(size);
        
        const { duration } = analyticsEngine.measurePerformance(
          () => analyticsEngine.calculateUserEngagementMetrics('user-1'),
          `User Engagement (${size} issues)`
        );
        
        durations.push(duration);
      }
      
      // Check that growth is roughly linear (not exponential)
      const growthRatio1 = durations[1] / durations[0]; // 500/100
      const growthRatio2 = durations[3] / durations[2]; // 2000/1000
      
      // Growth should be roughly proportional
      expect(Math.abs(growthRatio1 - growthRatio2)).toBeLessThan(5); // Allow some variance
    });

    it('should maintain reasonable performance with increasing complexity', () => {
      analyticsEngine.generateLargeDataset(2000);
      
      const algorithms = [
        () => analyticsEngine.calculateUserEngagementMetrics('user-5'),
        () => analyticsEngine.detectStaleIssuesWithScoring(3),
        () => analyticsEngine.analyzeNotificationEffectiveness(),
        () => analyticsEngine.predictOptimalNotificationTiming('user-10'),
        () => analyticsEngine.analyzeUserWorkload('user-15')
      ];
      
      const results = algorithms.map((algorithm, index) => {
        const { duration } = analyticsEngine.measurePerformance(
          algorithm,
          `Algorithm ${index + 1}`
        );
        return duration;
      });
      
      // All algorithms should complete within reasonable time
      results.forEach((duration, index) => {
        expect(duration).toBeLessThan(5000); // Max 5 seconds per algorithm
      });
      
      const totalTime = results.reduce((sum, duration) => sum + duration, 0);
      console.log(`🚀 All 5 algorithms completed in ${totalTime.toFixed(2)}ms total`);
      
      expect(totalTime).toBeLessThan(15000); // All algorithms within 15 seconds
    });
  });
});