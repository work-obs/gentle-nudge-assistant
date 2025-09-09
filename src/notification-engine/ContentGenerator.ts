/**
 * ContentGenerator - Creates encouraging, contextual reminder messages
 * Focuses on positive, supportive language that motivates rather than nags
 */

import * as _ from 'lodash';
import { format, differenceInDays, differenceInHours, isPast } from 'date-fns';

import {
  NotificationContent,
  NotificationContext,
  MessageTone,
  NotificationType,
  UserPreferences,
  JiraIssueData,
  ServiceResponse,
  GentleNudgeError,
  EncouragementStyle,
  TONE_KEYWORDS,
} from '../types';

interface MessageTemplate {
  id: string;
  type: NotificationType;
  tone: MessageTone;
  encouragementStyle: EncouragementStyle;
  templates: {
    title: string[];
    message: string[];
    actionText: string[];
  };
  variables: string[];
  conditions?: MessageCondition[];
}

interface MessageCondition {
  field: string;
  operator: 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains';
  value: any;
}

interface MessageVariables {
  issueKey: string;
  issueSummary: string;
  assigneeName: string;
  projectName: string;
  daysSinceUpdate: number;
  hoursUntilDeadline?: number;
  daysUntilDeadline?: number;
  priority: string;
  issueType: string;
  encouragementPhrase: string;
  personalGreeting: string;
  motivationalKeyword: string;
}

export class ContentGenerator {
  private messageTemplates: Map<string, MessageTemplate[]> = new Map();
  private encouragementPhrases: Record<EncouragementStyle, string[]>;
  private personalGreetings: string[];
  private motivationalKeywords: Record<MessageTone, string[]>;

  constructor() {
    this.initializeTemplates();
    this.initializeEncouragementPhrases();
    this.initializePersonalGreetings();
    this.initializeMotivationalKeywords();
  }

