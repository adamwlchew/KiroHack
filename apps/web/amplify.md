# AWS Amplify Setup for PageFlow Web Frontend

This document provides guidance on setting up AWS Amplify for the PageFlow web frontend application.

## Prerequisites

- Node.js (v14.x or later)
- npm or yarn
- AWS account with appropriate permissions
- AWS CLI configured with your credentials
- Amplify CLI installed (`npm install -g @aws-amplify/cli`)

## Initial Setup

1. Initialize Amplify in your project:

```bash
cd apps/web
amplify init
```

Follow the prompts to configure your project:
- Enter a name for the project (e.g., pageflow-web)
- Choose your default editor
- Choose JavaScript as the type of app you're building
- Choose React as the framework
- Choose TypeScript as the language
- Choose the source directory path (src)
- Choose the distribution directory path (build)
- Choose the build command (npm run build)
- Choose the start command (npm run start)

2. Configure Amplify environments:

```bash
amplify env add
```

Create environments for development, testing, and production.

## Adding Authentication

1. Add authentication to your project:

```bash
amplify add auth
```

Configure authentication settings:
- Choose default configuration with social provider (if needed)
- Select the sign-in method (username, email, phone number)
- Configure advanced settings like MFA

2. Update your React application to use Amplify authentication:

```typescript
// src/index.tsx
import { Amplify } from 'aws-amplify';
import awsconfig from './aws-exports';

Amplify.configure(awsconfig);
```

## Adding API Integration

1. Add API to your project:

```bash
amplify add api
```

Choose between GraphQL and REST API based on your needs.

For GraphQL:
- Define your schema in `amplify/backend/api/[apiName]/schema.graphql`
- Configure authorization types

For REST API:
- Configure paths and methods
- Set up Lambda functions for backend integration

2. Update your React application to use Amplify API:

```typescript
// src/services/api.ts
import { API } from 'aws-amplify';

export const apiService = {
  getLearningPaths: () => API.get('pageflowApi', '/learning-paths', {}),
  // Add other API methods
};
```

## Adding Storage

1. Add storage to your project:

```bash
amplify add storage
```

Configure storage settings:
- Choose content (images, videos, etc.)
- Configure access levels (public, protected, private)
- Set up authentication requirements

2. Update your React application to use Amplify Storage:

```typescript
// src/services/storage.ts
import { Storage } from 'aws-amplify';

export const storageService = {
  uploadFile: (file, key) => Storage.put(key, file, {
    contentType: file.type,
    level: 'protected'
  }),
  getFile: (key) => Storage.get(key, { level: 'protected' }),
  // Add other storage methods
};
```

## Setting Up Hosting and CI/CD

1. Add hosting to your project:

```bash
amplify add hosting
```

Choose between:
- Amplify Console (recommended for CI/CD)
- Amazon CloudFront and S3

2. Configure CI/CD settings in the Amplify Console:
- Connect your repository
- Configure build settings
- Set up branch-based deployments
- Configure preview environments for pull requests

3. Add custom domain:

```bash
amplify add domain
```

Follow the prompts to configure your custom domain.

## Deploying Your Application

1. Publish your application:

```bash
amplify publish
```

This will build your application and deploy it to the Amplify hosting environment.

## Monitoring and Analytics

1. Add analytics to your project:

```bash
amplify add analytics
```

Configure analytics settings:
- Choose Amazon Pinpoint
- Configure event tracking

2. Update your React application to use Amplify Analytics:

```typescript
// src/services/analytics.ts
import { Analytics } from 'aws-amplify';

export const analyticsService = {
  trackEvent: (name, attributes) => Analytics.record({
    name,
    attributes
  }),
  // Add other analytics methods
};
```

## Best Practices

1. **Environment Management**:
   - Use separate environments for development, testing, and production
   - Limit production access to authorized team members

2. **Authentication**:
   - Implement proper role-based access control
   - Enable MFA for sensitive operations
   - Use social identity providers for simplified login

3. **API Design**:
   - Use GraphQL for complex data requirements
   - Use REST for simpler CRUD operations
   - Implement proper authorization on all API endpoints

4. **Storage**:
   - Use appropriate access levels for different content types
   - Implement file size limits and type validation
   - Set up lifecycle policies for cost optimization

5. **CI/CD**:
   - Configure automated tests in the build pipeline
   - Use branch-based deployments
   - Implement preview environments for pull requests

6. **Monitoring**:
   - Set up alerts for critical errors
   - Monitor performance metrics
   - Track user behavior for UX improvements