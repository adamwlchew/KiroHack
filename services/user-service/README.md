# User Management Service

The User Management Service handles authentication, user profiles, and user preferences for the PageFlow AI Learning Platform. It integrates with AWS Cognito for secure authentication and provides comprehensive user management capabilities.

## Features

### Authentication System (Task 5.1)
- **User Registration**: Sign up with email and password
- **Email Verification**: Confirm account via email verification code
- **User Sign In**: Authenticate with email and password
- **Password Reset**: Forgot password flow with email confirmation
- **Multi-Factor Authentication (MFA)**: Support for SMS and TOTP MFA
- **Social Authentication**: Integration with Google, Facebook, and Apple (planned)
- **Token Management**: JWT access and refresh token handling
- **Rate Limiting**: Protection against brute force attacks

## API Endpoints

### User Profile Management (Task 5.2)
- **Profile CRUD Operations**: Create, read, update, and delete user profiles
- **Profile Picture Handling**: Upload, resize, and manage profile pictures with S3 integration
- **User Preference Management**: Manage user preferences and settings
- **Settings Validation**: Comprehensive validation of user settings and preferences

### Accessibility Settings Management (Task 5.3)
- **Accessibility Preferences Storage**: Store and manage comprehensive accessibility settings
- **Reading Level Detection**: Analyze text samples to detect user reading level
- **Alternative Input Configuration**: Support for voice, switch, and eye-tracking input methods
- **Assistive Technology Detection**: Detect and configure for screen readers and other assistive technologies
- **Accessibility Recommendations**: Generate personalized accessibility recommendations

## API Endpoints

### Authentication Endpoints

#### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "displayName": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful. Please check your email for verification code.",
  "data": {
    "userSub": "user-id",
    "codeDeliveryDetails": {
      "Destination": "u***@example.com",
      "DeliveryMedium": "EMAIL"
    }
  }
}
```

#### POST /api/auth/confirm-signup
Confirm user registration with verification code.

**Request Body:**
```json
{
  "email": "user@example.com",
  "confirmationCode": "123456"
}
```

#### POST /api/auth/signin
Sign in with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Sign in successful",
  "data": {
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "displayName": "John Doe",
      "preferences": {...},
      "accessibilitySettings": {...}
    },
    "accessToken": "jwt-access-token",
    "idToken": "jwt-id-token",
    "expiresIn": 3600
  }
}
```

#### POST /api/auth/refresh-token
Refresh access token using refresh token.

#### POST /api/auth/forgot-password
Initiate password reset flow.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

#### POST /api/auth/confirm-forgot-password
Confirm password reset with verification code.

**Request Body:**
```json
{
  "email": "user@example.com",
  "confirmationCode": "123456",
  "newPassword": "NewSecurePassword123!"
}
```

#### POST /api/auth/setup-mfa
Set up multi-factor authentication (requires authentication).

**Request Body:**
```json
{
  "mfaType": "SOFTWARE_TOKEN_MFA",
  "phoneNumber": "+1234567890"
}
```

#### POST /api/auth/verify-mfa
Verify MFA challenge during sign in.

**Request Body:**
```json
{
  "session": "mfa-session-token",
  "challengeName": "SMS_MFA",
  "challengeResponses": {
    "SMS_MFA_CODE": "123456"
  }
}
```

#### GET /api/auth/profile
Get current user profile (requires authentication).

#### POST /api/auth/signout
Sign out current user (requires authentication).

### User Profile Endpoints

#### GET /api/users/profile
Get current user profile (requires authentication).

#### PUT /api/users/profile
Update user profile (requires authentication).

**Request Body:**
```json
{
  "displayName": "Updated Name",
  "preferences": {
    "theme": "dark"
  },
  "accessibilitySettings": {
    "fontSize": "large"
  }
}
```

#### DELETE /api/users/profile
Delete user profile (requires authentication).

#### POST /api/users/profile/picture
Upload profile picture (requires authentication).

**Request:** Multipart form data with `profilePicture` file field.

#### DELETE /api/users/profile/picture
Delete profile picture (requires authentication).

#### PUT /api/users/preferences
Update user preferences (requires authentication).

