"use strict";
/**
 * Analytics System Usage Examples
 *
 * This file demonstrates how to use the Gentle Nudge Assistant analytics system
 * with various configuration options and common use cases.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.basicAnalyticsExample = basicAnalyticsExample;
exports.customConfigurationExample = customConfigurationExample;
exports.batchAnalysisExample = batchAnalysisExample;
exports.projectAnalyticsExample = projectAnalyticsExample;
exports.performanceMonitoringExample = performanceMonitoringExample;
exports.engineComparisonExample = engineComparisonExample;
exports.runAllExamples = runAllExamples;
const analytics_1 = require("../src/analytics");
/**
 * Example 1: Basic analytics engine setup
 */
async function basicAnalyticsExample() {
    console.log('=== Basic Analytics Example ===');
    // Create analytics engine with default configuration
    const engine = (0, analytics_1.createAnalyticsEngine)();
    // Example issue data (would typically come from Jira API)
    const mockIssue = {
        id: '12345',
        key: 'PROJ-123',
        fields: {
            summary: 'Implement user authentication',
            description: 'Add OAuth2 authentication to the application',
            status: {
                name: 'In Progress',
                statusCategory: {
                    key: 'indeterminate',
                    colorName: 'yellow'
                }
            },
            priority: {
                name: 'High',
                id: '2'
            },
            issuetype: {
                name: 'Story',
                id: '10001'
            },
            assignee: {
                accountId: 'user123',
                displayName: 'Jane Developer',
                emailAddress: 'jane@example.com'
            },
            reporter: {
                accountId: 'manager123',
                displayName: 'John Manager'
            },
            project: {
                id: '10000',
                key: 'PROJ',
                name: 'Sample Project'
            },
            created: '2024-01-15T10:00:00.000Z',
            updated: '2024-01-20T14:30:00.000Z',
            duedate: '2024-02-01',
            labels: ['frontend', 'security'],
            components: [
                { id: '10100', name: 'Authentication' }
            ],
            fixVersions: [
                { id: '10200', name: 'v2.0.0', releaseDate: '2024-02-15' }
            ],
            customfield_10016: 8 // Story points
        }
    };
    try {
        // Analyze a single issue
        const result = await engine.analyzeIssue(mockIssue);
        console.log('Analysis Result:', {
            issueKey: result.issueKey,
            overallScore: result.overallScore,
            isStale: result.staleness.isStale,
            urgency: result.recommendedAction.urgency,
            shouldNotify: result.workload.shouldNotify
        });
        // Get performance metrics
        const metrics = engine.getPerformanceMetrics();
        console.log('Performance Metrics:', metrics);
    }
    catch (error) {
        console.error('Analysis failed:', error);
    }
}
/**
 * Example 2: Custom configuration for a development team
 */
async function customConfigurationExample() {
    console.log('\n=== Custom Configuration Example ===');
    // Custom configuration for a fast-paced development team
    const customConfig = {
        staleness: {
            thresholds: {
                fresh: 1, // Issues become aging after 1 day
                aging: 3, // Issues become stale after 3 days
                stale: 7, // Issues become very stale after 7 days
                veryStale: 14, // Issues become abandoned after 14 days
                abandoned: 30
            },
            priorityMultipliers: {
                'Blocker': 0.2, // Blockers age very fast
                'Critical': 0.3,
                'High': 0.6,
                'Medium': 1.0,
                'Low': 1.5,
                'Lowest': 2.0 // Low priority can age much longer
            }
        },
        workload: {
            capacityThresholds: {
                optimal: 5, // Lower threshold for focused team
                nearCapacity: 8,
                overCapacity: 12
            },
            notificationLimits: {
                daily: 5, // More notifications allowed
                weekly: 25,
                perIssue: 3
            }
        },
        general: {
            enabledComponents: {
                staleness: true,
                deadlines: true,
                context: true,
                workload: true
            },
            batchSizes: {
                issueAnalysis: 30, // Smaller batches for responsive analysis
                userAnalysis: 15,
                apiRequests: 75
            }
        }
    };
    // Validate configuration before use
    const validation = (0, analytics_1.validateAnalyticsConfiguration)({
        ...analytics_1.DEFAULT_ANALYTICS_CONFIG,
        ...customConfig
    });
    if (!validation.valid) {
        console.error('Configuration validation failed:', validation.errors);
        return;
    }
    const engine = (0, analytics_1.createAnalyticsEngine)(customConfig);
    console.log('Custom analytics engine created successfully');
    console.log('Configuration:', engine.getConfiguration());
}
/**
 * Example 3: Batch analysis for project health monitoring
 */
async function batchAnalysisExample() {
    console.log('\n=== Batch Analysis Example ===');
    const engine = (0, analytics_1.createAnalyticsEngine)();
    try {
        // Find issues needing attention across multiple projects
        const results = await engine.findIssuesNeedingAttention({
            projectIds: ['PROJ', 'DEV', 'SUPPORT'],
            maxResults: 100,
            analysisTypes: ['staleness', 'deadlines']
        });
        console.log('Issues Analysis Summary:');
        console.log(`High Priority: ${results.highPriority.length} issues`);
        console.log(`Medium Priority: ${results.medium.length} issues`);
        console.log(`Upcoming: ${results.upcoming.length} issues`);
        console.log('\nInsights:');
        console.log(`Total Analyzed: ${results.insights.totalAnalyzed}`);
        console.log(`Average Score: ${results.insights.averageScore.toFixed(2)}`);
        console.log(`Critical Issues: ${results.insights.criticalCount}`);
        console.log('\nRecommendations:');
        results.insights.recommendations.forEach(rec => {
            console.log(`- ${rec}`);
        });
    }
    catch (error) {
        console.error('Batch analysis failed:', error);
    }
}
/**
 * Example 4: Project analytics dashboard
 */
