/**
 * Unit tests for Tone Analyzer
 * Tests ensuring all messages maintain encouraging, gentle tone
 */

import { describe, beforeEach, it, expect } from '@jest/globals';

// Mock tone analyzer implementation
class MockToneAnalyzer {
  private encouragingWords = [
    'amazing', 'awesome', 'fantastic', 'great', 'excellent', 'wonderful', 'perfect',
    'brilliant', 'outstanding', 'superb', 'magnificent', 'incredible', 'remarkable',
    'you can do', 'you\'ve got', 'keep up', 'well done', 'good job', 'nice work',
    'way to go', 'proud of', 'celebrate', 'achievement', 'success', 'progress',
    'improvement', 'accomplishment', 'milestone', 'victory'
  ];

  private gentleWords = [
    'gentle', 'kind', 'friendly', 'warm', 'supportive', 'understanding',
    'patient', 'considerate', 'thoughtful', 'caring', 'helpful', 'encouraging',
    'when you have a moment', 'no rush', 'at your convenience', 'when you\'re ready',
    'if you get a chance', 'when it works for you'
  ];

  private harshWords = [
    'urgent', 'critical', 'immediately', 'must', 'required', 'mandatory',
    'overdue', 'late', 'behind', 'failing', 'error', 'wrong', 'bad',
    'terrible', 'awful', 'horrible', 'stupid', 'dumb', 'useless'
  ];

  private negativeWords = [
    'hate', 'despise', 'loathe', 'disgusting', 'revolting', 'appalling',
    'pathetic', 'worthless', 'failure', 'disaster', 'catastrophe'
  ];

  analyzeMessage(message: string) {
    const lowerMessage = message.toLowerCase();
    
    const encouragingScore = this.countWordMatches(lowerMessage, this.encouragingWords);
    const gentleScore = this.countWordMatches(lowerMessage, this.gentleWords);
    const harshScore = this.countWordMatches(lowerMessage, this.harshWords);
    const negativeScore = this.countWordMatches(lowerMessage, this.negativeWords);

    const totalWords = message.split(/\s+/).length;
    const positiveRatio = (encouragingScore + gentleScore) / totalWords;
    const negativeRatio = (harshScore + negativeScore) / totalWords;

    return {
      isEncouraging: encouragingScore > 0 || gentleScore > 0,
      isGentle: harshScore === 0 && negativeScore === 0,
      encouragingScore,
      gentleScore,
      harshScore,
      negativeScore,
      positiveRatio,
      negativeRatio,
      overallTone: this.calculateOverallTone(encouragingScore, gentleScore, harshScore, negativeScore),
      recommendations: this.generateRecommendations(message, encouragingScore, gentleScore, harshScore, negativeScore)
    };
  }

  private countWordMatches(text: string, wordList: string[]): number {
    return wordList.reduce((count, word) => {
      return count + (text.includes(word.toLowerCase()) ? 1 : 0);
    }, 0);
  }

  private calculateOverallTone(encouraging: number, gentle: number, harsh: number, negative: number): string {
    const positiveScore = encouraging + gentle;
    const negativeScore = harsh + negative;

    if (positiveScore > 0 && negativeScore === 0) {
      return 'encouraging';
    }
    if (positiveScore > negativeScore) {
      return 'mixed-positive';
    }
    if (negativeScore > positiveScore) {
      return 'harsh';
    }
    if (negativeScore === 0 && positiveScore === 0) {
      return 'neutral';
    }
    return 'mixed';
  }

  private generateRecommendations(message: string, encouraging: number, gentle: number, harsh: number, negative: number): string[] {
    const recommendations = [];

    if (encouraging === 0) {
      recommendations.push('Consider adding encouraging words like "great", "awesome", or "you can do this"');
    }

    if (gentle === 0) {
      recommendations.push('Add gentle language like "when you have a moment" or "at your convenience"');
    }

    if (harsh > 0) {
      recommendations.push('Replace harsh words with gentler alternatives');
    }

    if (negative > 0) {
      recommendations.push('Remove negative language and focus on positive framing');
    }

    if (message.includes('!!!!')) {
      recommendations.push('Reduce excessive punctuation to maintain gentle tone');
    }

    if (message.length < 10) {
      recommendations.push('Consider expanding the message to provide more context and warmth');
    }

    if (message.toUpperCase() === message) {
      recommendations.push('Avoid ALL CAPS text which can seem aggressive');
    }

    return recommendations;
  }

