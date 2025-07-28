import { logger } from '@pageflow/utils';

export interface ModerationResult {
  flagged: boolean;
  categories: string[];
  confidence: number;
  details?: {
    [category: string]: {
      flagged: boolean;
      confidence: number;
    };
  };
}

export interface ModerationRule {
  category: string;
  patterns: RegExp[];
  severity: 'low' | 'medium' | 'high';
  description: string;
}

/**
 * Content moderation service for educational content
 * Implements basic rule-based moderation with extensibility for AI-based moderation
 */
export class ContentModerationService {
  private rules: ModerationRule[] = [];

  constructor() {
    this.loadDefaultRules();
  }

  /**
   * Load default moderation rules for educational content
   */
  private loadDefaultRules(): void {
    const defaultRules: ModerationRule[] = [
      {
        category: 'inappropriate_language',
        patterns: [
          /\b(damn|hell|crap|stupid|idiot|dumb)\b/gi,
          /\b(hate|kill|die|death)\b/gi,
        ],
        severity: 'medium',
        description: 'Inappropriate language for educational content',
      },
      {
        category: 'violence',
        patterns: [
          /\b(violence|violent|attack|fight|war|weapon|gun|knife|bomb)\b/gi,
          /\b(hurt|harm|injure|wound|blood|murder)\b/gi,
        ],
        severity: 'high',
        description: 'Violent content inappropriate for learning environment',
      },
      {
        category: 'adult_content',
        patterns: [
          /\b(sex|sexual|porn|nude|naked)\b/gi,
          /\b(drug|alcohol|beer|wine|cigarette|smoke)\b/gi,
        ],
        severity: 'high',
        description: 'Adult content inappropriate for educational setting',
      },
      {
        category: 'discrimination',
        patterns: [
          /\b(racist|racism|sexist|sexism|homophobic|transphobic)\b/gi,
          /\b(stereotype|prejudice|discrimination|bias)\b/gi,
        ],
        severity: 'high',
        description: 'Discriminatory content that could harm inclusive learning',
      },
      {
        category: 'misinformation',
        patterns: [
          /\b(fake news|conspiracy|hoax|lie|false information)\b/gi,
          /\b(earth is flat|vaccines cause autism|climate change is fake)\b/gi,
        ],
        severity: 'high',
        description: 'Potential misinformation that could mislead learners',
      },
      {
        category: 'personal_information',
        patterns: [
          /\b\d{3}-\d{2}-\d{4}\b/g, // SSN pattern
          /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email pattern
          /\b\d{3}-\d{3}-\d{4}\b/g, // Phone number pattern
        ],
        severity: 'medium',
        description: 'Personal information that should be protected',
      },
      {
        category: 'off_topic',
        patterns: [
          /\b(shopping|buy now|sale|discount|price|money|cost)\b/gi,
          /\b(politics|political|election|vote|government|president)\b/gi,
        ],
        severity: 'low',
        description: 'Content that may be off-topic for educational purposes',
      },
    ];

    this.rules = defaultRules;
    logger.info({ message: 'Loaded default content moderation rules', ruleCount: this.rules.length });
  }

  /**
   * Moderate text content
   */
  async moderateText(text: string): Promise<ModerationResult> {
    if (!text || text.trim().length === 0) {
      return {
        flagged: false,
        categories: [],
        confidence: 0,
      };
    }

    logger.debug({
      message: 'Starting content moderation',
      textLength: text.length,
    });

    const flaggedCategories: string[] = [];
    const details: { [category: string]: { flagged: boolean; confidence: number } } = {};
    let maxConfidence = 0;

    // Check against each rule
    for (const rule of this.rules) {
      const matches = this.checkRule(text, rule);
      
      if (matches.length > 0) {
        flaggedCategories.push(rule.category);
        
        // Calculate confidence based on number of matches and severity
        let confidence = Math.min(matches.length * 0.2, 1.0);
        
        // Adjust confidence based on severity
        switch (rule.severity) {
          case 'high':
            confidence = Math.min(confidence * 1.5, 1.0);
            break;
          case 'medium':
            confidence = Math.min(confidence * 1.2, 1.0);
            break;
          case 'low':
            confidence = Math.min(confidence * 0.8, 1.0);
            break;
        }

        details[rule.category] = {
          flagged: true,
          confidence,
        };

        maxConfidence = Math.max(maxConfidence, confidence);

        logger.debug({
          message: 'Content moderation rule triggered',
          category: rule.category,
          matchCount: matches.length,
          confidence,
          severity: rule.severity,
        });
      } else {
        details[rule.category] = {
          flagged: false,
          confidence: 0,
        };
      }
    }

    const result: ModerationResult = {
      flagged: flaggedCategories.length > 0,
      categories: flaggedCategories,
      confidence: maxConfidence,
      details,
    };

    logger.info({
      message: 'Content moderation completed',
      flagged: result.flagged,
      categories: flaggedCategories,
      confidence: maxConfidence,
    });

    return result;
  }

