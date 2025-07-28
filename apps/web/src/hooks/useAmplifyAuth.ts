/**
 * Custom hook for Amplify authentication
 */
import { useState, useEffect } from 'react';
import { getCurrentUser } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';

interface AuthState {
  isAuthenticated: boolean;
  user: any | null;
  isLoading: boolean;
}

export function useAmplifyAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: true,
  });

  useEffect(() => {
    // Check for current authenticated user
    checkCurrentAuthenticatedUser();

    // Set up listener for auth events
    const unsubscribe = Hub.listen('auth', ({ payload }) => {
      const { event } = payload;
      switch (event) {
        case 'signedIn':
          checkCurrentAuthenticatedUser();
          break;
        case 'signedOut':
          setAuthState({
            isAuthenticated: false,
            user: null,
            isLoading: false,
          });
          break;
        case 'customOAuthState':
          console.log('customOAuthState', payload);
          break;
      }
    });

    // Clean up listener
    return () => {
      unsubscribe();
    };
  }, []);

  async function checkCurrentAuthenticatedUser() {
    try {
      const user = await getCurrentUser();
      setAuthState({
        isAuthenticated: true,
        user,
        isLoading: false,
      });
    } catch (error) {
      setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
      });
    }
  }

  return authState;
}

export default useAmplifyAuth;