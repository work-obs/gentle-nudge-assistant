/**
 * ContextAnalyzer - Analyzes issue priority, type, and project importance
 * 
 * This component provides context-aware analysis by evaluating:
 * - Issue priority levels and their business significance
 * - Issue types and their complexity/importance
 * - Project importance and stakeholder visibility
 * - Business impact and technical complexity assessment
 */

import { 
  JiraIssue, 
  ContextAnalysis, 
  ContextConfig,
  BusinessImpact,
  TechnicalComplexity,
  StakeholderVisibility,
  ContextualFactors,
  AnalyticsCache 
} from '../types/analytics';

export class ContextAnalyzer {
  private config: ContextConfig;
  private cache: AnalyticsCache;

  constructor(config: ContextConfig, cache: AnalyticsCache) {
    this.config = config;
    this.cache = cache;
  }

  /**
   * Analyzes the context and importance of an issue
   */
  async analyzeContext(issue: JiraIssue): Promise<ContextAnalysis> {
    const priorityScore = this.calculatePriorityScore(issue);
    const typeScore = this.calculateTypeScore(issue);
    const projectImportance = await this.calculateProjectImportance(issue);
    
    const businessImpact = await this.analyzeBusinessImpact(issue);
    const technicalComplexity = await this.analyzeTechnicalComplexity(issue);
    const stakeholderVisibility = await this.analyzeStakeholderVisibility(issue);
    const contextualFactors = await this.analyzeContextualFactors(issue);

    return {
      priorityScore,
      typeScore,
      projectImportance,
      businessImpact,
      technicalComplexity,
      stakeholderVisibility,
      contextualFactors
    };
  }

