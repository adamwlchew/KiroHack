import { User } from '@pageflow/types';

// Cognito-based authentication interfaces
export interface CognitoAuthRequest {
  email: string;
  password: string;
}

export interface CognitoRegisterRequest {
  email: string;
  password: string;
  displayName: string;
  attributes?: Record<string, string>;
}

export interface CognitoAuthResponse {
  user: User;
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface CognitoRefreshTokenRequest {
  refreshToken: string;
}

export interface CognitoPasswordResetRequest {
  email: string;
}

export interface CognitoPasswordResetConfirmRequest {
  email: string;
  confirmationCode: string;
  newPassword: string;
}

export interface CognitoConfirmSignUpRequest {
  email: string;
  confirmationCode: string;
}

export interface CognitoMFASetupRequest {
  accessToken: string;
  mfaType: 'SMS_MFA' | 'SOFTWARE_TOKEN_MFA';
  phoneNumber?: string;
}

export interface CognitoMFAVerifyRequest {
  session: string;
  challengeName: string;
  challengeResponses: Record<string, string>;
}

export interface CognitoSocialAuthRequest {
  provider: 'Google' | 'Facebook' | 'SignInWithApple';
  token: string;
}

export interface CognitoTokenPayload {
  sub: string; // Cognito user ID
  email: string;
  email_verified: boolean;
  aud: string; // Client ID
  token_use: 'access' | 'id';
  auth_time: number;
  iat: number;
  exp: number;
}

export interface CognitoUserAttributes {
  sub: string;
  email: string;
  email_verified: string;
  name?: string;
  picture?: string;
  phone_number?: string;
  phone_number_verified?: string;
}