  validateNotificationTone(notification: any) {
    if (!notification.content || !notification.content.message) {
      return {
        isValid: false,
        errors: ['Notification must have content.message'],
        warnings: []
      };
    }

    const analysis = this.analyzeMessage(notification.content.message);
    const errors = [];
    const warnings = [];

    // Validate tone requirements for gentle nudge assistant
    if (!analysis.isEncouraging) {
      errors.push('Message must contain encouraging language');
    }

    if (!analysis.isGentle) {
      errors.push('Message must not contain harsh or negative language');
    }

    if (analysis.negativeRatio > 0.1) {
      errors.push('Message contains too much negative language');
    }

    // Check title if present
    if (notification.content.title) {
      const titleAnalysis = this.analyzeMessage(notification.content.title);
      if (!titleAnalysis.isGentle) {
        warnings.push('Title could be more gentle');
      }
    }

    // Check against tone preference
    if (notification.content.tone === 'encouraging' && analysis.encouragingScore === 0) {
      warnings.push('Message claims to be encouraging but lacks encouraging words');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      analysis
    };
  }

  suggestImprovements(message: string) {
    const analysis = this.analyzeMessage(message);
    const suggestions = [];

    // Suggest specific improvements based on analysis
    if (analysis.encouragingScore === 0) {
      const encouragingOptions = [
        'You\'re doing great work!',
        'This is fantastic progress!',
        'You\'ve got this!',
        'Amazing job so far!'
      ];
      suggestions.push({
        type: 'add_encouraging',
        suggestion: `Start with: ${encouragingOptions[Math.floor(Math.random() * encouragingOptions.length)]}`
      });
    }

    if (analysis.gentleScore === 0) {
      const gentleOptions = [
        'when you have a moment',
        'at your convenience',
        'when you\'re ready',
        'no rush'
      ];
      suggestions.push({
        type: 'add_gentle',
        suggestion: `Add gentle timing: ${gentleOptions[Math.floor(Math.random() * gentleOptions.length)]}`
      });
    }

    // Suggest replacing harsh words
    this.harshWords.forEach(word => {
      if (message.toLowerCase().includes(word)) {
        const replacements = {
          'urgent': 'timely',
          'critical': 'important',
          'immediately': 'when convenient',
          'must': 'could',
          'required': 'helpful if you could',
          'overdue': 'ready for attention'
        };
        
        const replacement = replacements[word as keyof typeof replacements] || 'more gently phrased';
        suggestions.push({
          type: 'replace_harsh',
          original: word,
          suggestion: replacement
        });
      }
    });

    return suggestions;
  }
}