  /**
   * Check text against a specific rule
   */
  private checkRule(text: string, rule: ModerationRule): RegExpMatchArray[] {
    const matches: RegExpMatchArray[] = [];
    
    for (const pattern of rule.patterns) {
      const ruleMatches = text.match(pattern);
      if (ruleMatches) {
        matches.push(ruleMatches);
      }
    }
    
    return matches;
  }

  /**
   * Add a custom moderation rule
   */
  addRule(rule: ModerationRule): void {
    this.rules.push(rule);
    logger.info({
      message: 'Added custom moderation rule',
      category: rule.category,
      severity: rule.severity,
    });
  }

  /**
   * Remove a moderation rule by category
   */
  removeRule(category: string): boolean {
    const initialLength = this.rules.length;
    this.rules = this.rules.filter(rule => rule.category !== category);
    const removed = this.rules.length < initialLength;
    
    if (removed) {
      logger.info({ message: 'Removed moderation rule', category });
    }
    
    return removed;
  }

  /**
   * Update rule severity
   */
  updateRuleSeverity(category: string, severity: 'low' | 'medium' | 'high'): boolean {
    const rule = this.rules.find(r => r.category === category);
    if (rule) {
      rule.severity = severity;
      logger.info({
        message: 'Updated rule severity',
        category,
        newSeverity: severity,
      });
      return true;
    }
    return false;
  }

  /**
   * Get all moderation rules
   */
  getRules(): ModerationRule[] {
    return [...this.rules];
  }

  /**
   * Get rules by severity
   */
  getRulesBySeverity(severity: 'low' | 'medium' | 'high'): ModerationRule[] {
    return this.rules.filter(rule => rule.severity === severity);
  }

  /**
   * Moderate content with custom rules
   */
  async moderateWithCustomRules(text: string, customRules: ModerationRule[]): Promise<ModerationResult> {
    const originalRules = this.rules;
    
    try {
      // Temporarily add custom rules
      this.rules = [...this.rules, ...customRules];
      return await this.moderateText(text);
    } finally {
      // Restore original rules
      this.rules = originalRules;
    }
  }

  /**
   * Sanitize text by removing flagged content
   */
  async sanitizeText(text: string): Promise<{ sanitized: string; changes: string[] }> {
    const changes: string[] = [];
    let sanitized = text;

    for (const rule of this.rules) {
      for (const pattern of rule.patterns) {
        const matches = sanitized.match(pattern);
        if (matches) {
          matches.forEach(match => {
            sanitized = sanitized.replace(match, '[CONTENT REMOVED]');
            changes.push(`Removed "${match}" (${rule.category})`);
          });
        }
      }
    }

    logger.info({
      message: 'Text sanitization completed',
      originalLength: text.length,
      sanitizedLength: sanitized.length,
      changesCount: changes.length,
    });

    return { sanitized, changes };
  }

  /**
   * Get moderation statistics
   */
  getStats(): {
    totalRules: number;
    rulesBySeverity: Record<string, number>;
    rulesByCategory: string[];
  } {
    const rulesBySeverity = this.rules.reduce((acc, rule) => {
      acc[rule.severity] = (acc[rule.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalRules: this.rules.length,
      rulesBySeverity,
      rulesByCategory: this.rules.map(rule => rule.category),
    };
  }

  /**
   * Test moderation rules against sample text
   */
  async testRules(sampleTexts: string[]): Promise<Array<{ text: string; result: ModerationResult }>> {
    const results = await Promise.all(
      sampleTexts.map(async text => ({
        text,
        result: await this.moderateText(text),
      }))
    );

    logger.info({
      message: 'Moderation rules testing completed',
      sampleCount: sampleTexts.length,
      flaggedCount: results.filter(r => r.result.flagged).length,
    });

    return results;
  }
}

// Export singleton instance
export const contentModerationService = new ContentModerationService();