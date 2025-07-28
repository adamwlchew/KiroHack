import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { PageCompanion, Emotion, PersonalityTrait } from '@pageflow/types';
import { MockCompanionService } from '@pageflow/utils/src/companion/companionService';

export interface CompanionState {
  companion: PageCompanion | null;
  loading: boolean;
  error: string | null;
  isVisible: boolean;
  interactionInProgress: boolean;
}

const initialState: CompanionState = {
  companion: null,
  loading: false,
  error: null,
  isVisible: true,
  interactionInProgress: false
};

const companionService = new MockCompanionService();

export const fetchCompanion = createAsyncThunk(
  'companion/fetchCompanion',
  async (_: void, { rejectWithValue }) => {
    try {
      return await companionService.fetchCompanion();
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch companion data');
    }
  }
);

export const interactWithCompanion = createAsyncThunk(
  'companion/interact',
  async (userInput: string, { rejectWithValue }) => {
    try {
      return await companionService.interactWithCompanion(userInput);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to process companion interaction');
    }
  }
);

const companionSlice = createSlice({
  name: 'companion',
  initialState,
  reducers: {
    toggleCompanionVisibility: (state) => {
      state.isVisible = !state.isVisible;
    },
    updateCompanionEmotion: (state, action: PayloadAction<{ emotion: Emotion; intensity: number }>) => {
      if (state.companion) {
        state.companion.emotionalState = {
          primary: action.payload.emotion,
          intensity: action.payload.intensity,
          lastUpdated: new Date().toISOString()
        };
      }
    },
    updateCompanionPersonality: (state, action: PayloadAction<PersonalityTrait[]>) => {
      if (state.companion) {
        state.companion.personality = action.payload;
      }
    },
    updateCompanionAppearance: (state, action: PayloadAction<Partial<PageCompanion['appearance']>>) => {
      if (state.companion) {
        state.companion.appearance = {
          ...state.companion.appearance,
          ...action.payload
        };
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCompanion.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCompanion.fulfilled, (state, action) => {
        state.loading = false;
        state.companion = action.payload;
      })
      .addCase(fetchCompanion.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(interactWithCompanion.pending, (state) => {
        state.interactionInProgress = true;
      })
      .addCase(interactWithCompanion.fulfilled, (state, action) => {
        state.interactionInProgress = false;
        if (state.companion) {
          // Update emotional state based on response
          if (action.payload.emotionalState) {
            state.companion.emotionalState = {
              ...action.payload.emotionalState,
              lastUpdated: new Date().toISOString()
            };
          }
        }
      })
      .addCase(interactWithCompanion.rejected, (state, action) => {
        state.interactionInProgress = false;
        state.error = action.payload as string;
      });
  }
});

export const { 
  toggleCompanionVisibility, 
  updateCompanionEmotion, 
  updateCompanionPersonality,
  updateCompanionAppearance
} = companionSlice.actions;
export default companionSlice.reducer;