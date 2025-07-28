# Project Structure

PageFlow follows a monorepo structure with clear separation of concerns between different parts of the application.

## Root Directory Structure

```
pageflow/
├── apps/                  # Frontend applications
│   ├── web/               # Web application (React)
│   ├── mobile/            # Mobile AR application (React Native)
│   └── vr/                # VR application (Unity/WebGL)
├── services/              # Backend microservices
│   ├── api-gateway/       # API Gateway service
│   ├── user-service/      # User management service
│   ├── progress-service/  # Progress tracking service
│   ├── assessment/        # Assessment service
│   ├── learning-path/     # Learning path service
│   ├── page-companion/    # Page AI companion service
│   ├── device-sync/       # Device synchronization service
│   ├── content-gen/       # Content generation service
│   ├── curriculum/        # Curriculum alignment service
│   ├── assignment/        # Assignment analysis service
│   └── bedrock/           # Bedrock integration service
├── packages/              # Shared packages
│   ├── types/             # Shared TypeScript interfaces
│   ├── utils/             # Shared utilities
│   ├── db-utils/          # Database utilities
│   └── testing/           # Testing framework and utilities
├── infrastructure/        # AWS CDK infrastructure code
│   ├── network/           # Network stack
│   ├── storage/           # Storage stack
│   ├── compute/           # Compute stack
│   ├── monitoring/        # Monitoring stack
│   ├── cicd/              # CI/CD stack
│   └── security/          # Security stack
├── docs/                  # Documentation
└── scripts/               # Build and utility scripts
```

## Service Structure

Each microservice follows a consistent structure:

```
service-name/
├── src/
│   ├── controllers/       # Request handlers
│   ├── services/          # Business logic
│   ├── repositories/      # Data access
│   ├── models/            # Data models
│   ├── utils/             # Service-specific utilities
│   ├── middleware/        # Middleware functions
│   ├── config/            # Service configuration
│   └── index.ts           # Service entry point
├── test/
│   ├── unit/              # Unit tests
│   ├── integration/       # Integration tests
│   └── fixtures/          # Test fixtures
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
└── README.md              # Service documentation
```

## Frontend Application Structure

Each frontend application follows a consistent structure:

```
app-name/
├── src/
│   ├── components/        # UI components
│   │   ├── common/        # Shared components
│   │   └── features/      # Feature-specific components
│   ├── hooks/             # Custom React hooks
│   ├── pages/             # Page components
│   ├── services/          # API services
│   ├── store/             # State management
│   ├── utils/             # Utility functions
│   ├── types/             # TypeScript types
│   ├── assets/            # Static assets
│   └── App.tsx            # Root component
├── public/                # Public assets
├── test/                  # Tests
├── package.json           # Dependencies and scripts
└── tsconfig.json          # TypeScript configuration
```

## Code Organization Principles

1. **Feature-based Organization**: Code is organized by feature rather than by type
2. **Clear Boundaries**: Services have well-defined responsibilities and interfaces
3. **Shared Code**: Common code is extracted into shared packages
4. **Consistent Patterns**: Similar problems are solved in similar ways across the codebase
5. **Accessibility Integration**: Accessibility features are built into the core components
6. **Test Proximity**: Tests are located close to the code they test