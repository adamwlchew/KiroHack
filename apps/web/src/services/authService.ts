/**
 * Authentication service using AWS Amplify
 */
import { signUp, signIn, confirmSignUp, signOut, getCurrentUser, resetPassword, confirmResetPassword, fetchAuthSession } from 'aws-amplify/auth';

export interface SignUpParams {
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface SignInParams {
  username: string;
  password: string;
}

/**
 * Authentication service
 */
export const authService = {
  /**
   * Sign up a new user
   */
  signUp: async ({ username, password, email, firstName, lastName }: SignUpParams) => {
    try {
      const result = await signUp({
        username,
        password,
        options: {
          userAttributes: {
            email,
            given_name: firstName,
            family_name: lastName,
          }
        }
      });
      return result;
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  },

  /**
   * Sign in a user
   */
  signIn: async ({ username, password }: SignInParams) => {
    try {
      const user = await signIn({ username, password });
      return user;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  },

  /**
   * Sign out the current user
   */
  signOut: async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  },

  /**
   * Get the current authenticated user
   */
  getCurrentUser: async () => {
    try {
      return await getCurrentUser();
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  /**
   * Get the current session
   */
  getCurrentSession: async () => {
    try {
      return await fetchAuthSession();
    } catch (error) {
      console.error('Error getting current session:', error);
      return null;
    }
  },

  /**
   * Check if a user is authenticated
   */
  isAuthenticated: async () => {
    try {
      await getCurrentUser();
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Confirm sign up with verification code
   */
  confirmSignUp: async (username: string, code: string) => {
    try {
      return await confirmSignUp({ username, confirmationCode: code });
    } catch (error) {
      console.error('Error confirming sign up:', error);
      throw error;
    }
  },

  /**
   * Request password reset
   */
  forgotPassword: async (username: string) => {
    try {
      return await resetPassword({ username });
    } catch (error) {
      console.error('Error requesting password reset:', error);
      throw error;
    }
  },

  /**
   * Confirm password reset with verification code
   */
  forgotPasswordSubmit: async (username: string, code: string, newPassword: string) => {
    try {
      return await confirmResetPassword({ username, confirmationCode: code, newPassword });
    } catch (error) {
      console.error('Error submitting password reset:', error);
      throw error;
    }
  },
};

export default authService;