  /**
   * Generates notification content based on context and user preferences
   */
  async generateNotificationContent(
    context: NotificationContext,
    userPreferences: UserPreferences
  ): Promise<ServiceResponse<NotificationContent>> {
    try {
      const template = await this.selectBestTemplate(context, userPreferences);
      if (!template) {
        throw new Error('No suitable template found');
      }

      const variables = this.extractVariables(context, userPreferences);
      const content = this.populateTemplate(template, variables);

      return {
        success: true,
        data: content,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CONTENT_GENERATION_ERROR',
          message: 'Failed to generate notification content',
          details: error,
          timestamp: new Date(),
          issueKey: context.issueData.key,
          userId: userPreferences.userId,
        },
      };
    }
  }

  /**
   * Generates multiple content variations for A/B testing
   */
  async generateContentVariations(
    context: NotificationContext,
    userPreferences: UserPreferences,
    count: number = 3
  ): Promise<ServiceResponse<NotificationContent[]>> {
    try {
      const templates = await this.selectTemplateVariations(
        context,
        userPreferences,
        count
      );
      const variables = this.extractVariables(context, userPreferences);

      const variations = templates.map(template =>
        this.populateTemplate(template, variables)
      );

      return {
        success: true,
        data: variations,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'VARIATION_GENERATION_ERROR',
          message: 'Failed to generate content variations',
          details: error,
          timestamp: new Date(),
          issueKey: context.issueData.key,
          userId: userPreferences.userId,
        },
      };
    }
  }

  /**
   * Personalizes existing content based on user preferences and history
   */
  async personalizeContent(
    baseContent: NotificationContent,
    userPreferences: UserPreferences,
    context: NotificationContext
  ): Promise<ServiceResponse<NotificationContent>> {
    try {
      const personalizedContent = { ...baseContent };

      // Add personal greeting if user has one configured
      if (userPreferences.personalizedSettings.personalizedGreeting) {
        personalizedContent.title = `${userPreferences.personalizedSettings.personalizedGreeting} ${personalizedContent.title}`;
      }

      // Inject motivational keywords based on user preferences
      personalizedContent.message = this.injectMotivationalKeywords(
        personalizedContent.message,
        userPreferences.personalizedSettings.motivationalKeywords,
        userPreferences.personalizedSettings.preferredTone
      );

      // Adjust tone if needed
      if (
        personalizedContent.tone !==
        userPreferences.personalizedSettings.preferredTone
      ) {
        personalizedContent.message = await this.adjustTone(
          personalizedContent.message,
          personalizedContent.tone,
          userPreferences.personalizedSettings.preferredTone
        );
        personalizedContent.tone =
          userPreferences.personalizedSettings.preferredTone;
      }

      return {
        success: true,
        data: personalizedContent,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PERSONALIZATION_ERROR',
          message: 'Failed to personalize content',
          details: error,
          timestamp: new Date(),
          issueKey: context.issueData.key,
          userId: userPreferences.userId,
        },
      };
    }
  }

  private async selectBestTemplate(
    context: NotificationContext,
    userPreferences: UserPreferences
  ): Promise<MessageTemplate | null> {
    const candidateTemplates = this.messageTemplates.get(context.type) || [];

    // Filter by user preferences
    let suitableTemplates = candidateTemplates.filter(template => {
      // Match tone preference
      if (
        template.tone !== userPreferences.personalizedSettings.preferredTone
      ) {
        return false;
      }

      // Check conditions if any
      if (
        template.conditions &&
        !this.evaluateConditions(template.conditions, context)
      ) {
        return false;
      }

      return true;
    });

    // If no exact match, find compatible templates
    if (suitableTemplates.length === 0) {
      suitableTemplates = candidateTemplates.filter(template => {
        const compatibleTones = this.getCompatibleTones(
          userPreferences.personalizedSettings.preferredTone
        );
        return compatibleTones.includes(template.tone);
      });
    }

    // Select based on context and user workload
    return this.selectOptimalTemplate(
      suitableTemplates,
      context,
      userPreferences
    );
  }

  private async selectTemplateVariations(
    context: NotificationContext,
    userPreferences: UserPreferences,
    count: number
  ): Promise<MessageTemplate[]> {
    const allTemplates = this.messageTemplates.get(context.type) || [];

    // Get diverse templates with different tones and styles
    const variations = _.sampleSize(
      allTemplates,
      Math.min(count, allTemplates.length)
    );

    // If we don't have enough variations, generate some by modifying existing ones
    while (variations.length < count && allTemplates.length > 0) {
      const baseTemplate = _.sample(allTemplates)!;
      const modifiedTemplate = this.createTemplateVariation(baseTemplate);
      variations.push(modifiedTemplate);
    }

    return variations.slice(0, count);
  }

  private extractVariables(
    context: NotificationContext,
    userPreferences: UserPreferences
  ): MessageVariables {
    const issue = context.issueData;
    const daysSinceUpdate = differenceInDays(new Date(), issue.updated);

    let hoursUntilDeadline: number | undefined;
    let daysUntilDeadline: number | undefined;

    if (context.deadline) {
      hoursUntilDeadline = differenceInHours(
        context.deadline.dueDate,
        new Date()
      );
      daysUntilDeadline = Math.ceil(hoursUntilDeadline / 24);
    }

    return {
      issueKey: issue.key,
      issueSummary: this.truncateSummary(issue.summary),
      assigneeName: this.getDisplayName(issue.assignee),
      projectName: issue.project.name,
      daysSinceUpdate,
      hoursUntilDeadline,
      daysUntilDeadline,
      priority: issue.priority.toLowerCase(),
      issueType: issue.issueType.toLowerCase(),
      encouragementPhrase: this.selectEncouragementPhrase(
        userPreferences.personalizedSettings.encouragementStyle
      ),
      personalGreeting: this.selectPersonalGreeting(userPreferences),
      motivationalKeyword: this.selectMotivationalKeyword(
        userPreferences.personalizedSettings.preferredTone
      ),
    };
  }

  private populateTemplate(
    template: MessageTemplate,
    variables: MessageVariables
  ): NotificationContent {
    // Select random variations for title and message
    const titleTemplate = _.sample(template.templates.title) || '';
    const messageTemplate = _.sample(template.templates.message) || '';
    const actionTextTemplate =
      _.sample(template.templates.actionText) || 'View Issue';

    return {
      title: this.interpolateTemplate(titleTemplate, variables),
      message: this.interpolateTemplate(messageTemplate, variables),
      actionText: this.interpolateTemplate(actionTextTemplate, variables),
      actionUrl: `https://your-domain.atlassian.net/browse/${variables.issueKey}`,
      tone: template.tone,
      templateId: template.id,
      variables: variables as Record<string, any>,
    };
  }

  private interpolateTemplate(
    template: string,
    variables: MessageVariables
  ): string {
    let result = template;

    // Replace all variable placeholders
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{${key}}`;
      result = result.replace(new RegExp(placeholder, 'g'), String(value));
    });

    // Handle conditional text
    result = this.processConditionalText(result, variables);

    return result.trim();
  }

  private processConditionalText(
    text: string,
    variables: MessageVariables
  ): string {
    // Handle patterns like {daysSinceUpdate > 7 ? "quite a while" : "a few days"}
    const conditionalRegex = /\{([^}]+)\s*\?\s*"([^"]+)"\s*:\s*"([^"]+)"\}/g;

    return text.replace(
      conditionalRegex,
      (match, condition, trueText, falseText) => {
        try {
          // Simple condition evaluation (would be more robust in production)
          const conditionResult = this.evaluateSimpleCondition(
            condition,
            variables
          );
          return conditionResult ? trueText : falseText;
        } catch (error) {
          return falseText; // Default to false case on error
        }
      }
    );
  }

  private evaluateSimpleCondition(
    condition: string,
    variables: MessageVariables
  ): boolean {
    // Simple condition parsing for things like "daysSinceUpdate > 7"
    const parts = condition.trim().split(/\s+(>|<|>=|<=|==|!=)\s+/);
    if (parts.length !== 3) return false;

    const [field, operator, valueStr] = parts;
    const fieldValue = (variables as any)[field];
    const compareValue = parseFloat(valueStr);

    switch (operator) {
      case '>':
        return fieldValue > compareValue;
      case '<':
        return fieldValue < compareValue;
      case '>=':
        return fieldValue >= compareValue;
      case '<=':
        return fieldValue <= compareValue;
      case '==':
        return fieldValue == compareValue;
      case '!=':
        return fieldValue != compareValue;
      default:
        return false;
    }
  }

  private initializeTemplates(): void {
    // Stale Reminder Templates
    this.messageTemplates.set('stale-reminder', [
      {
        id: 'stale-cheerful-1',
        type: 'stale-reminder',
        tone: 'encouraging',
        encouragementStyle: 'cheerful',
        templates: {
          title: [
            '{encouragementPhrase} Time for a quick check-in! ⭐',
            'Your expertise is needed! ✨',
            '{personalGreeting} Ready for some progress? 🌟',
          ],
          message: [
            '{issueKey} ({issueSummary}) has been patiently waiting for {daysSinceUpdate > 7 ? "quite a while" : "a few days"}. When you have a moment, it would love some of your attention! Your insights always make a difference.',
            "Hey there! {issueKey} might benefit from a quick update. It's been {daysSinceUpdate} days since the last change, but no pressure - whenever you're ready! {motivationalKeyword}",
            "{issueKey} in {projectName} has been sitting quietly and could really use your expertise. Take your time, but when you're available, it would appreciate a status check! 🚀",
          ],
          actionText: [
            'Take a look! 👀',
            'Check it out ✨',
            "Let's do this! 💪",
          ],
        },
        variables: [
          'issueKey',
          'issueSummary',
          'daysSinceUpdate',
          'projectName',
          'encouragementPhrase',
          'personalGreeting',
          'motivationalKeyword',
        ],
      },
      {
        id: 'stale-supportive-1',
        type: 'stale-reminder',
        tone: 'encouraging',
        encouragementStyle: 'supportive',
        templates: {
          title: [
            "We're here to help you succeed 🤝",
            'Support available when you need it 💙',
            'Your success matters to us ❤️',
          ],
          message: [
            "{issueKey} ({issueSummary}) has been waiting for an update for {daysSinceUpdate} days. We know you've got a lot on your plate, so take it at your own pace. We're here if you need any support!",
            "Just a gentle reminder that {issueKey} in {projectName} could use your attention. No rush at all - we understand you're managing multiple priorities. Reach out if you need help!",
            '{issueKey} has been pending for {daysSinceUpdate} days. We believe in your ability to handle this perfectly when the time is right. Support is always available if needed! 🌈',
          ],
          actionText: ["I've got this 💪", 'Let me help 🤝', 'Show support 💙'],
        },
        variables: [
          'issueKey',
          'issueSummary',
          'daysSinceUpdate',
          'projectName',
        ],
      },
    ]);

    // Deadline Warning Templates
    this.messageTemplates.set('deadline-warning', [
      {
        id: 'deadline-motivational-1',
        type: 'deadline-warning',
        tone: 'encouraging',
        encouragementStyle: 'motivational',
        templates: {
          title: [
            "You've got this! 💪 Deadline approaching",
            'Almost there! 🚀 Final stretch time',
            'Finishing strong! ⚡ {daysUntilDeadline} days left',
          ],
          message: [
            "{issueKey} ({issueSummary}) is due in {daysUntilDeadline} days, but we have complete confidence you'll handle it perfectly! You've tackled challenging tasks before, and this one is no different. 💫",
            "Heads up! {issueKey} has a deadline approaching in {daysUntilDeadline} days. You're doing amazing work, and we know you'll cross the finish line with style. Keep up the great momentum! 🎯",
            'Just a friendly heads up - {issueKey} in {projectName} is due {daysUntilDeadline > 1 ? "in a few days" : "tomorrow"}. You\'ve got all the skills needed to nail this. Time to shine! ✨',
          ],
          actionText: [
            "Let's finish this! 🏁",
            'Time to shine! ✨',
            'Final push! 🚀',
          ],
        },
        variables: [
          'issueKey',
          'issueSummary',
          'daysUntilDeadline',
          'projectName',
        ],
      },
      {
        id: 'deadline-gentle-1',
        type: 'deadline-warning',
        tone: 'encouraging',
        encouragementStyle: 'gentle',
        templates: {
          title: [
            'Gentle reminder about upcoming deadline 🕒',
            'When you have time... deadline approaching 🌸',
            'No pressure, just a friendly FYI 💙',
          ],
          message: [
            "When you have a chance, {issueKey} ({issueSummary}) would appreciate some attention - it's due in {daysUntilDeadline} days. No rush, just keeping you informed so you can plan accordingly. 🌺",
            "Just a gentle FYI that {issueKey} has a deadline coming up in {daysUntilDeadline} days. Take your time and do your best work - that's what matters most. 🍃",
            'Thought you\'d like to know that {issueKey} in {projectName} is due {daysUntilDeadline > 1 ? "in a few days" : "tomorrow"}. Handle it whenever feels right for your schedule. 🌿',
          ],
          actionText: [
            "When I'm ready 🌸",
            'Take a peek 👀',
            'In my own time ⏰',
          ],
        },
        variables: [
          'issueKey',
          'issueSummary',
          'daysUntilDeadline',
          'projectName',
        ],
      },
    ]);

    // Achievement Recognition Templates
    this.messageTemplates.set('achievement-recognition', [
      {
        id: 'achievement-celebration-1',
        type: 'achievement-recognition',
        tone: 'encouraging',
        encouragementStyle: 'cheerful',
        templates: {
          title: [
            "Amazing work! 🎉 You're on fire!",
            'Fantastic progress! ⭐ Keep it up!',
            "You're crushing it! 💫 Well done!",
          ],
          message: [
            "Incredible job on your recent updates! You've been consistently moving {projectName} forward. {issueKey} is just one of many successes - you're making a real difference! 🌟",
            'Your dedication is showing! The progress on {issueKey} and other tickets has been outstanding. The whole team benefits from your excellent work ethic. Keep being awesome! 🎯',
            'What a star performer! Your recent activity on {issueKey} ({issueSummary}) shows exactly the kind of commitment that drives success. Thank you for being such a valuable team member! 🏆',
          ],
          actionText: [
            'Keep going! 🚀',
            'More success! ⭐',
            "I'm motivated! 💪",
          ],
        },
        variables: ['issueKey', 'issueSummary', 'projectName'],
      },
    ]);

    // Team Encouragement Templates
    this.messageTemplates.set('team-encouragement', [
      {
        id: 'team-motivation-1',
        type: 'team-encouragement',
        tone: 'encouraging',
        encouragementStyle: 'motivational',
        templates: {
          title: [
            "Team power! 💪 We're doing great!",
            'Collective success! 🌟 Keep it up!',
            'Team momentum! 🚀 Unstoppable!',
          ],
          message: [
            "The {projectName} team is doing incredible work! Our collective efforts are really paying off. A few tickets like {issueKey} could benefit from quick attention when team members are available. Together, we're unstoppable! 💫",
            "Amazing teamwork on {projectName}! Everyone's contributions are making a real difference. {issueKey} and similar items are ready for the next team member who has capacity. Great job everyone! 🎯",
            'Team spirit is high and results are showing! {issueKey} is among the tickets ready for our next wave of collaborative effort. Love seeing how we support each other! 🤝',
          ],
          actionText: [
            'Team effort! 🤝',
            "Let's do this! 💪",
            'For the team! 🌟',
          ],
        },
        variables: ['issueKey', 'projectName'],
      },
    ]);

    // Progress Update Templates
    this.messageTemplates.set('progress-update', [
      {
        id: 'progress-celebration-1',
        type: 'progress-update',
        tone: 'encouraging',
        encouragementStyle: 'supportive',
        templates: {
          title: [
            'Great momentum this week! 📈',
            "Progress report: You're doing amazing! ⭐",
            'Week in review: Solid work! 👏',
          ],
          message: [
            "What a productive week! You've made excellent progress across multiple areas. {issueKey} is one of the few remaining items that could use attention when you're ready. Your consistent effort is really appreciated! 🌟",
            "Loving the progress you've made! Your dedication to quality work really shows. {issueKey} ({issueSummary}) is waiting for your expertise when your schedule allows. Keep up the fantastic work! 🎯",
            'Your week has been filled with great achievements! Projects are moving forward thanks to your efforts. {issueKey} would benefit from your touch when you have a moment. Outstanding work as always! 🚀',
          ],
          actionText: [
            'Continue the streak! 📈',
            'Build on success! ⭐',
            'Keep momentum! 🚀',
          ],
        },
        variables: ['issueKey', 'issueSummary'],
      },
    ]);
  }

  private initializeEncouragementPhrases(): void {
    this.encouragementPhrases = {
      cheerful: [
        'Awesome work ahead!',
        'Time to shine!',
        "You've got this!",
        "Let's make magic happen!",
        'Ready to be amazing?',
      ],
      supportive: [
        "We're here to support you",
        "You're not alone in this",
        'We believe in you',
        'Take it at your own pace',
        "We've got your back",
      ],
      gentle: [
        "When you're ready",
        'No pressure at all',
        'In your own time',
        'Whenever it feels right',
        'At your convenience',
      ],
      motivational: [
        "Let's crush this!",
        'Time to dominate!',
        'Victory awaits!',
        'Champions finish strong!',
        'Excellence is calling!',
      ],
      professional: [
        'Your expertise is valued',
        'Quality work as always',
        'Professional excellence',
        'Maintaining high standards',
        'Commitment to success',
      ],
      friendly: [
        'Hey there, friend!',
        "Hope you're having a great day!",
        'Friendly check-in time!',
        'Just being a good teammate!',
        'Looking out for you!',
      ],
    };
  }

  private initializePersonalGreetings(): void {
    this.personalGreetings = [
      'Hey there!',
      'Hi friend!',
      'Good to see you!',
      "Hope you're well!",
      'Checking in with you!',
      'Ready for success?',
      'Time to make progress!',
    ];
  }

  private initializeMotivationalKeywords(): void {
    this.motivationalKeywords = {
      encouraging: TONE_KEYWORDS.encouraging,
      casual: [
        'no worries',
        'easy does it',
        'whenever',
        'chill',
        'take it easy',
      ],
      professional: TONE_KEYWORDS.professional,
    };
  }

  private truncateSummary(summary: string, maxLength: number = 60): string {
    if (summary.length <= maxLength) return summary;
    return summary.substring(0, maxLength - 3) + '...';
  }

  private getDisplayName(userKey: string): string {
    // In a real implementation, this would resolve the user key to a display name
    // For now, return a placeholder
    return userKey || 'Team member';
  }

  private selectEncouragementPhrase(style: EncouragementStyle): string {
    return _.sample(this.encouragementPhrases[style]) || 'Great work!';
  }

  private selectPersonalGreeting(userPreferences: UserPreferences): string {
    if (userPreferences.personalizedSettings.personalizedGreeting) {
      return userPreferences.personalizedSettings.personalizedGreeting;
    }
    return _.sample(this.personalGreetings) || 'Hi there!';
  }

  private selectMotivationalKeyword(tone: MessageTone): string {
    return _.sample(this.motivationalKeywords[tone]) || 'excellent';
  }

  private getCompatibleTones(preferredTone: MessageTone): MessageTone[] {
    // Define tone compatibility
    const compatibility: Record<MessageTone, MessageTone[]> = {
      encouraging: ['encouraging', 'casual'],
      casual: ['casual', 'encouraging'],
      professional: ['professional', 'encouraging'],
    };

    return compatibility[preferredTone] || [preferredTone];
  }

  private selectOptimalTemplate(
    templates: MessageTemplate[],
    context: NotificationContext,
    userPreferences: UserPreferences
  ): MessageTemplate | null {
    if (templates.length === 0) return null;

    // For now, select randomly from suitable templates
    // In production, this would use ML to select the most effective template
    return _.sample(templates) || null;
  }

  private evaluateConditions(
    conditions: MessageCondition[],
    context: NotificationContext
  ): boolean {
    return conditions.every(condition => {
      const fieldValue = this.getContextValue(condition.field, context);
      return this.evaluateCondition(
        fieldValue,
        condition.operator,
        condition.value
      );
    });
  }

  private getContextValue(field: string, context: NotificationContext): any {
    // Navigate nested object properties
    return _.get(context, field);
  }

  private evaluateCondition(
    fieldValue: any,
    operator: string,
    compareValue: any
  ): boolean {
    switch (operator) {
      case 'eq':
        return fieldValue === compareValue;
      case 'gt':
        return fieldValue > compareValue;
      case 'lt':
        return fieldValue < compareValue;
      case 'gte':
        return fieldValue >= compareValue;
      case 'lte':
        return fieldValue <= compareValue;
      case 'contains':
        return String(fieldValue).includes(String(compareValue));
      default:
        return false;
    }
  }

  private createTemplateVariation(
    baseTemplate: MessageTemplate
  ): MessageTemplate {
    // Create a variation of an existing template
    // This is a simplified implementation
    const variation = _.cloneDeep(baseTemplate);
    variation.id = `${baseTemplate.id}-var-${Date.now()}`;

    // Modify some aspects for variation
    if (variation.tone === 'encouraging') {
      variation.tone = 'casual';
    }

    return variation;
  }

  private injectMotivationalKeywords(
    message: string,
    keywords: string[],
    tone: MessageTone
  ): string {
    if (keywords.length === 0) return message;

    // Simple injection - would be more sophisticated in production
    const keyword = _.sample(keywords) || '';

    // Add the keyword naturally to the message
    if (keyword && !message.includes(keyword)) {
      return `${message} ${keyword}!`;
    }

    return message;
  }

  private async adjustTone(
    message: string,
    currentTone: MessageTone,
    targetTone: MessageTone
  ): Promise<string> {
    // In a real implementation, this would use NLP to adjust tone
    // For now, return the original message
    return message;
  }
}
