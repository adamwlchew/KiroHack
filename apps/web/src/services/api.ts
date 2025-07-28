/**
 * API service for making requests to the backend
 */

// Base API URL - would typically come from environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

/**
 * Generic fetch wrapper with error handling
 */
async function fetchWithErrorHandling<T>(
  url: string, 
  options: RequestInit = {}
): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      // Try to parse error response
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }
      
      throw new Error(
        errorData.error?.message || 
        `HTTP error ${response.status}: ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

/**
 * User API methods
 */
export const userApi = {
  /**
   * Get current user profile
   */
  getProfile: () => fetchWithErrorHandling('/user/profile'),
  
  /**
   * Update user preferences
   */
  updatePreferences: (preferences: any) => fetchWithErrorHandling('/user/preferences', {
    method: 'PATCH',
    body: JSON.stringify({ preferences }),
  }),
  
  /**
   * Update accessibility settings
   */
  updateAccessibilitySettings: (settings: any) => fetchWithErrorHandling('/user/accessibility', {
    method: 'PATCH',
    body: JSON.stringify({ settings }),
  }),
};

/**
 * Page Companion API methods
 */
export const companionApi = {
  /**
   * Get user's companion data
   */
  getCompanion: () => fetchWithErrorHandling('/companion'),
  
  /**
   * Send user interaction to companion
   */
  sendInteraction: (userInput: string, context?: any) => fetchWithErrorHandling('/companion/interaction', {
    method: 'POST',
    body: JSON.stringify({ userInput, context }),
  }),
  
  /**
   * Update companion appearance
   */
  updateAppearance: (appearance: any) => fetchWithErrorHandling('/companion/appearance', {
    method: 'PATCH',
    body: JSON.stringify({ appearance }),
  }),
  
  /**
   * Update companion personality
   */
  updatePersonality: (personality: string[]) => fetchWithErrorHandling('/companion/personality', {
    method: 'PATCH',
    body: JSON.stringify({ personality }),
  }),
};

/**
 * Learning API methods
 */
export const learningApi = {
  /**
   * Get all learning paths
   */
  getLearningPaths: () => fetchWithErrorHandling('/learning/paths'),
  
  /**
   * Get learning path details
   */
  getLearningPathDetails: (pathId: string) => fetchWithErrorHandling(`/learning/paths/${pathId}`),
  
  /**
   * Update content progress
   */
  updateContentProgress: (data: { 
    contentItemId: string; 
    completed: boolean; 
    timeSpent: number 
  }) => fetchWithErrorHandling('/learning/progress', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  /**
   * Get user progress for a specific learning path
   */
  getUserProgress: (pathId: string) => fetchWithErrorHandling(`/learning/progress/${pathId}`),
};

/**
 * Assessment API methods
 */
export const assessmentApi = {
  /**
   * Get assessment by ID
   */
  getAssessment: (assessmentId: string) => fetchWithErrorHandling(`/assessment/${assessmentId}`),
  
  /**
   * Submit assessment answers
   */
  submitAssessment: (assessmentId: string, answers: any[]) => fetchWithErrorHandling(`/assessment/${assessmentId}/submit`, {
    method: 'POST',
    body: JSON.stringify({ answers }),
  }),
};

// Export a default API object with all methods
export default {
  user: userApi,
  companion: companionApi,
  learning: learningApi,
  assessment: assessmentApi,
};