#### PUT /api/users/accessibility-settings
Update accessibility settings (requires authentication).

### Accessibility Endpoints

#### GET /api/accessibility/profile
Get accessibility profile (requires authentication).

#### PUT /api/accessibility/settings
Update accessibility settings (requires authentication).

**Request Body:**
```json
{
  "screenReader": true,
  "highContrast": true,
  "fontSize": "large",
  "readingLevel": "intermediate",
  "reducedMotion": true,
  "alternativeInputEnabled": true,
  "alternativeInputType": "voice"
}
```

#### POST /api/accessibility/reading-level/detect
Detect reading level from text samples (requires authentication).

**Request Body:**
```json
{
  "textSamples": [
    "Sample text for analysis...",
    "Another text sample..."
  ]
}
```

#### PUT /api/accessibility/reading-level
Update reading level (requires authentication).

**Request Body:**
```json
{
  "readingLevel": "advanced"
}
```

#### POST /api/accessibility/alternative-input/configure
Configure alternative input method (requires authentication).

**Request Body:**
```json
{
  "inputType": "voice",
  "configuration": {
    "sensitivity": 0.8,
    "language": "en-US"
  }
}
```

#### POST /api/accessibility/assistive-technologies/detect
Detect assistive technologies (requires authentication).

**Request Body:**
```json
{
  "capabilities": {
    "prefersHighContrast": true,
    "speechRecognition": true
  }
}
```

#### GET /api/accessibility/recommendations
Get personalized accessibility recommendations (requires authentication).

#### POST /api/accessibility/screen-reader/enable
Enable screen reader support (requires authentication).

#### POST /api/accessibility/high-contrast/enable
Enable high contrast mode (requires authentication).

#### POST /api/accessibility/reduced-motion/enable
Enable reduced motion (requires authentication).

#### PUT /api/accessibility/font-size
Update font size preference (requires authentication).

**Request Body:**
```json
{
  "fontSize": "x-large"
}
```

## Environment Variables

```bash
# AWS Configuration
AWS_REGION=us-east-1
COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx

# Service Configuration
PORT=3001
NODE_ENV=development
LOG_LEVEL=info

# CORS Configuration
CORS_ORIGIN=http://localhost:3000,https://app.pageflow.com

# DynamoDB Configuration (for user profiles)
DYNAMODB_ENDPOINT=http://localhost:8000
DYNAMODB_USERS_TABLE=pageflow-users

# S3 Configuration (for profile pictures)
S3_PROFILE_PICTURES_BUCKET=pageflow-profile-pictures
```

## Security Features

- **Rate Limiting**: Prevents brute force attacks
- **Input Validation**: Comprehensive request validation using Joi
- **JWT Verification**: Secure token verification using aws-jwt-verify
- **CORS Protection**: Configurable CORS policies
- **Helmet Security**: Security headers via Helmet middleware
- **Password Requirements**: Strong password validation
- **MFA Support**: Multi-factor authentication options

## Development

### Setup
```bash
npm install
```

### Development Server
```bash
npm run dev
```

### Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Building
```bash
npm run build
```

### Linting
```bash
npm run lint
npm run lint:fix
```

## Architecture

The service follows a layered architecture:

- **Controllers**: Handle HTTP requests and responses
- **Services**: Business logic and external service integration
- **Models**: Data models and interfaces
- **Middleware**: Authentication, rate limiting, and validation
- **Utils**: Utility functions and validation schemas

## AWS Cognito Integration

The service integrates with AWS Cognito for:

- User pool management
- Authentication flows
- MFA configuration
- Social identity providers
- JWT token verification
- User attribute management

## Error Handling

The service implements comprehensive error handling:

- Standardized error responses
- Cognito error mapping
- Validation error formatting
- Rate limiting responses
- Logging and monitoring

## Testing

The service includes:

- Unit tests for all services and controllers
- Integration tests for API endpoints
- Mocking of AWS services
- Test coverage reporting
- Automated test execution in CI/CD

## Monitoring and Logging

- Structured logging with correlation IDs
- Request/response logging
- Error tracking and alerting
- Performance metrics
- Health check endpoints