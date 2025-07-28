/**
 * Curriculum Standard models
 */

/**
 * Content mapping to curriculum standards
 */
export interface ContentMapping {
  /** Content ID */
  contentId: string;
  /** Content type */
  contentType: 'path' | 'module' | 'unit' | 'content_item' | 'assessment';
  /** Strength of alignment */
  alignmentStrength: 'strong' | 'moderate' | 'weak';
  /** Additional notes about the alignment */
  notes?: string;
}

/**
 * Curriculum standard
 */
export interface CurriculumStandard {
  /** Unique identifier */
  id: string;
  /** Standard code (e.g., "CCSS.MATH.CONTENT.K.CC.A.1") */
  code: string;
  /** Standard name */
  name: string;
  /** Standard description */
  description: string;
  /** Category (e.g., "Mathematics", "Science") */
  category: string;
  /** Subcategory (e.g., "Algebra", "Geometry") */
  subcategory?: string;
  /** Grade levels this standard applies to */
  gradeLevel: string[];
  /** Educational jurisdiction */
  jurisdiction: 'US' | 'UK' | 'AU' | 'CA' | 'International';
  /** Curriculum framework */
  framework: string;
  /** Content mappings to this standard */
  contentMappings: ContentMapping[];
}