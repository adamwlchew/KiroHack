import { logger } from '@pageflow/utils';

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  variables: string[];
  model: 'claude' | 'titan' | 'cohere';
  category: 'content_generation' | 'assessment_feedback' | 'companion_response' | 'curriculum_alignment';
  version: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PromptVariables {
  [key: string]: string | number | boolean;
}

export class PromptManager {
  private templates: Map<string, PromptTemplate> = new Map();

  constructor() {
    this.loadDefaultTemplates();
  }

  /**
   * Load default prompt templates for the platform
   */
  private loadDefaultTemplates(): void {
    const defaultTemplates: PromptTemplate[] = [
      {
        id: 'content_generation_basic',
        name: 'Basic Content Generation',
        description: 'Generate educational content for a specific topic',
        template: `Create educational content about {{topic}} for {{gradeLevel}} students.

Requirements:
- Reading level: {{readingLevel}}
- Content type: {{contentType}}
- Duration: {{duration}} minutes
- Include {{includeAssessment}} assessment questions

The content should be engaging, age-appropriate, and aligned with curriculum standards.

Topic: {{topic}}
Additional context: {{context}}`,
        variables: ['topic', 'gradeLevel', 'readingLevel', 'contentType', 'duration', 'includeAssessment', 'context'],
        model: 'claude',
        category: 'content_generation',
        version: '1.0',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'assessment_feedback_detailed',
        name: 'Detailed Assessment Feedback',
        description: 'Provide personalized feedback on student assessments',
        template: `Provide detailed, constructive feedback for a student's assessment submission.

Assessment Details:
- Question: {{question}}
- Student Answer: {{studentAnswer}}
- Correct Answer: {{correctAnswer}}
- Student Grade Level: {{gradeLevel}}
- Subject: {{subject}}

Please provide:
1. Whether the answer is correct or incorrect
2. Specific areas where the student did well
3. Areas for improvement with specific suggestions
4. Encouragement and next steps
5. Additional resources if helpful

Keep the tone supportive and educational, appropriate for {{gradeLevel}} level.`,
        variables: ['question', 'studentAnswer', 'correctAnswer', 'gradeLevel', 'subject'],
        model: 'claude',
        category: 'assessment_feedback',
        version: '1.0',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'page_companion_response',
        name: 'Page Companion Response',
        description: 'Generate responses for the Page AI companion character',
        template: `You are Page, an AI learning companion with the following personality traits:
- Enthusiasm: {{enthusiasm}}/10
- Helpfulness: {{helpfulness}}/10
- Humor: {{humor}}/10
- Formality: {{formality}}/10

Current context:
- Student name: {{studentName}}
- Current topic: {{currentTopic}}
- Student's recent progress: {{recentProgress}}
- Student's emotional state: {{emotionalState}}
- Platform: {{platform}}

Student message: "{{studentMessage}}"

Respond as Page would, maintaining your personality while being helpful and encouraging. Keep responses appropriate for the {{platform}} platform and the student's context.`,
        variables: ['enthusiasm', 'helpfulness', 'humor', 'formality', 'studentName', 'currentTopic', 'recentProgress', 'emotionalState', 'platform', 'studentMessage'],
        model: 'claude',
        category: 'companion_response',
        version: '1.0',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'curriculum_alignment_check',
        name: 'Curriculum Alignment Check',
        description: 'Check content alignment with curriculum standards',
        template: `Analyze the following educational content for alignment with curriculum standards.

Content to analyze:
{{content}}

Curriculum Standards to check against:
{{curriculumStandards}}

Grade Level: {{gradeLevel}}
Subject: {{subject}}

Please provide:
1. Which standards this content aligns with
2. Strength of alignment (Strong/Moderate/Weak) for each standard
3. Any gaps or missing elements
4. Suggestions for improving alignment
5. Additional standards that could be addressed

Format your response as a structured analysis.`,
        variables: ['content', 'curriculumStandards', 'gradeLevel', 'subject'],
        model: 'claude',
        category: 'curriculum_alignment',
        version: '1.0',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'content_summarization',
        name: 'Content Summarization',
        description: 'Summarize educational content using Cohere',
        template: `Summarize the following educational content for {{gradeLevel}} students:

{{content}}

Requirements:
- Length: {{summaryLength}}
- Focus on: {{focusAreas}}
- Include key concepts and main ideas
- Use age-appropriate language

Summary:`,
        variables: ['content', 'gradeLevel', 'summaryLength', 'focusAreas'],
        model: 'cohere',
        category: 'content_generation',
        version: '1.0',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });

    logger.info({ message: 'Loaded default prompt templates', count: defaultTemplates.length });
  }

