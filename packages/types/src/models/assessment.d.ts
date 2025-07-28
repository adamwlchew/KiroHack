/**
 * Assessment models
 */
import { CurriculumStandard } from './curriculumStandard';
/**
 * Question in an assessment
 */
export interface Question {
    /** Unique identifier */
    id: string;
    /** Question type */
    type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay' | 'interactive';
    /** Question prompt */
    prompt: string;
    /** Options for multiple choice questions */
    options?: string[];
    /** Correct answer (format depends on question type) */
    correctAnswer?: any;
    /** Points awarded for correct answer */
    points: number;
    /** Question difficulty */
    difficulty: 'easy' | 'medium' | 'hard';
    /** Feedback for correct/incorrect answers */
    feedback?: {
        /** Feedback for correct answer */
        correct: string;
        /** Feedback for incorrect answer */
        incorrect: string;
    };
}
/**
 * Answer to a question
 */
export interface Answer {
    /** Question ID */
    questionId: string;
    /** User's answer (format depends on question type) */
    value: any;
    /** Whether the answer is correct */
    isCorrect: boolean;
    /** Points awarded */
    pointsAwarded: number;
    /** Feedback provided */
    feedback?: string;
}
/**
 * Assessment
 */
export interface Assessment {
    /** Unique identifier */
    id: string;
    /** Assessment title */
    title: string;
    /** Assessment description */
    description: string;
    /** Questions in the assessment */
    questions: Question[];
    /** Minimum score to pass */
    passingScore: number;
    /** Time limit in minutes (optional) */
    timeLimit?: number;
    /** Maximum number of attempts allowed */
    attempts: number;
    /** Curriculum standards this assessment aligns with */
    curriculumStandards: CurriculumStandard[];
    /** Creation timestamp */
    createdAt: Date;
    /** Last update timestamp */
    updatedAt: Date;
}
/**
 * Assessment submission
 */
export interface AssessmentSubmission {
    /** Unique identifier */
    id: string;
    /** User ID */
    userId: string;
    /** Assessment ID */
    assessmentId: string;
    /** Answers to questions */
    answers: Answer[];
    /** Total score */
    score: number;
    /** Whether the submission passed the assessment */
    passed: boolean;
    /** Overall feedback */
    feedback: string;
    /** Start timestamp */
    startedAt: Date;
    /** Submission timestamp */
    submittedAt: Date;
    /** Grading timestamp */
    gradedAt?: Date;
    /** Attempt number */
    attemptNumber: number;
}
//# sourceMappingURL=assessment.d.ts.map