/**
 * ToneAnalyzer - Ensures all messages maintain positive, encouraging tone
 * Analyzes and validates message content for appropriate sentiment and encouragement
 */

import * as _ from 'lodash';

import {
  NotificationContent,
  MessageTone,
  EncouragementStyle,
  ServiceResponse,
  GentleNudgeError,
  TONE_KEYWORDS
} from '../types';

interface ToneAnalysisResult {
  score: number; // 0-1, higher is more positive
  tone: MessageTone;
  encouragementLevel: number; // 0-1, higher is more encouraging
  sentiment: 'positive' | 'neutral' | 'negative';
  suggestions: string[];
  flaggedWords: string[];
  replacementSuggestions: Array<{
    original: string;
    suggested: string;
    reason: string;
  }>;
}

interface ToneProfile {
  positiveWords: string[];
  negativeWords: string[];
  encouragingPhrases: string[];
  discouragingPhrases: string[];
  neutralWords: string[];
  urgencyWords: string[];
  pressureWords: string[];
}

interface MessageMetrics {
  wordCount: number;
  positiveWordCount: number;
  negativeWordCount: number;
  encouragingPhraseCount: number;
  discouragingPhraseCount: number;
  urgencyWordCount: number;
  pressureWordCount: number;
  exclamationCount: number;
  questionCount: number;
  readabilityScore: number;
}

interface ToneRule {
  id: string;
  description: string;
  condition: (metrics: MessageMetrics, content: NotificationContent) => boolean;
  severity: 'error' | 'warning' | 'info';
  suggestion: string;
  autoFix?: (content: string) => string;
}

export class ToneAnalyzer {
  private toneProfiles: Map<MessageTone, ToneProfile> = new Map();
  private toneRules: ToneRule[] = [];
  private encouragementPatterns: Map<EncouragementStyle, RegExp[]> = new Map();
  private bannedPhrases: string[] = [];
  private replacementDictionary: Map<string, string[]> = new Map();

  constructor() {
    this.initializeToneProfiles();
    this.initializeToneRules();
    this.initializeEncouragementPatterns();
    this.initializeBannedPhrases();
    this.initializeReplacementDictionary();
  }