  /**
   * Get a prompt template by ID
   */
  getTemplate(id: string): PromptTemplate | undefined {
    return this.templates.get(id);
  }

  /**
   * Get all templates for a specific category
   */
  getTemplatesByCategory(category: PromptTemplate['category']): PromptTemplate[] {
    return Array.from(this.templates.values()).filter(template => template.category === category);
  }

  /**
   * Get all templates for a specific model
   */
  getTemplatesByModel(model: PromptTemplate['model']): PromptTemplate[] {
    return Array.from(this.templates.values()).filter(template => template.model === model);
  }

  /**
   * Add or update a prompt template
   */
  setTemplate(template: PromptTemplate): void {
    const existingTemplate = this.templates.get(template.id);
    if (existingTemplate) {
      template.updatedAt = new Date();
      logger.info({ message: 'Updated prompt template', id: template.id, name: template.name });
    } else {
      logger.info({ message: 'Added new prompt template', id: template.id, name: template.name });
    }
    
    this.templates.set(template.id, template);
  }

  /**
   * Remove a prompt template
   */
  removeTemplate(id: string): boolean {
    const removed = this.templates.delete(id);
    if (removed) {
      logger.info({ message: 'Removed prompt template', id });
    }
    return removed;
  }

  /**
   * Build a prompt from a template with variables
   */
  buildPrompt(templateId: string, variables: PromptVariables): string {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Prompt template not found: ${templateId}`);
    }

    // Validate that all required variables are provided
    const missingVariables = template.variables.filter(variable => 
      variables[variable] === undefined || variables[variable] === null
    );

    if (missingVariables.length > 0) {
      throw new Error(`Missing required variables for template ${templateId}: ${missingVariables.join(', ')}`);
    }

    // Replace variables in template
    let prompt = template.template;
    template.variables.forEach(variable => {
      const value = variables[variable];
      const regex = new RegExp(`{{${variable}}}`, 'g');
      prompt = prompt.replace(regex, String(value));
    });

    logger.debug({ 
      message: 'Built prompt from template',
      templateId, 
      templateName: template.name,
      variableCount: Object.keys(variables).length 
    });

    return prompt;
  }

  /**
   * Validate a prompt template
   */
  validateTemplate(template: PromptTemplate): string[] {
    const errors: string[] = [];

    if (!template.id || template.id.trim() === '') {
      errors.push('Template ID is required');
    }

    if (!template.name || template.name.trim() === '') {
      errors.push('Template name is required');
    }

    if (!template.template || template.template.trim() === '') {
      errors.push('Template content is required');
    }

    if (!template.variables || !Array.isArray(template.variables)) {
      errors.push('Template variables must be an array');
    }

    if (!['claude', 'titan', 'cohere'].includes(template.model)) {
      errors.push('Template model must be one of: claude, titan, cohere');
    }

    if (!['content_generation', 'assessment_feedback', 'companion_response', 'curriculum_alignment'].includes(template.category)) {
      errors.push('Template category must be one of: content_generation, assessment_feedback, companion_response, curriculum_alignment');
    }

    // Check that all variables in template are declared
    const templateVariables = template.template.match(/{{(\w+)}}/g) || [];
    const declaredVariables = template.variables;
    
    templateVariables.forEach(variable => {
      const variableName = variable.replace(/[{}]/g, '');
      if (!declaredVariables.includes(variableName)) {
        errors.push(`Variable ${variableName} used in template but not declared in variables array`);
      }
    });

    return errors;
  }

  /**
   * Get all templates
   */
  getAllTemplates(): PromptTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get template statistics
   */
  getStats(): {
    totalTemplates: number;
    templatesByModel: Record<string, number>;
    templatesByCategory: Record<string, number>;
  } {
    const templates = this.getAllTemplates();
    
    const templatesByModel: Record<string, number> = {};
    const templatesByCategory: Record<string, number> = {};

    templates.forEach(template => {
      templatesByModel[template.model] = (templatesByModel[template.model] || 0) + 1;
      templatesByCategory[template.category] = (templatesByCategory[template.category] || 0) + 1;
    });

    return {
      totalTemplates: templates.length,
      templatesByModel,
      templatesByCategory,
    };
  }
}

// Export singleton instance
export const promptManager = new PromptManager();