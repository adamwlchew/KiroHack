# Progress Service

The Progress Service is responsible for tracking user learning progress, managing milestones, and handling achievements within the PageFlow AI Learning Platform.

## Features

- **Progress Tracking**: Track user progress across learning paths, modules, units, and content items
- **Milestone Detection**: Automatically detect and award milestones based on learning achievements
- **Achievement System**: Create and manage achievements based on milestone completion
- **Cross-Device Sync**: Support for progress synchronization across multiple devices
- **Real-time Updates**: Immediate progress updates with milestone and achievement detection

## API Endpoints

### Progress Management

- `GET /api/progress/users/:userId/paths/:pathId` - Get progress for a specific learning path
- `GET /api/progress/users/:userId` - Get all progress for a user
- `PUT /api/progress/users/:userId/paths/:pathId` - Update progress for a content item

### Milestones

- `GET /api/progress/users/:userId/milestones` - Get user milestones
- `PUT /api/progress/users/:userId/milestones/:milestoneId/celebration` - Mark milestone celebration as shown

### Achievements

- `GET /api/progress/users/:userId/achievements` - Get user achievements
- `GET /api/progress/users/:userId/achievements/recent` - Get recent achievements for celebration
- `PUT /api/progress/users/:userId/achievements/:achievementId/celebration` - Mark achievement celebration as shown

## Data Models

### Progress
Tracks user progress across learning paths with hierarchical structure:
- Learning Path → Modules → Units → Content Items

### Milestones
Predefined achievements that users can unlock:
- Path Started
- Module Completed
- Path Completed
- Streak Achieved
- Mastery Demonstrated
- Perseverance Shown

### Achievements
Awards given to users based on milestone completion with celebration system.

## Database Schema

Uses DynamoDB with the following access patterns:

### Primary Key Structure
- **PK**: `USER#{userId}` or `PATH#{pathId}`
- **SK**: `PATH#{pathId}`, `MILESTONE#{milestoneId}`, `ACHIEVEMENT#{achievementId}`

### Global Secondary Index (GSI1)
- **GSI1PK**: `PATH#{pathId}`, `TYPE#{achievementType}`
- **GSI1SK**: `USER#{userId}`, `MILESTONE#{timestamp}`, `AWARDED#{timestamp}`

## Environment Variables

```bash
PORT=3003
NODE_ENV=development
AWS_REGION=us-east-1
DYNAMODB_TABLE_NAME=pageflow-progress-dev
DYNAMODB_ENDPOINT=http://localhost:8000  # For local development
CORS_ORIGINS=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
LOG_LEVEL=info
```

## Development

### Install Dependencies
```bash
npm install
```

### Run in Development Mode
```bash
npm run dev
```

### Run Tests
```bash
npm test
npm run test:watch
npm run test:coverage
```

### Build for Production
```bash
npm run build
npm start
```

## Testing

The service includes comprehensive tests for:
- Progress tracking functionality
- Milestone detection logic
- Achievement creation
- Repository operations
- API endpoints

## Architecture

The service follows a layered architecture:

1. **Controllers**: Handle HTTP requests and responses
2. **Services**: Business logic and orchestration
3. **Repositories**: Data access layer for DynamoDB
4. **Models**: Data structures and interfaces

## Integration

The Progress Service integrates with:
- **User Service**: For user authentication and profile data
- **Learning Path Service**: For curriculum structure and content metadata
- **Page Companion Service**: For personalized celebration experiences
- **Device Sync Service**: For cross-device progress synchronization

## Monitoring

The service includes:
- Health check endpoint (`/health`)
- Structured logging with correlation IDs
- Error handling with proper HTTP status codes
- Rate limiting for API protection