  /**
   * Analyzes the tone and sentiment of notification content
   */
  async analyzeNotificationTone(
    content: NotificationContent,
    targetTone?: MessageTone,
    targetStyle?: EncouragementStyle
  ): Promise<ServiceResponse<ToneAnalysisResult>> {
    try {
      const metrics = this.calculateMessageMetrics(content);
      const sentiment = this.determineSentiment(metrics);
      const tone = this.identifyTone(content, metrics);
      const encouragementLevel = this.calculateEncouragementLevel(metrics, content);
      
      const score = this.calculateOverallToneScore(metrics, sentiment, encouragementLevel);
      const suggestions = this.generateImprovementSuggestions(content, metrics, targetTone, targetStyle);
      const flaggedWords = this.identifyFlaggedWords(content);
      const replacementSuggestions = this.generateReplacementSuggestions(content, flaggedWords);

      const result: ToneAnalysisResult = {
        score,
        tone,
        encouragementLevel,
        sentiment,
        suggestions,
        flaggedWords,
        replacementSuggestions
      };

      return { success: true, data: result };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'TONE_ANALYSIS_ERROR',
          message: 'Failed to analyze notification tone',
          details: error.message,
          timestamp: new Date()
        }
      };
    }
  }

  /**
   * Validates that content meets minimum tone requirements
   */
  async validateContentTone(
    content: NotificationContent,
    minimumScore: number = 0.7,
    requiredTone?: MessageTone
  ): Promise<ServiceResponse<boolean>> {
    try {
      const analysisResult = await this.analyzeNotificationTone(content, requiredTone);
      
      if (!analysisResult.success || !analysisResult.data) {
        return { success: false, error: analysisResult.error };
      }

      const analysis = analysisResult.data;
      const isValid = analysis.score >= minimumScore &&
                     analysis.sentiment !== 'negative' &&
                     analysis.flaggedWords.length === 0;

      if (requiredTone && analysis.tone !== requiredTone) {
        return {
          success: true,
          data: false,
          warnings: [`Content tone '${analysis.tone}' does not match required tone '${requiredTone}'`]
        };
      }

      return { 
        success: true, 
        data: isValid,
        warnings: isValid ? [] : [
          `Tone score ${analysis.score.toFixed(2)} below minimum ${minimumScore}`,
          ...analysis.suggestions.slice(0, 3) // Top 3 suggestions
        ]
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'TONE_VALIDATION_ERROR',
          message: 'Failed to validate content tone',
          details: error.message,
          timestamp: new Date()
        }
      };
    }
  }

  /**
   * Automatically improves content tone based on analysis
   */
  async improveContentTone(
    content: NotificationContent,
    targetTone: MessageTone = 'encouraging',
    targetStyle: EncouragementStyle = 'supportive'
  ): Promise<ServiceResponse<NotificationContent>> {
    try {
      const analysisResult = await this.analyzeNotificationTone(content, targetTone, targetStyle);
      
      if (!analysisResult.success || !analysisResult.data) {
        return { success: false, error: analysisResult.error };
      }

      let improvedContent = { ...content };
      const analysis = analysisResult.data;

      // Apply automatic fixes from tone rules
      for (const rule of this.toneRules) {
        if (rule.autoFix && rule.severity === 'error') {
          const metrics = this.calculateMessageMetrics(improvedContent);
          if (rule.condition(metrics, improvedContent)) {
            improvedContent.message = rule.autoFix(improvedContent.message);
            improvedContent.title = rule.autoFix(improvedContent.title);
          }
        }
      }

      // Apply replacement suggestions
      for (const replacement of analysis.replacementSuggestions) {
        improvedContent.message = improvedContent.message.replace(
          new RegExp(replacement.original, 'gi'),
          replacement.suggested
        );
        improvedContent.title = improvedContent.title.replace(
          new RegExp(replacement.original, 'gi'),
          replacement.suggested
        );
      }

      // Enhance with encouraging elements if needed
      if (analysis.encouragementLevel < 0.6) {
        improvedContent = await this.addEncouragingElements(improvedContent, targetStyle);
      }

      // Adjust tone if needed
      if (analysis.tone !== targetTone) {
        improvedContent = await this.adjustToTargetTone(improvedContent, analysis.tone, targetTone);
      }

      // Update the tone metadata
      improvedContent.tone = targetTone;

      return { success: true, data: improvedContent };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'TONE_IMPROVEMENT_ERROR',
          message: 'Failed to improve content tone',
          details: error.message,
          timestamp: new Date()
        }
      };
    }
  }

  /**
   * Generates multiple tone variations of the same content
   */
  async generateToneVariations(
    baseContent: NotificationContent,
    tones: MessageTone[]
  ): Promise<ServiceResponse<NotificationContent[]>> {
    try {
      const variations: NotificationContent[] = [];

      for (const tone of tones) {
        const variationResult = await this.improveContentTone(baseContent, tone);
        
        if (variationResult.success && variationResult.data) {
          variations.push({
            ...variationResult.data,
            templateId: `${baseContent.templateId}-${tone}-variant`
          });
        }
      }

      return { success: true, data: variations };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'VARIATION_GENERATION_ERROR',
          message: 'Failed to generate tone variations',
          details: error.message,
          timestamp: new Date()
        }
      };
    }
  }

  /**
   * Batch analyzes multiple notifications for tone consistency
   */
  async batchAnalyzeTone(
    notifications: NotificationContent[]
  ): Promise<ServiceResponse<ToneAnalysisResult[]>> {
    try {
      const results: ToneAnalysisResult[] = [];

      for (const notification of notifications) {
        const analysisResult = await this.analyzeNotificationTone(notification);
        
        if (analysisResult.success && analysisResult.data) {
          results.push(analysisResult.data);
        }
      }

      return { success: true, data: results };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'BATCH_ANALYSIS_ERROR',
          message: 'Failed to batch analyze tone',
          details: error.message,
          timestamp: new Date()
        }
      };
    }
  }

  private initializeToneProfiles(): void {
    // Encouraging tone profile
    this.toneProfiles.set('encouraging', {
      positiveWords: [
        'amazing', 'excellent', 'fantastic', 'wonderful', 'great', 'awesome',
        'outstanding', 'brilliant', 'superb', 'marvelous', 'perfect', 'incredible',
        'impressive', 'remarkable', 'extraordinary', 'magnificent', 'stellar',
        'exceptional', 'phenomenal', 'spectacular'
      ],
      negativeWords: [
        'terrible', 'awful', 'horrible', 'bad', 'worst', 'fail', 'failed',
        'disaster', 'catastrophe', 'nightmare', 'pathetic', 'useless'
      ],
      encouragingPhrases: [
        'you\'ve got this', 'you can do it', 'we believe in you', 'keep going',
        'you\'re doing great', 'almost there', 'way to go', 'nice work',
        'keep it up', 'you\'re awesome', 'fantastic job', 'well done',
        'proud of you', 'you\'re amazing', 'incredible progress', 'outstanding work'
      ],
      discouragingPhrases: [
        'you should have', 'you failed to', 'you didn\'t', 'you forgot',
        'you need to fix', 'this is wrong', 'you messed up', 'you\'re behind'
      ],
      neutralWords: ['update', 'review', 'check', 'consider', 'please', 'kindly'],
      urgencyWords: ['urgent', 'critical', 'immediately', 'asap', 'now'],
      pressureWords: ['must', 'have to', 'required', 'mandatory', 'deadline', 'overdue']
    });

    // Casual tone profile
    this.toneProfiles.set('casual', {
      positiveWords: [
        'cool', 'nice', 'good', 'sweet', 'solid', 'decent', 'fine',
        'alright', 'ok', 'neat', 'pretty good', 'not bad'
      ],
      negativeWords: [
        'sucks', 'lame', 'boring', 'meh', 'blah', 'ugh'
      ],
      encouragingPhrases: [
        'no worries', 'you got it', 'easy does it', 'take your time',
        'no rush', 'when you can', 'if you want', 'up to you'
      ],
      discouragingPhrases: [
        'you should', 'you need to', 'you have to'
      ],
      neutralWords: ['hey', 'just', 'maybe', 'might', 'could', 'perhaps'],
      urgencyWords: ['soon', 'quick', 'fast'],
      pressureWords: ['need', 'should', 'better']
    });

    // Professional tone profile
    this.toneProfiles.set('professional', {
      positiveWords: [
        'excellent', 'outstanding', 'commendable', 'exemplary', 'proficient',
        'competent', 'skilled', 'effective', 'successful', 'accomplished'
      ],
      negativeWords: [
        'inadequate', 'insufficient', 'unsatisfactory', 'substandard', 'poor'
      ],
      encouragingPhrases: [
        'well executed', 'professional manner', 'high quality', 'meets standards',
        'commendable effort', 'appreciate your work', 'value your contribution'
      ],
      discouragingPhrases: [
        'fails to meet', 'below expectations', 'inadequate performance'
      ],
      neutralWords: ['please', 'kindly', 'recommend', 'suggest', 'advise', 'request'],
      urgencyWords: ['priority', 'important', 'significant', 'time-sensitive'],
      pressureWords: ['required', 'necessary', 'essential', 'compliance']
    });
  }

  private initializeToneRules(): void {
    this.toneRules = [
      {
        id: 'no-negative-sentiment',
        description: 'Content should not contain negative sentiment',
        condition: (metrics) => metrics.negativeWordCount > 0,
        severity: 'error',
        suggestion: 'Replace negative words with positive or neutral alternatives',
        autoFix: (content) => {
          let fixed = content;
          const negativeWords = this.toneProfiles.get('encouraging')!.negativeWords;
          negativeWords.forEach(word => {
            const replacements = this.replacementDictionary.get(word) || ['good'];
            fixed = fixed.replace(new RegExp(`\\b${word}\\b`, 'gi'), replacements[0]);
          });
          return fixed;
        }
      },
      {
        id: 'minimum-encouragement',
        description: 'Content should contain encouraging elements',
        condition: (metrics) => metrics.encouragingPhraseCount === 0 && metrics.positiveWordCount < 2,
        severity: 'warning',
        suggestion: 'Add encouraging phrases or positive words',
      },
      {
        id: 'excessive-pressure',
        description: 'Content should not create excessive pressure',
        condition: (metrics) => metrics.pressureWordCount > 2,
        severity: 'warning',
        suggestion: 'Reduce pressure-inducing language',
        autoFix: (content) => {
          return content
            .replace(/\bmust\b/gi, 'could')
            .replace(/\bhave to\b/gi, 'might want to')
            .replace(/\brequired\b/gi, 'recommended');
        }
      },
      {
        id: 'excessive-urgency',
        description: 'Content should not be overly urgent unless truly critical',
        condition: (metrics) => metrics.urgencyWordCount > 1,
        severity: 'warning',
        suggestion: 'Consider reducing urgency language',
      },
      {
        id: 'readability',
        description: 'Content should be easily readable',
        condition: (metrics) => metrics.readabilityScore < 0.6,
        severity: 'info',
        suggestion: 'Consider simplifying language for better readability',
      },
      {
        id: 'excessive-exclamations',
        description: 'Too many exclamation points can seem insincere',
        condition: (metrics) => metrics.exclamationCount > 3,
        severity: 'warning',
        suggestion: 'Reduce number of exclamation points',
        autoFix: (content) => {
          // Replace multiple exclamations with single ones
          return content.replace(/!{2,}/g, '!').replace(/!(?=.*!)/g, '');
        }
      }
    ];
  }

  private initializeEncouragementPatterns(): void {
    this.encouragementPatterns.set('cheerful', [
      /\b(awesome|amazing|fantastic|wonderful|great)\b/gi,
      /\b(you\'re|you are)\s+(doing\s+)?(great|amazing|awesome)\b/gi,
      /[⭐✨🌟💫🎯🚀💪]/g
    ]);

    this.encouragementPatterns.set('supportive', [
      /\b(support|help|assist|guide|together)\b/gi,
      /\b(we\'re here|we believe|we support)\b/gi,
      /\b(take your time|no pressure|when ready)\b/gi
    ]);

    this.encouragementPatterns.set('gentle', [
      /\b(gently|softly|when you can|at your pace)\b/gi,
      /\b(no rush|take your time|when convenient)\b/gi,
      /\b(whenever|if you|perhaps|maybe)\b/gi
    ]);

    this.encouragementPatterns.set('motivational', [
      /\b(crush|dominate|victory|champion|winner)\b/gi,
      /\b(you got this|let\'s go|push forward)\b/gi,
      /[💪🏆🎯🚀⚡]/g
    ]);

    this.encouragementPatterns.set('professional', [
      /\b(commendable|exemplary|professional|quality)\b/gi,
      /\b(appreciate|value|recognize|acknowledge)\b/gi,
      /\b(standards|excellence|competent|skilled)\b/gi
    ]);

    this.encouragementPatterns.set('friendly', [
      /\b(hey|hi|hello|friend|buddy)\b/gi,
      /\b(just checking|friendly|heads up|fyi)\b/gi,
      /\b(hope|wish|glad|happy)\b/gi
    ]);
  }

  private initializeBannedPhrases(): void {
    this.bannedPhrases = [
      'you failed',
      'you\'re wrong',
      'you should have',
      'you didn\'t',
      'you forgot',
      'you need to fix',
      'this is bad',
      'terrible job',
      'you messed up',
      'you\'re behind',
      'you\'re late',
      'overdue again',
      'not good enough',
      'disappointing',
      'unacceptable'
    ];
  }

  private initializeReplacementDictionary(): void {
    this.replacementDictionary.set('terrible', ['challenging', 'needs attention', 'could be improved']);
    this.replacementDictionary.set('awful', ['needs work', 'could be better', 'requires attention']);
    this.replacementDictionary.set('bad', ['needs improvement', 'could be enhanced', 'needs attention']);
    this.replacementDictionary.set('failed', ['needs retry', 'requires attention', 'could use work']);
    this.replacementDictionary.set('must', ['could', 'might want to', 'consider']);
    this.replacementDictionary.set('have to', ['could', 'might', 'consider']);
    this.replacementDictionary.set('required', ['recommended', 'suggested', 'beneficial']);
    this.replacementDictionary.set('you should have', ['next time consider', 'it would help to', 'you might']);
    this.replacementDictionary.set('you didn\'t', ['looks like', 'seems like', 'appears that']);
    this.replacementDictionary.set('you forgot', ['don\'t forget next time to', 'remember to', 'consider']);
  }

  private calculateMessageMetrics(content: NotificationContent): MessageMetrics {
    const fullText = `${content.title} ${content.message}`.toLowerCase();
    const words = fullText.split(/\s+/).filter(word => word.length > 0);
    
    const encouragingProfile = this.toneProfiles.get('encouraging')!;
    
    return {
      wordCount: words.length,
      positiveWordCount: this.countMatches(fullText, encouragingProfile.positiveWords),
      negativeWordCount: this.countMatches(fullText, encouragingProfile.negativeWords),
      encouragingPhraseCount: this.countMatches(fullText, encouragingProfile.encouragingPhrases),
      discouragingPhraseCount: this.countMatches(fullText, encouragingProfile.discouragingPhrases),
      urgencyWordCount: this.countMatches(fullText, encouragingProfile.urgencyWords),
      pressureWordCount: this.countMatches(fullText, encouragingProfile.pressureWords),
      exclamationCount: (content.message.match(/!/g) || []).length,
      questionCount: (content.message.match(/\?/g) || []).length,
      readabilityScore: this.calculateReadabilityScore(fullText)
    };
  }

  private countMatches(text: string, patterns: string[]): number {
    return patterns.reduce((count, pattern) => {
      const regex = new RegExp(`\\b${pattern.toLowerCase()}\\b`, 'g');
      return count + (text.match(regex) || []).length;
    }, 0);
  }

  private calculateReadabilityScore(text: string): number {
    // Simplified readability calculation
    const words = text.split(/\s+/).length;
    const sentences = text.split(/[.!?]+/).length;
    const avgWordsPerSentence = words / sentences;
    
    // Prefer shorter sentences for readability
    return Math.max(0, Math.min(1, 1 - (avgWordsPerSentence - 15) / 20));
  }

  private determineSentiment(metrics: MessageMetrics): 'positive' | 'neutral' | 'negative' {
    const sentimentScore = metrics.positiveWordCount + metrics.encouragingPhraseCount - 
                          metrics.negativeWordCount - metrics.discouragingPhraseCount;
    
    if (sentimentScore > 1) return 'positive';
    if (sentimentScore < -1) return 'negative';
    return 'neutral';
  }

  private identifyTone(content: NotificationContent, metrics: MessageMetrics): MessageTone {
    // Simple tone identification based on content patterns
    const text = `${content.title} ${content.message}`.toLowerCase();
    
    const professionalScore = this.countMatches(text, this.toneProfiles.get('professional')!.positiveWords);
    const casualScore = this.countMatches(text, this.toneProfiles.get('casual')!.positiveWords);
    
    if (professionalScore > casualScore) return 'professional';
    if (casualScore > 0) return 'casual';
    return 'encouraging';
  }

  private calculateEncouragementLevel(metrics: MessageMetrics, content: NotificationContent): number {
    const encouragementScore = metrics.encouragingPhraseCount * 0.3 + 
                             metrics.positiveWordCount * 0.2 -
                             metrics.discouragingPhraseCount * 0.4 -
                             metrics.pressureWordCount * 0.2;
    
    return Math.max(0, Math.min(1, (encouragementScore + 2) / 4));
  }

  private calculateOverallToneScore(
    metrics: MessageMetrics,
    sentiment: string,
    encouragementLevel: number
  ): number {
    let score = 0.5; // Base score
    
    // Sentiment contribution
    if (sentiment === 'positive') score += 0.3;
    else if (sentiment === 'negative') score -= 0.4;
    
    // Encouragement contribution
    score += encouragementLevel * 0.3;
    
    // Pressure penalty
    if (metrics.pressureWordCount > 0) score -= metrics.pressureWordCount * 0.1;
    
    // Readability contribution
    score += metrics.readabilityScore * 0.2;
    
    return Math.max(0, Math.min(1, score));
  }

  private generateImprovementSuggestions(
    content: NotificationContent,
    metrics: MessageMetrics,
    targetTone?: MessageTone,
    targetStyle?: EncouragementStyle
  ): string[] {
    const suggestions: string[] = [];
    
    // Apply tone rules
    for (const rule of this.toneRules) {
      if (rule.condition(metrics, content)) {
        suggestions.push(rule.suggestion);
      }
    }
    
    // Specific suggestions based on metrics
    if (metrics.encouragingPhraseCount === 0) {
      suggestions.push('Add encouraging phrases like "you\'ve got this" or "great work"');
    }
    
    if (metrics.positiveWordCount < 2) {
      suggestions.push('Include more positive words to enhance the encouraging tone');
    }
    
    if (targetTone && content.tone !== targetTone) {
      suggestions.push(`Adjust language to match ${targetTone} tone`);
    }
    
    return _.uniq(suggestions).slice(0, 5); // Limit to 5 suggestions
  }

  private identifyFlaggedWords(content: NotificationContent): string[] {
    const flaggedWords: string[] = [];
    const fullText = `${content.title} ${content.message}`.toLowerCase();
    
    // Check banned phrases
    for (const phrase of this.bannedPhrases) {
      if (fullText.includes(phrase.toLowerCase())) {
        flaggedWords.push(phrase);
      }
    }
    
    // Check negative words
    const negativeWords = this.toneProfiles.get('encouraging')!.negativeWords;
    for (const word of negativeWords) {
      if (new RegExp(`\\b${word}\\b`, 'i').test(fullText)) {
        flaggedWords.push(word);
      }
    }
    
    return flaggedWords;
  }

  private generateReplacementSuggestions(
    content: NotificationContent,
    flaggedWords: string[]
  ): Array<{ original: string; suggested: string; reason: string }> {
    const suggestions: Array<{ original: string; suggested: string; reason: string }> = [];
    
    for (const word of flaggedWords) {
      const replacements = this.replacementDictionary.get(word);
      if (replacements && replacements.length > 0) {
        suggestions.push({
          original: word,
          suggested: replacements[0],
          reason: 'More positive and encouraging alternative'
        });
      }
    }
    
    return suggestions;
  }

  private async addEncouragingElements(
    content: NotificationContent,
    style: EncouragementStyle
  ): Promise<NotificationContent> {
    const encouragingPhrases = this.toneProfiles.get('encouraging')!.encouragingPhrases;
    const stylePhrase = _.sample(encouragingPhrases) || 'You\'ve got this!';
    
    return {
      ...content,
      message: `${content.message} ${stylePhrase}`,
    };
  }

  private async adjustToTargetTone(
    content: NotificationContent,
    currentTone: MessageTone,
    targetTone: MessageTone
  ): Promise<NotificationContent> {
    // Simple tone adjustment - would be more sophisticated in production
    const targetProfile = this.toneProfiles.get(targetTone);
    if (!targetProfile) return content;
    
    let adjustedMessage = content.message;
    let adjustedTitle = content.title;
    
    // Replace casual words with professional equivalents if targeting professional tone
    if (targetTone === 'professional') {
      adjustedMessage = adjustedMessage
        .replace(/\bhey\b/gi, 'Hello')
        .replace(/\bcool\b/gi, 'excellent')
        .replace(/\bawesome\b/gi, 'outstanding');
      
      adjustedTitle = adjustedTitle
        .replace(/\bhey\b/gi, 'Hello')
        .replace(/\bcool\b/gi, 'excellent');
    }
    
    return {
      ...content,
      message: adjustedMessage,
      title: adjustedTitle,
      tone: targetTone
    };
  }
}