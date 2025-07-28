import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User, UserRole } from '@pageflow/types';

export interface UserState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  user: null,
  loading: false,
  error: null
};

export const fetchUserProfile = createAsyncThunk(
  'user/fetchUserProfile',
  async (_, { rejectWithValue }) => {
    try {
      // Mock user data for development
      return {
        id: '123',
        email: 'user@example.com',
        firstName: 'Alex',
        lastName: 'Johnson',
        role: UserRole.LEARNER,
        preferences: {
          theme: 'light' as const,
          fontSize: 'medium' as const,
          reducedMotion: false,
          screenReaderOptimized: false,
          readingLevel: 'intermediate' as const,
          preferredInputMethod: 'standard' as const,
          pageCompanionSettings: {
            interactionStyle: 'visual' as const,
            personality: 'encouraging' as const,
            verbosity: 'balanced' as const
          }
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch user profile');
    }
  }
);

export const updateUserPreferences = createAsyncThunk(
  'user/updateUserPreferences',
  async (preferences: Partial<User['preferences']>, { getState, rejectWithValue }) => {
    try {
      // Mock response for development
      const state = getState() as { user: UserState };
      const updatedUser = {
        ...state.user.user,
        preferences: {
          ...state.user.user?.preferences,
          ...preferences
        },
        updatedAt: new Date().toISOString()
      };
      
      // In a real app, this would be an API call
      // await api.updateUserPreferences(updatedUser.preferences);
      
      return updatedUser;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update user preferences');
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    clearUser: (state) => {
      state.user = null;
    },
    logout: (state) => {
      state.user = null;
      state.error = null;
    },
    updateAccessibilitySettings: (state, action: PayloadAction<Partial<User['preferences']>>) => {
      if (state.user) {
        state.user.preferences = {
          ...state.user.preferences,
          ...action.payload
        };
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateUserPreferences.fulfilled, (state, action) => {
        if (state.user) {
          state.user.preferences = action.payload.preferences;
        }
      });
  }
});

export const { setUser, clearUser, logout, updateAccessibilitySettings } = userSlice.actions;
export default userSlice.reducer;