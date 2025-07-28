import { configureStore } from '@reduxjs/toolkit';
import userSlice from '@/store/slices/userSlice';
import learningSlice from '@/store/slices/learningSlice';

describe('Redux Store', () => {
  it('should create store with user and learning slices', () => {
    const store = configureStore({
      reducer: {
        user: userSlice,
        learning: learningSlice,
      },
    });

    const state = store.getState();
    expect(state.user).toBeDefined();
    expect(state.learning).toBeDefined();
  });

  it('should handle user state updates', () => {
    const store = configureStore({
      reducer: {
        user: userSlice,
        learning: learningSlice,
      },
    });

    const initialState = store.getState();
    expect(initialState.user.user).toBeNull();
    expect(initialState.user.loading).toBe(false);
  });

  it('should handle learning state updates', () => {
    const store = configureStore({
      reducer: {
        user: userSlice,
        learning: learningSlice,
      },
    });

    const initialState = store.getState();
    expect(initialState.learning.paths).toEqual([]);
    expect(initialState.learning.loading).toBe(false);
  });
}); 