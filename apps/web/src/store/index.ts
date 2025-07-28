import { configureStore } from '@reduxjs/toolkit';
import userReducer from './slices/userSlice';
import companionReducer from './slices/companionSlice';
import learningReducer from './slices/learningSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    companion: companionReducer,
    learning: learningReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;