async function projectAnalyticsExample() {
    console.log('\n=== Project Analytics Example ===');
    const engine = (0, analytics_1.createAnalyticsEngine)();
    try {
        const projectAnalytics = await engine.getProjectAnalytics('PROJ');
        console.log('Project Overview:');
        console.log(`Total Issues: ${projectAnalytics.overview.totalIssues}`);
        console.log(`Stale Issues: ${projectAnalytics.overview.staleIssues}`);
        console.log(`Overdue Issues: ${projectAnalytics.overview.overdueIssues}`);
        console.log(`High Priority: ${projectAnalytics.overview.highPriorityIssues}`);
        console.log('\nTrends:');
        console.log('Staleness Distribution:', projectAnalytics.trends.stalenessDistribution);
        console.log('Urgency Distribution:', projectAnalytics.trends.urgencyDistribution);
        console.log('\nTeam Insights:');
        console.log(`Collaboration Score: ${projectAnalytics.teamInsights.collaborationScore}`);
        console.log('\nRecommendations:');
        projectAnalytics.recommendations.forEach(rec => {
            console.log(`- ${rec}`);
        });
    }
    catch (error) {
        console.error('Project analytics failed:', error);
    }
}
/**
 * Example 5: Performance monitoring and optimization
 */
async function performanceMonitoringExample() {
    console.log('\n=== Performance Monitoring Example ===');
    // Create high-volume engine for performance testing
    const engine = (0, analytics_1.createHighVolumeAnalyticsEngine)();
    console.log('Initial Cache Stats:', engine.getCacheStats());
    // Simulate some analysis work
    const mockIssues = Array.from({ length: 50 }, (_, i) => ({
        id: `${i + 1}`,
        key: `TEST-${i + 1}`,
        fields: {
            summary: `Test issue ${i + 1}`,
            status: { name: 'Open', statusCategory: { key: 'new', colorName: 'blue-gray' } },
            priority: { name: 'Medium', id: '3' },
            issuetype: { name: 'Task', id: '10003' },
            reporter: { accountId: 'reporter', displayName: 'Reporter' },
            project: { id: '10000', key: 'TEST', name: 'Test Project' },
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            labels: [],
            components: [],
            fixVersions: []
        }
    }));
    const startTime = performance.now();
    try {
        // Batch analyze issues
        const batchRequest = {
            issueKeys: mockIssues.map(issue => issue.key),
            analysisType: 'staleness_only',
            priority: 'normal',
            requestId: 'performance-test-1',
            timestamp: new Date()
        };
        const result = await engine.batchAnalyzeIssues(batchRequest);
        const endTime = performance.now();
        console.log(`Analyzed ${result.results.length} issues in ${(endTime - startTime).toFixed(2)}ms`);
        console.log(`Average time per issue: ${(result.processingTime / result.results.length).toFixed(2)}ms`);
        console.log(`Errors: ${result.errors.length}`);
        // Show performance metrics
        const metrics = engine.getPerformanceMetrics();
        console.log('Performance Metrics:', {
            averageAnalysisTime: `${metrics.analysisTime.average.toFixed(2)}ms`,
            maxAnalysisTime: `${metrics.analysisTime.max.toFixed(2)}ms`,
            minAnalysisTime: `${metrics.analysisTime.min.toFixed(2)}ms`,
            errorRate: `${(metrics.errorRate * 100).toFixed(2)}%`
        });
        // Show cache effectiveness
        console.log('Final Cache Stats:', engine.getCacheStats());
    }
    catch (error) {
        console.error('Performance test failed:', error);
    }
}
/**
 * Example 6: Different engine types comparison
 */
async function engineComparisonExample() {
    console.log('\n=== Engine Types Comparison ===');
    const engines = {
        minimal: (0, analytics_1.createMinimalAnalyticsEngine)(),
        standard: (0, analytics_1.createAnalyticsEngine)(),
        highVolume: (0, analytics_1.createHighVolumeAnalyticsEngine)()
    };
    console.log('Engine Configurations:');
    Object.entries(engines).forEach(([type, engine]) => {
        const config = engine.getConfiguration();
        console.log(`${type}:`, {
            enabledComponents: config.general.enabledComponents,
            batchSizes: config.general.batchSizes,
            cacheTTL: config.general.cacheSettings
        });
    });
}
/**
 * Run all examples
 */
async function runAllExamples() {
    console.log('🚀 Gentle Nudge Assistant Analytics System Examples\n');
    try {
        await basicAnalyticsExample();
        await customConfigurationExample();
        await batchAnalysisExample();
        await projectAnalyticsExample();
        await performanceMonitoringExample();
        await engineComparisonExample();
        console.log('\n✅ All examples completed successfully!');
    }
    catch (error) {
        console.error('❌ Example execution failed:', error);
    }
}
// Run examples if this file is executed directly
if (require.main === module) {
    runAllExamples().catch(console.error);
}
//# sourceMappingURL=analytics-usage.js.map