describe('Tone Analyzer', () => {
  let toneAnalyzer: MockToneAnalyzer;

  beforeEach(() => {
    toneAnalyzer = new MockToneAnalyzer();
  });

  describe('Message Analysis', () => {
    it('should identify encouraging messages correctly', () => {
      const encouragingMessage = "You're doing amazing work! This fantastic progress shows how brilliant you are.";
      
      const analysis = toneAnalyzer.analyzeMessage(encouragingMessage);
      
      expect(analysis.isEncouraging).toBe(true);
      expect(analysis.encouragingScore).toBeGreaterThan(0);
      expect(analysis.overallTone).toBe('encouraging');
      expect(analysis.recommendations).toHaveLength(0);
    });

    it('should identify gentle messages correctly', () => {
      const gentleMessage = "When you have a moment, could you please take a gentle look at this? No rush at all.";
      
      const analysis = toneAnalyzer.analyzeMessage(gentleMessage);
      
      expect(analysis.isGentle).toBe(true);
      expect(analysis.gentleScore).toBeGreaterThan(0);
      expect(analysis.harshScore).toBe(0);
      expect(analysis.negativeScore).toBe(0);
    });

    it('should detect harsh language', () => {
      const harshMessage = "This is urgent! You must immediately fix this critical error!";
      
      const analysis = toneAnalyzer.analyzeMessage(harshMessage);
      
      expect(analysis.isGentle).toBe(false);
      expect(analysis.harshScore).toBeGreaterThan(0);
      expect(analysis.overallTone).toBe('harsh');
      expect(analysis.recommendations.length).toBeGreaterThan(0);
    });

    it('should detect negative language', () => {
      const negativeMessage = "This is terrible work. You failed miserably and it's awful.";
      
      const analysis = toneAnalyzer.analyzeMessage(negativeMessage);
      
      expect(analysis.isGentle).toBe(false);
      expect(analysis.negativeScore).toBeGreaterThan(0);
      expect(analysis.overallTone).toBe('harsh');
    });

    it('should calculate positive and negative ratios correctly', () => {
      const mixedMessage = "Great work! But this is urgent and critical."; // 2 positive, 2 harsh words
      
      const analysis = toneAnalyzer.analyzeMessage(mixedMessage);
      
      expect(analysis.positiveRatio).toBeGreaterThan(0);
      expect(analysis.negativeRatio).toBeGreaterThan(0);
      expect(analysis.overallTone).toBe('mixed');
    });

    it('should identify neutral messages', () => {
      const neutralMessage = "Please update the status of this ticket.";
      
      const analysis = toneAnalyzer.analyzeMessage(neutralMessage);
      
      expect(analysis.overallTone).toBe('neutral');
      expect(analysis.encouragingScore).toBe(0);
      expect(analysis.harshScore).toBe(0);
    });
  });

  describe('Notification Validation', () => {
    it('should validate encouraging notification successfully', () => {
      const goodNotification = {
        content: {
          title: 'Gentle reminder',
          message: "Hey there! Your amazing work on this ticket is fantastic. When you have a moment, it would benefit from a quick update. No rush!",
          tone: 'encouraging'
        }
      };

      const validation = toneAnalyzer.validateNotificationTone(goodNotification);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      expect(validation.analysis.isEncouraging).toBe(true);
      expect(validation.analysis.isGentle).toBe(true);
    });

    it('should reject harsh notifications', () => {
      const harshNotification = {
        content: {
          title: 'URGENT ACTION REQUIRED',
          message: "This is critical! You must immediately fix this terrible error!",
          tone: 'encouraging'
        }
      };

      const validation = toneAnalyzer.validateNotificationTone(harshNotification);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors).toContain('Message must not contain harsh or negative language');
    });

    it('should reject notifications without encouraging language', () => {
      const neutralNotification = {
        content: {
          message: "Please update the ticket status.",
          tone: 'encouraging'
        }
      };

      const validation = toneAnalyzer.validateNotificationTone(neutralNotification);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Message must contain encouraging language');
    });

    it('should handle missing content gracefully', () => {
      const invalidNotification = {};

      const validation = toneAnalyzer.validateNotificationTone(invalidNotification);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Notification must have content.message');
    });

    it('should warn about mismatched tone claims', () => {
      const misleadingNotification = {
        content: {
          message: "Please update the ticket.",
          tone: 'encouraging'
        }
      };

      const validation = toneAnalyzer.validateNotificationTone(misleadingNotification);
      
      expect(validation.warnings).toContain('Message claims to be encouraging but lacks encouraging words');
    });
  });

  describe('Improvement Suggestions', () => {
    it('should suggest adding encouraging words', () => {
      const dullMessage = "Please update your ticket.";
      
      const suggestions = toneAnalyzer.suggestImprovements(dullMessage);
      
      const encouragingSuggestion = suggestions.find(s => s.type === 'add_encouraging');
      expect(encouragingSuggestion).toBeTruthy();
      expect(encouragingSuggestion?.suggestion).toMatch(/You're doing|This is fantastic|You've got this|Amazing job/);
    });

    it('should suggest adding gentle language', () => {
      const abruptMessage = "Update the ticket.";
      
      const suggestions = toneAnalyzer.suggestImprovements(abruptMessage);
      
      const gentleSuggestion = suggestions.find(s => s.type === 'add_gentle');
      expect(gentleSuggestion).toBeTruthy();
      expect(gentleSuggestion?.suggestion).toMatch(/when you have a moment|at your convenience|when you're ready|no rush/);
    });

    it('should suggest replacing harsh words', () => {
      const harshMessage = "This is urgent and critical!";
      
      const suggestions = toneAnalyzer.suggestImprovements(harshMessage);
      
      const replacements = suggestions.filter(s => s.type === 'replace_harsh');
      expect(replacements.length).toBeGreaterThan(0);
      
      const urgentReplacement = replacements.find(s => s.original === 'urgent');
      expect(urgentReplacement).toBeTruthy();
      expect(urgentReplacement?.suggestion).toBe('timely');
    });

    it('should provide multiple suggestions for poor messages', () => {
      const poorMessage = "Fix this urgent error immediately!";
      
      const suggestions = toneAnalyzer.suggestImprovements(poorMessage);
      
      expect(suggestions.length).toBeGreaterThan(1);
      expect(suggestions.some(s => s.type === 'add_encouraging')).toBe(true);
      expect(suggestions.some(s => s.type === 'add_gentle')).toBe(true);
      expect(suggestions.some(s => s.type === 'replace_harsh')).toBe(true);
    });

    it('should provide no suggestions for perfect messages', () => {
      const perfectMessage = "You're doing amazing work! When you have a moment, this fantastic ticket would appreciate a gentle update. No rush at all!";
      
      const suggestions = toneAnalyzer.suggestImprovements(perfectMessage);
      
      expect(suggestions.length).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty messages', () => {
      const analysis = toneAnalyzer.analyzeMessage("");
      
      expect(analysis.isEncouraging).toBe(false);
      expect(analysis.isGentle).toBe(true); // No harsh words
      expect(analysis.overallTone).toBe('neutral');
      expect(analysis.recommendations.length).toBeGreaterThan(0);
    });

    it('should handle very long messages', () => {
      const longMessage = "Amazing work! ".repeat(100) + "When you have a moment, please update this fantastic ticket.";
      
      const analysis = toneAnalyzer.analyzeMessage(longMessage);
      
      expect(analysis.isEncouraging).toBe(true);
      expect(analysis.isGentle).toBe(true);
      expect(analysis.positiveRatio).toBeGreaterThan(0);
    });

    it('should handle messages with special characters and emojis', () => {
      const emojiMessage = "You're doing amazing work! 🌟 When you have a moment ⏰, this fantastic ticket 🎫 would appreciate some attention! 💫";
      
      const analysis = toneAnalyzer.analyzeMessage(emojiMessage);
      
      expect(analysis.isEncouraging).toBe(true);
      expect(analysis.isGentle).toBe(true);
      expect(() => toneAnalyzer.analyzeMessage(emojiMessage)).not.toThrow();
    });

    it('should handle case variations', () => {
      const mixedCaseMessage = "AMAZING work! when YOU have A moment, this FANTASTIC ticket needs updating.";
      
      const analysis = toneAnalyzer.analyzeMessage(mixedCaseMessage);
      
      expect(analysis.isEncouraging).toBe(true);
      expect(analysis.encouragingScore).toBeGreaterThan(0);
    });
  });

  describe('Custom Matchers Integration', () => {
    it('should work with toHaveEncouragingTone matcher', () => {
      const encouragingMessage = "You're doing fantastic work! This is an amazing achievement!";
      
      expect(encouragingMessage).toHaveEncouragingTone();
    });

    it('should work with toBeGentleNotification matcher', () => {
      const gentleNotification = {
        title: 'Gentle reminder',
        message: 'When you have a moment, this would be wonderful to update.',
        tone: 'encouraging',
        priority: 'medium'
      };

      expect(gentleNotification).toBeGentleNotification();
    });
  });
});