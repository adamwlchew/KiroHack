# Learning Path Service

The Learning Path Service is a core component of the PageFlow platform that manages personalized learning paths, recommendations, and adaptive learning experiences.

## Features

### 🎯 Learning Path Management
- Create, read, update, and delete learning paths
- Generate personalized learning paths using AI
- Adapt learning paths based on user progress and feedback
- Optimize learning paths for better engagement and completion

### 🤖 AI-Powered Personalization
- Learning style detection and analysis
- Adaptive difficulty adjustment
- Personalized content recommendations
- Learning preferences management

### 📊 Analytics & Insights
- Learning path analytics and metrics
- User progress tracking
- Performance analysis
- Engagement monitoring

### 🔄 Recommendation Engine
- Content-based recommendations
- Collaborative filtering
- Trending and popular content
- Next steps suggestions

## API Endpoints

### Learning Path Management
- `POST /api/learning-paths` - Create a new learning path
- `GET /api/learning-paths` - Get all learning paths with filtering
- `GET /api/learning-paths/:id` - Get learning path by ID
- `PUT /api/learning-paths/:id` - Update learning path
- `DELETE /api/learning-paths/:id` - Delete learning path

### Learning Path Generation
- `POST /api/learning-paths/generate` - Generate personalized learning path
- `POST /api/learning-paths/:id/adapt` - Adapt learning path for user
- `POST /api/learning-paths/:id/optimize` - Optimize learning path

### Progress Tracking
- `GET /api/learning-paths/:id/progress/:userId` - Get user progress
- `POST /api/learning-paths/:id/progress/:userId` - Update user progress
- `GET /api/learning-paths/:id/analytics` - Get learning path analytics

### Content Management
- `GET /api/learning-paths/:id/modules` - Get learning path modules
- `POST /api/learning-paths/:id/modules` - Add module to path
- `PUT /api/learning-paths/:id/modules/:moduleId` - Update module in path
- `DELETE /api/learning-paths/:id/modules/:moduleId` - Remove module from path

### Recommendations
- `GET /api/recommendations/content/:userId` - Get content recommendations
- `POST /api/recommendations/content/:userId/feedback` - Submit content feedback
- `GET /api/recommendations/paths/:userId` - Get learning path recommendations
- `GET /api/recommendations/trending` - Get trending content
- `GET /api/recommendations/popular` - Get popular content

### Personalization
- `POST /api/personalization/learning-style/:userId` - Detect learning style
- `GET /api/personalization/preferences/:userId` - Get learning preferences
- `PUT /api/personalization/preferences/:userId` - Update learning preferences
- `POST /api/personalization/adaptive/:userId` - Create adaptive profile
- `POST /api/personalization/difficulty/:userId` - Adjust difficulty

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- Docker (optional)

### Installation

1. **Clone the repository**
   ```bash
   cd services/learning-path
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp ../../env.example .env
   ```

4. **Configure database**
   ```bash
   # Set up PostgreSQL connection
   export POSTGRES_HOST=localhost
   export POSTGRES_PORT=5432
   export POSTGRES_DB=pageflow
   export POSTGRES_USER=postgres
   export POSTGRES_PASSWORD=postgres
   ```

5. **Build the service**
   ```bash
   npm run build
   ```

6. **Start the service**
   ```bash
   npm start
   ```

### Docker

```bash
# Build the image
docker build -t pageflow-learning-path .

# Run the container
docker run -p 3006:3006 \
  -e POSTGRES_HOST=host.docker.internal \
  -e POSTGRES_PORT=5432 \
  -e POSTGRES_DB=pageflow \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  pageflow-learning-path
```

## Development

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Linting
```bash
# Run linter
npm run lint

# Fix linting issues
npm run lint:fix
```

### Development Mode
```bash
# Start in development mode with hot reload
npm run dev
```

## Architecture

### Services
- **LearningPathService**: Core business logic for learning path management
- **RecommendationService**: Content and learning path recommendations
- **PersonalizationService**: Learning style detection and adaptive learning

### Repositories
- **LearningPathRepository**: Database operations for learning paths
- **UserProgressRepository**: User progress tracking and analytics

### Controllers
- **LearningPathController**: HTTP endpoints for learning path operations
- **RecommendationController**: Recommendation API endpoints
- **PersonalizationController**: Personalization API endpoints

## Database Schema

### learning_paths
```sql
CREATE TABLE learning_paths (
  id VARCHAR(255) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  difficulty VARCHAR(50),
  estimated_duration INTEGER,
  modules JSONB,
  learning_objectives JSONB,
  prerequisites JSONB,
  tags JSONB,
  is_public BOOLEAN DEFAULT true,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### user_learning_progress
```sql
CREATE TABLE user_learning_progress (
  learning_path_id VARCHAR(255),
  user_id VARCHAR(255),
  progress_data JSONB,
  completed_modules JSONB,
  current_module VARCHAR(255),
  score INTEGER DEFAULT 0,
  time_spent INTEGER DEFAULT 0,
  last_accessed TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (learning_path_id, user_id)
);
```

## Configuration

### Environment Variables
- `PORT`: Service port (default: 3006)
- `NODE_ENV`: Environment (development, production, test)
- `POSTGRES_HOST`: PostgreSQL host
- `POSTGRES_PORT`: PostgreSQL port
- `POSTGRES_DB`: PostgreSQL database name
- `POSTGRES_USER`: PostgreSQL username
- `POSTGRES_PASSWORD`: PostgreSQL password

### Logging
The service uses structured logging with the following levels:
- `error`: Error conditions
- `warn`: Warning conditions
- `info`: General information
- `debug`: Detailed debugging information

## Monitoring

### Health Check
```bash
curl http://localhost:3006/health
```

### Metrics
- Request count and response times
- Database query performance
- Error rates and types
- Learning path creation and usage statistics

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License. 