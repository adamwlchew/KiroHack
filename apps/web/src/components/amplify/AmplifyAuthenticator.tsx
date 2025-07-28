/**
 * Amplify Authenticator component
 */
import React from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import styled from 'styled-components';

interface AmplifyAuthenticatorProps {
  children: React.ReactNode;
}

const AuthenticatorContainer = styled.div`
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
  
  /* Custom styling for the Authenticator */
  .amplify-button--primary {
    background-color: ${props => props.theme.colors.primary};
  }
  
  .amplify-tabs {
    border-bottom-color: ${props => props.theme.colors.primary};
  }
  
  .amplify-tabs-item[data-state="active"] {
    color: ${props => props.theme.colors.primary};
    border-color: ${props => props.theme.colors.primary};
  }
`;

/**
 * Amplify Authenticator component that wraps content requiring authentication
 */
export const AmplifyAuthenticator: React.FC<AmplifyAuthenticatorProps> = ({ children }) => {
  return (
    <AuthenticatorContainer>
      <Authenticator>
        {({ signOut, user }) => (
          <div>
            {children}
          </div>
        )}
      </Authenticator>
    </AuthenticatorContainer>
  );
};

export default AmplifyAuthenticator;