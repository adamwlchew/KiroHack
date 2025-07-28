import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Progress, ProgressStatus } from '@pageflow/types';

// Define types for learning path data
export interface LearningPath {
  id: string;
  title: string;
  description: string;
  progress: number;
  imageUrl?: string;
  modules: Module[];
  estimatedDuration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  overallCompletion: number;
  totalTimeSpent: number;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  units: Unit[];
  estimatedDuration: number;
  completed: boolean;
  completion: number;
  timeSpent?: number;
  hasAssessment?: boolean;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface Unit {
  id: string;
  title: string;
  description: string;
  contentItems: ContentItem[];
  estimatedDuration: number;
  completed: boolean;
}

export interface ContentItem {
  id: string;
  type: 'video' | 'text' | 'interactive' | 'ar' | 'vr' | 'quiz';
  title: string;
  content: any;
  completed: boolean;
}

export interface LearningState {
  paths: LearningPath[];
  currentPath: LearningPath | null;
  currentModule: Module | null;
  currentUnit: Unit | null;
  currentContentItem: ContentItem | null;
  currentProgress: Progress | null;
  loading: boolean;
  error: string | null;
}

const initialState: LearningState = {
  paths: [],
  currentPath: null,
  currentModule: null,
  currentUnit: null,
  currentContentItem: null,
  currentProgress: null,
  loading: false,
  error: null
};

export const fetchLearningPaths = createAsyncThunk(
  'learning/fetchPaths',
  async (_: void, { rejectWithValue }) => {
    try {
      // Mock learning paths data - replace with actual API call
      return [
        {
          id: '1',
          title: 'Introduction to AI',
          description: 'Learn the basics of artificial intelligence and machine learning.',
          modules: [
            { 
              id: '1-1', 
              title: 'What is AI?', 
              description: 'Introduction to artificial intelligence',
              units: [],
              estimatedDuration: 30,
              completed: false,
              completion: 75,
              timeSpent: 1200,
              hasAssessment: true,
              difficulty: 'beginner' as const
            },
            { 
              id: '1-2', 
              title: 'Machine Learning Basics', 
              description: 'Understanding machine learning concepts',
              units: [],
              estimatedDuration: 45,
              completed: false,
              completion: 25,
              timeSpent: 600,
              hasAssessment: false,
              difficulty: 'intermediate' as const
            },
            { 
              id: '1-3', 
              title: 'Neural Networks', 
              description: 'Deep dive into neural network architecture',
              units: [],
              estimatedDuration: 60,
              completed: false,
              completion: 0,
              timeSpent: 0,
              hasAssessment: true,
              difficulty: 'advanced' as const
            }
          ],
          progress: 25,
          imageUrl: 'https://placeholder.com/300x200',
          estimatedDuration: 120,
          difficulty: 'beginner' as const,
          overallCompletion: 25,
          totalTimeSpent: 1800
        },
        {
          id: '2',
          title: 'Web Development Fundamentals',
          description: 'Master HTML, CSS, and JavaScript for modern web development.',
          modules: [
            { 
              id: '2-1', 
              title: 'HTML Structure', 
              description: 'Building semantic HTML documents',
              units: [],
              estimatedDuration: 40,
              completed: true,
              completion: 100,
              timeSpent: 2400,
              hasAssessment: true,
              difficulty: 'beginner' as const
            },
            { 
              id: '2-2', 
              title: 'CSS Styling', 
              description: 'Creating beautiful and responsive designs',
              units: [],
              estimatedDuration: 50,
              completed: true,
              completion: 100,
              timeSpent: 3000,
              hasAssessment: true,
              difficulty: 'intermediate' as const
            }
          ],
          progress: 60,
          imageUrl: 'https://placeholder.com/300x200',
          estimatedDuration: 90,
          difficulty: 'intermediate' as const,
          overallCompletion: 60,
          totalTimeSpent: 5400
        }
      ];
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch learning paths');
    }
  }
);

export const fetchLearningPath = createAsyncThunk(
  'learning/fetchPath',
  async (pathId: string, { rejectWithValue }) => {
    try {
      // Mock single learning path data - replace with actual API call
      const mockPath: LearningPath = {
        id: pathId,
        title: pathId === '1' ? 'Introduction to AI' : 'Web Development Fundamentals',
        description: pathId === '1' 
          ? 'Learn the basics of artificial intelligence and machine learning.'
          : 'Master HTML, CSS, and JavaScript for modern web development.',
        modules: [
          { 
            id: `${pathId}-1`, 
            title: pathId === '1' ? 'What is AI?' : 'HTML Structure', 
            description: pathId === '1' ? 'Introduction to artificial intelligence' : 'Building semantic HTML documents',
            units: [],
            estimatedDuration: pathId === '1' ? 30 : 40,
            completed: pathId === '2',
            completion: pathId === '2' ? 100 : 75,
            timeSpent: pathId === '2' ? 2400 : 1200,
            hasAssessment: true,
            difficulty: 'beginner' as const
          },
          { 
            id: `${pathId}-2`, 
            title: pathId === '1' ? 'Machine Learning Basics' : 'CSS Styling', 
            description: pathId === '1' ? 'Understanding machine learning concepts' : 'Creating beautiful and responsive designs',
            units: [],
            estimatedDuration: pathId === '1' ? 45 : 50,
            completed: pathId === '2',
            completion: pathId === '2' ? 100 : 25,
            timeSpent: pathId === '2' ? 3000 : 600,
            hasAssessment: pathId === '2',
            difficulty: 'intermediate' as const
          }
        ],
        progress: pathId === '2' ? 60 : 25,
        imageUrl: 'https://placeholder.com/300x200',
        estimatedDuration: pathId === '2' ? 90 : 120,
        difficulty: pathId === '2' ? 'intermediate' : 'beginner',
        overallCompletion: pathId === '2' ? 60 : 25,
        totalTimeSpent: pathId === '2' ? 5400 : 1800
      };
      
      return mockPath;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch learning path');
    }
  }
);

export const fetchProgress = createAsyncThunk(
  'learning/fetchProgress',
  async (moduleId: string, { rejectWithValue }) => {
    try {
      // Mock progress data - replace with actual API call
      const mockProgress: Progress = {
        userId: '123',
        pathId: moduleId.split('-')[0],
        moduleProgress: [
          {
            moduleId,
            unitProgress: [],
            completion: 75,
            startedAt: new Date(),
          }
        ],
        overallCompletion: 75,
        startedAt: new Date(),
        lastAccessedAt: new Date(),
        deviceSyncStatus: {
          lastSyncedAt: new Date(),
          syncedDevices: ['web'],
          pendingSync: false
        }
      };
      
      return mockProgress;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to fetch progress');
    }
  }
);

export const updateProgress = createAsyncThunk(
  'learning/updateProgress',
  async ({ pathId, moduleId, score }: { pathId: string; moduleId: string; score: number }, { rejectWithValue }) => {
    try {
      // Mock updated progress - replace with actual API call
      const mockProgress: Progress = {
        userId: '123',
        pathId,
        moduleProgress: [
          {
            moduleId,
            unitProgress: [],
            completion: score,
            startedAt: new Date(),
          }
        ],
        overallCompletion: score,
        startedAt: new Date(),
        lastAccessedAt: new Date(),
        deviceSyncStatus: {
          lastSyncedAt: new Date(),
          syncedDevices: ['web'],
          pendingSync: false
        }
      };
      
      return mockProgress;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to update progress');
    }
  }
);

const learningSlice = createSlice({
  name: 'learning',
  initialState,
  reducers: {
    setCurrentPath: (state, action: PayloadAction<string>) => {
      const pathId = action.payload;
      const path = state.paths.find((p) => p.id === pathId);
      if (path) {
        state.currentPath = path;
        state.currentModule = path.modules[0] || null;
        state.currentUnit = path.modules[0]?.units[0] || null;
        state.currentContentItem = path.modules[0]?.units[0]?.contentItems[0] || null;
      }
    },
    setCurrentModule: (state, action: PayloadAction<string>) => {
      const moduleId = action.payload;
      if (state.currentPath) {
        const module = state.currentPath.modules.find((m) => m.id === moduleId);
        if (module) {
          state.currentModule = module;
          state.currentUnit = module.units[0] || null;
          state.currentContentItem = module.units[0]?.contentItems[0] || null;
        }
      }
    },
    setCurrentUnit: (state, action: PayloadAction<string>) => {
      const unitId = action.payload;
      if (state.currentModule) {
        const unit = state.currentModule.units.find((u) => u.id === unitId);
        if (unit) {
          state.currentUnit = unit;
          state.currentContentItem = unit.contentItems[0] || null;
        }
      }
    },
    setCurrentContentItem: (state, action: PayloadAction<string>) => {
      const contentItemId = action.payload;
      if (state.currentUnit) {
        const contentItem = state.currentUnit.contentItems.find((c) => c.id === contentItemId);
        if (contentItem) {
          state.currentContentItem = contentItem;
        }
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLearningPaths.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLearningPaths.fulfilled, (state, action) => {
        state.loading = false;
        state.paths = action.payload;
      })
      .addCase(fetchLearningPaths.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchLearningPath.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLearningPath.fulfilled, (state, action) => {
        state.loading = false;
        state.currentPath = action.payload;
      })
      .addCase(fetchLearningPath.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchProgress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProgress.fulfilled, (state, action) => {
        state.loading = false;
        state.currentProgress = action.payload;
      })
      .addCase(fetchProgress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateProgress.fulfilled, (state, action) => {
        state.currentProgress = action.payload;
        
        // Update progress in learning paths
        const pathId = action.payload.pathId;
        const learningPathIndex = state.paths.findIndex((path) => path.id === pathId);
        
        if (learningPathIndex !== -1) {
          state.paths[learningPathIndex].progress = action.payload.overallCompletion;
          state.paths[learningPathIndex].overallCompletion = action.payload.overallCompletion;
        }
      });
  }
});

export const { 
  setCurrentPath, 
  setCurrentModule, 
  setCurrentUnit, 
  setCurrentContentItem 
} = learningSlice.actions;
export default learningSlice.reducer;