  /**
   * Batch analyze multiple issues for context
   */
  async batchAnalyzeContext(issues: JiraIssue[]): Promise<Map<string, ContextAnalysis>> {
    const results = new Map<string, ContextAnalysis>();
    const batchSize = 50;
    
    for (let i = 0; i < issues.length; i += batchSize) {
      const batch = issues.slice(i, i + batchSize);
      const batchPromises = batch.map(async (issue) => {
        try {
          const analysis = await this.analyzeContext(issue);
          return { key: issue.key, analysis };
        } catch (error) {
          console.warn(`Failed to analyze context for ${issue.key}:`, error);
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
   * Calculates priority-based importance score
   */
  private calculatePriorityScore(issue: JiraIssue): number {
    const priorityName = issue.fields.priority.name;
    const baseScore = this.config.priorityWeights[priorityName] || 0.5;
    
    // Apply contextual modifiers
    let modifier = 1.0;
    
    // Security issues get priority boost
    if (this.isSecurityRelated(issue)) {
      modifier *= 1.3;
    }
    
    // Customer-facing issues get priority boost
    if (this.isCustomerFacing(issue)) {
      modifier *= 1.2;
    }
    
    // Blocking issues get significant boost
    if (this.isBlocking(issue)) {
      modifier *= 1.5;
    }
    
    return Math.min(1.0, baseScore * modifier);
  }

  /**
   * Calculates type-based importance score
   */
  private calculateTypeScore(issue: JiraIssue): number {
    const issueType = issue.fields.issuetype.name;
    const baseScore = this.config.issueTypeWeights[issueType] || 0.5;
    
    // Apply contextual modifiers based on issue content
    let modifier = 1.0;
    
    const summary = issue.fields.summary.toLowerCase();
    const description = issue.fields.description?.toLowerCase() || '';
    
    // Bug severity indicators
    if (issueType === 'Bug') {
      if (summary.includes('crash') || summary.includes('critical') || summary.includes('blocker')) {
        modifier *= 1.4;
      } else if (summary.includes('performance') || summary.includes('slow')) {
        modifier *= 1.2;
      } else if (summary.includes('ui') || summary.includes('cosmetic')) {
        modifier *= 0.8;
      }
    }
    
    // Story complexity indicators
    if (issueType === 'Story') {
      if (description.includes('integration') || description.includes('api')) {
        modifier *= 1.3;
      }
      if (issue.fields.customfield_10016 && issue.fields.customfield_10016 > 8) { // High story points
        modifier *= 1.2;
      }
    }
    
    // Epic importance
    if (issueType === 'Epic') {
      modifier *= 1.5; // Epics are inherently more important
    }
    
    return Math.min(1.0, baseScore * modifier);
  }

  /**
   * Calculates project-level importance
   */
  private async calculateProjectImportance(issue: JiraIssue): Promise<number> {
    const projectId = issue.fields.project.id;
    const projectKey = issue.fields.project.key;
    
    // Check cache first
    const cached = this.cache.projects.get(projectId);
    if (cached && cached.expiresAt > new Date()) {
      return this.getProjectImportanceFromCache(cached);
    }
    
    // Calculate project importance based on available data
    const baseScore = this.config.projectImportanceWeights[projectKey] || 0.5;
    
    // Factors that increase project importance
    let modifier = 1.0;
    
    // Project name indicators
    const projectName = issue.fields.project.name.toLowerCase();
    if (projectName.includes('core') || projectName.includes('platform')) {
      modifier *= 1.3;
    }
    if (projectName.includes('customer') || projectName.includes('client')) {
      modifier *= 1.2;
    }
    if (projectName.includes('internal') || projectName.includes('tool')) {
      modifier *= 0.9;
    }
    
    return Math.min(1.0, baseScore * modifier);
  }

  /**
   * Analyzes business impact of the issue
   */
  private async analyzeBusinessImpact(issue: JiraIssue): Promise<BusinessImpact> {
    const customerFacing = this.isCustomerFacing(issue);
    const revenueImpact = this.assessRevenueImpact(issue);
    const userImpact = this.calculateUserImpact(issue);
    const blockingOtherWork = this.isBlocking(issue);
    const dependentIssuesCount = await this.countDependentIssues(issue);

    return {
      customerFacing,
      revenueImpact,
      userImpact,
      blockingOtherWork,
      dependentIssuesCount
    };
  }

  /**
   * Analyzes technical complexity of the issue
   */
  private async analyzeTechnicalComplexity(issue: JiraIssue): Promise<TechnicalComplexity> {
    const estimatedEffort = this.estimateEffort(issue);
    const skillsRequired = this.identifyRequiredSkills(issue);
    const componentComplexity = this.assessComponentComplexity(issue);
    const testingRequirements = this.assessTestingRequirements(issue);

    return {
      estimatedEffort,
      skillsRequired,
      componentComplexity,
      testingRequirements
    };
  }

  /**
   * Analyzes stakeholder visibility
   */
  private async analyzeStakeholderVisibility(issue: JiraIssue): Promise<StakeholderVisibility> {
    const executiveVisibility = this.hasExecutiveVisibility(issue);
    const customerVisibility = this.hasCustomerVisibility(issue);
    const partnerVisibility = this.hasPartnerVisibility(issue);
    const communityVisibility = this.hasCommunityVisibility(issue);
    
    // Calculate overall visibility score
    const visibilityScore = [
      executiveVisibility ? 0.4 : 0,
      customerVisibility ? 0.3 : 0,
      partnerVisibility ? 0.2 : 0,
      communityVisibility ? 0.1 : 0
    ].reduce((sum, score) => sum + score, 0);

    return {
      executiveVisibility,
      customerVisibility,
      partnerVisibility,
      communityVisibility,
      visibilityScore
    };
  }

  /**
   * Analyzes contextual factors that affect issue importance
   */
  private async analyzeContextualFactors(issue: JiraIssue): Promise<ContextualFactors> {
    const isBlocking = this.isBlocking(issue);
    const isSecurityRelated = this.isSecurityRelated(issue);
    const isPerformanceCritical = this.isPerformanceCritical(issue);
    const hasExternalDependencies = this.hasExternalDependencies(issue);
    const requiresSpecializedSkills = this.requiresSpecializedSkills(issue);
    const isPartOfEpic = this.isPartOfEpic(issue);
    const epicPriority = isPartOfEpic ? await this.getEpicPriority(issue) : undefined;

    return {
      isBlocking,
      isSecurityRelated,
      isPerformanceCritical,
      hasExternalDependencies,
      requiresSpecializedSkills,
      isPartOfEpic,
      epicPriority
    };
  }

  // Helper methods for context analysis

  private isSecurityRelated(issue: JiraIssue): boolean {
    const text = `${issue.fields.summary} ${issue.fields.description || ''}`.toLowerCase();
    const securityKeywords = [
      'security', 'vulnerability', 'exploit', 'authentication', 'authorization',
      'encryption', 'ssl', 'tls', 'xss', 'csrf', 'injection', 'breach'
    ];
    
    return securityKeywords.some(keyword => text.includes(keyword)) ||
           issue.fields.labels.some(label => label.toLowerCase().includes('security'));
  }

  private isCustomerFacing(issue: JiraIssue): boolean {
    const text = `${issue.fields.summary} ${issue.fields.description || ''}`.toLowerCase();
    const customerKeywords = [
      'customer', 'user interface', 'ui', 'frontend', 'user experience', 'ux',
      'website', 'app', 'mobile', 'dashboard', 'portal'
    ];
    
    return customerKeywords.some(keyword => text.includes(keyword)) ||
           issue.fields.labels.some(label => label.toLowerCase().includes('customer'));
  }

  private isBlocking(issue: JiraIssue): boolean {
    const text = `${issue.fields.summary} ${issue.fields.description || ''}`.toLowerCase();
    return text.includes('blocking') || text.includes('blocker') ||
           issue.fields.priority.name === 'Blocker' ||
           issue.fields.labels.some(label => label.toLowerCase().includes('blocking'));
  }

  private isPerformanceCritical(issue: JiraIssue): boolean {
    const text = `${issue.fields.summary} ${issue.fields.description || ''}`.toLowerCase();
    const performanceKeywords = [
      'performance', 'slow', 'timeout', 'latency', 'speed', 'optimization',
      'memory', 'cpu', 'database', 'query', 'cache'
    ];
    
    return performanceKeywords.some(keyword => text.includes(keyword));
  }

  private hasExternalDependencies(issue: JiraIssue): boolean {
    const text = `${issue.fields.summary} ${issue.fields.description || ''}`.toLowerCase();
    const dependencyKeywords = [
      'third party', 'external', 'api', 'integration', 'vendor',
      'partner', 'dependency', 'library', 'framework'
    ];
    
    return dependencyKeywords.some(keyword => text.includes(keyword));
  }

  private requiresSpecializedSkills(issue: JiraIssue): boolean {
    const text = `${issue.fields.summary} ${issue.fields.description || ''}`.toLowerCase();
    const specializedKeywords = [
      'machine learning', 'ai', 'blockchain', 'devops', 'infrastructure',
      'algorithm', 'data science', 'analytics', 'architecture'
    ];
    
    return specializedKeywords.some(keyword => text.includes(keyword));
  }

  private isPartOfEpic(issue: JiraIssue): boolean {
    // In real implementation, would check parent/epic links
    return issue.fields.issuetype.name === 'Story' || issue.fields.issuetype.name === 'Task';
  }

  private assessRevenueImpact(issue: JiraIssue): BusinessImpact['revenueImpact'] {
    const text = `${issue.fields.summary} ${issue.fields.description || ''}`.toLowerCase();
    
    if (text.includes('payment') || text.includes('billing') || text.includes('revenue')) {
      return 'critical';
    }
    if (text.includes('customer') || text.includes('sales')) {
      return 'high';
    }
    if (text.includes('feature') || text.includes('enhancement')) {
      return 'medium';
    }
    if (text.includes('internal') || text.includes('tool')) {
      return 'low';
    }
    
    return 'none';
  }

  private calculateUserImpact(issue: JiraIssue): number {
    let impact = 0.5; // Base impact
    
    // Issue type influence
    if (issue.fields.issuetype.name === 'Bug') {
      impact += 0.2;
    }
    
    // Priority influence
    const priorityBoost = {
      'Blocker': 0.4,
      'Critical': 0.3,
      'High': 0.2,
      'Medium': 0.1,
      'Low': 0,
      'Lowest': -0.1
    };
    impact += priorityBoost[issue.fields.priority.name as keyof typeof priorityBoost] || 0;
    
    // Customer-facing boost
    if (this.isCustomerFacing(issue)) {
      impact += 0.2;
    }
    
    return Math.max(0, Math.min(1, impact));
  }

  private estimateEffort(issue: JiraIssue): number {
    // Use story points if available
    if (issue.fields.customfield_10016) {
      return issue.fields.customfield_10016;
    }
    
    // Estimate based on issue type and complexity indicators
    const baseEffort = {
      'Epic': 20,
      'Story': 5,
      'Task': 3,
      'Bug': 2,
      'Sub-task': 1
    };
    
    let effort = baseEffort[issue.fields.issuetype.name as keyof typeof baseEffort] || 3;
    
    // Adjust based on complexity indicators
    const text = `${issue.fields.summary} ${issue.fields.description || ''}`.toLowerCase();
    if (text.includes('complex') || text.includes('architecture')) {
      effort *= 1.5;
    }
    if (text.includes('simple') || text.includes('quick')) {
      effort *= 0.7;
    }
    
    return Math.round(effort);
  }

  private identifyRequiredSkills(issue: JiraIssue): string[] {
    const text = `${issue.fields.summary} ${issue.fields.description || ''}`.toLowerCase();
    const skills: string[] = [];
    
    // Technical skills
    if (text.includes('frontend') || text.includes('ui') || text.includes('react')) {
      skills.push('Frontend Development');
    }
    if (text.includes('backend') || text.includes('api') || text.includes('server')) {
      skills.push('Backend Development');
    }
    if (text.includes('database') || text.includes('sql')) {
      skills.push('Database');
    }
    if (text.includes('devops') || text.includes('deployment') || text.includes('infrastructure')) {
      skills.push('DevOps');
    }
    if (text.includes('security') || text.includes('authentication')) {
      skills.push('Security');
    }
    if (text.includes('design') || text.includes('ux')) {
      skills.push('Design');
    }
    
    return skills;
  }

  private assessComponentComplexity(issue: JiraIssue): TechnicalComplexity['componentComplexity'] {
    const componentCount = issue.fields.components.length;
    const text = `${issue.fields.summary} ${issue.fields.description || ''}`.toLowerCase();
    
    if (text.includes('architecture') || text.includes('system') || componentCount > 3) {
      return 'architectural';
    }
    if (text.includes('integration') || text.includes('complex') || componentCount > 1) {
      return 'complex';
    }
    if (componentCount === 1) {
      return 'moderate';
    }
    
    return 'simple';
  }

  private assessTestingRequirements(issue: JiraIssue): TechnicalComplexity['testingRequirements'] {
    const text = `${issue.fields.summary} ${issue.fields.description || ''}`.toLowerCase();
    
    if (this.isSecurityRelated(issue) || text.includes('critical')) {
      return 'critical';
    }
    if (text.includes('integration') || text.includes('api')) {
      return 'extensive';
    }
    if (issue.fields.issuetype.name === 'Bug') {
      return 'standard';
    }
    
    return 'minimal';
  }

  private hasExecutiveVisibility(issue: JiraIssue): boolean {
    const text = `${issue.fields.summary} ${issue.fields.description || ''}`.toLowerCase();
    return text.includes('executive') || text.includes('ceo') || text.includes('strategic') ||
           issue.fields.labels.some(label => label.toLowerCase().includes('executive'));
  }

  private hasCustomerVisibility(issue: JiraIssue): boolean {
    return this.isCustomerFacing(issue) || 
           issue.fields.labels.some(label => label.toLowerCase().includes('customer'));
  }

  private hasPartnerVisibility(issue: JiraIssue): boolean {
    const text = `${issue.fields.summary} ${issue.fields.description || ''}`.toLowerCase();
    return text.includes('partner') || text.includes('integration') ||
           issue.fields.labels.some(label => label.toLowerCase().includes('partner'));
  }

  private hasCommunityVisibility(issue: JiraIssue): boolean {
    const text = `${issue.fields.summary} ${issue.fields.description || ''}`.toLowerCase();
    return text.includes('community') || text.includes('open source') ||
           issue.fields.labels.some(label => label.toLowerCase().includes('community'));
  }

  private async countDependentIssues(issue: JiraIssue): Promise<number> {
    // In real implementation, would query for linked issues
    // For now, estimate based on issue characteristics
    if (issue.fields.issuetype.name === 'Epic') return 5;
    if (this.isBlocking(issue)) return 2;
    return 0;
  }

  private async getEpicPriority(issue: JiraIssue): Promise<number> {
    // In real implementation, would fetch epic details
    // For now, use issue priority as proxy
    const priorityScores = {
      'Blocker': 5,
      'Critical': 4,
      'High': 3,
      'Medium': 2,
      'Low': 1,
      'Lowest': 0
    };
    
    return priorityScores[issue.fields.priority.name as keyof typeof priorityScores] || 2;
  }

  private getProjectImportanceFromCache(cached: any): number {
    // Extract importance from cached project data
    const teamCapacity = cached.teamMetrics.teamCapacity;
    const baseScore = teamCapacity === 'healthy' ? 0.8 : 0.5;
    return baseScore;
  }

  /**
   * Updates context analysis configuration
   */
  updateConfiguration(newConfig: Partial<ContextConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Gets current configuration
   */
  getConfiguration(): ContextConfig {
    return { ...this.config };
  }

  /**
   * Finds high-context issues that need prioritized attention
   */
  async findHighContextIssues(issues: JiraIssue[]): Promise<{
    highBusiness: JiraIssue[];
    highTechnical: JiraIssue[];
    highVisibility: JiraIssue[];
    blocking: JiraIssue[];
  }> {
    const analyses = await this.batchAnalyzeContext(issues);
    
    const highBusiness: JiraIssue[] = [];
    const highTechnical: JiraIssue[] = [];
    const highVisibility: JiraIssue[] = [];
    const blocking: JiraIssue[] = [];
    
    for (const issue of issues) {
      const analysis = analyses.get(issue.key);
      if (!analysis) continue;
      
      if (analysis.businessImpact.revenueImpact === 'high' || 
          analysis.businessImpact.revenueImpact === 'critical') {
        highBusiness.push(issue);
      }
      
      if (analysis.technicalComplexity.componentComplexity === 'architectural' ||
          analysis.technicalComplexity.testingRequirements === 'critical') {
        highTechnical.push(issue);
      }
      
      if (analysis.stakeholderVisibility.visibilityScore > 0.3) {
        highVisibility.push(issue);
      }
      
      if (analysis.contextualFactors.isBlocking) {
        blocking.push(issue);
      }
    }
    
    return { highBusiness, highTechnical, highVisibility, blocking };
  }
}