/**
 * Learning Path model and related interfaces
 */

import { CurriculumStandard } from './curriculumStandard';

/**
 * Content metadata
 */
export interface ContentMetadata {
  /** Author of the content */
  author: string;
  /** Creation date */
  createdAt: Date;
  /** Last update date */
  updatedAt: Date;
  /** Content version */
  version: string;
  /** Content license information */
  license: string;
  /** Content tags for categorization */
  tags: string[];
  /** Difficulty level */
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  /** Estimated time to complete (in minutes) */
  estimatedDuration: number;
}

/**
 * Accessibility features for content
 */
export interface AccessibilityFeatures {
  /** Alternative text for images */
  altText: boolean;
  /** Closed captions for videos */
  closedCaptions: boolean;
  /** Audio descriptions */
  audioDescriptions: boolean;
  /** Transcript available */
  transcript: boolean;
  /** High contrast support */
  highContrast: boolean;
  /** Screen reader optimized */
  screenReaderOptimized: boolean;
  /** Keyboard navigation support */
  keyboardNavigation: boolean;
  /** Reading level */
  readingLevel: 'elementary' | 'intermediate' | 'advanced' | 'expert';
}

/**
 * Content item in a learning unit
 */
export interface ContentItem {
  /** Unique identifier */
  id: string;
  /** Content type */
  type: 'video' | 'text' | 'interactive' | 'ar' | 'vr' | 'quiz';
  /** Content title */
  title: string;
  /** Content body - structure depends on type */
  content: any;
  /** Content metadata */
  metadata: ContentMetadata;
  /** Accessibility features */
  accessibilityFeatures: AccessibilityFeatures;
}

/**
 * Learning unit within a module
 */
export interface Unit {
  /** Unique identifier */
  id: string;
  /** Unit title */
  title: string;
  /** Unit description */
  description: string;
  /** Content items in the unit */
  contentItems: ContentItem[];
  /** Estimated time to complete (in minutes) */
  estimatedDuration: number;
}

/**
 * Module within a learning path
 */
export interface Module {
  /** Unique identifier */
  id: string;
  /** Module title */
  title: string;
  /** Module description */
  description: string;
  /** Units in the module */
  units: Unit[];
  /** Estimated time to complete (in minutes) */
  estimatedDuration: number;
  /** Optional assessment ID */
  assessmentId?: string;
}

/**
 * Learning path
 */
export interface LearningPath {
  /** Unique identifier */
  id: string;
  /** Learning path title */
  title: string;
  /** Learning path description */
  description: string;
  /** Modules in the learning path */
  modules: Module[];
  /** IDs of prerequisite paths */
  prerequisites?: string[];
  /** Curriculum standards this path aligns with */
  curriculumStandards: CurriculumStandard[];
  /** Estimated time to complete (in minutes) */
  estimatedDuration: number;
  /** Difficulty level */
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  /** Tags for categorization */
  tags: string[];
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
}