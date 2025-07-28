# Bedrock Integration Service

The Bedrock Integration Service provides centralized access to AWS Bedrock AI models for the PageFlow platform. It handles text generation, image generation, embeddings, and content moderation across multiple AI models with built-in fallback strategies, cost monitoring, and caching.

## Features

- **Multi-Model Support**: Claude, Titan, Stable Diffusion, and Cohere models
- **Fallback Strategies**: Automatic fallback to alternative models on failure
- **Cost Management**: Daily and monthly spending limits with warnings
- **Response Caching**: Configurable caching for improved performance
- **Retry Logic**: Exponential backoff retry policies
- **Comprehensive Logging**: Detailed logging with correlation IDs

## Configuration

The service is configured through environment variables. See `.env.example` for all available options.

### Key Configuration Areas

#### Model Configuration
- **Claude**: Primary conversational AI and content generation
- **Titan**: Text processing and embeddings
- **Stable Diffusion**: Image generation for learning content
- **Cohere**: Content summarization and classification

#### Cost Management
```env
BEDROCK_DAILY_LIMIT=100        # Daily spending limit in USD
BEDROCK_MONTHLY_LIMIT=2000     # Monthly spending limit in USD
BEDROCK_WARNING_THRESHOLD=80   # Warning threshold percentage
```

#### Caching
```env
BEDROCK_CACHE_ENABLED=true     # Enable response caching
BEDROCK_CACHE_TTL=3600         # Cache TTL in seconds
BEDROCK_CACHE_MAX_SIZE=1000    # Maximum cache entries
```

#### Retry Policy
```env
BEDROCK_MAX_RETRIES=3          # Maximum retry attempts
BEDROCK_BASE_DELAY=1000        # Base delay in milliseconds
BEDROCK_MAX_DELAY=10000        # Maximum delay in milliseconds
```

## API Endpoints

### Text Generation
- `POST /api/text/generate` - Generate text using Claude or Titan
- `POST /api/text/summarize` - Summarize content using Cohere

### Image Generation
- `POST /api/image/generate` - Generate images using Stable Diffusion

### Embeddings
- `POST /api/embeddings/generate` - Generate text embeddings using Titan

### Content Moderation
- `POST /api/moderation/check` - Check content for safety

## Usage Examples

### Text Generation
```typescript
const response = await fetch('/api/text/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'Explain quantum physics for beginners',
    model: 'claude',
    maxTokens: 1000,
    temperature: 0.7
  })
});
```

### Image Generation
```typescript
const response = await fetch('/api/image/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'A friendly robot teaching mathematics',
    width: 1024,
    height: 1024,
    steps: 30
  })
});
```

## Development

### Setup
```bash
npm install
cp .env.example .env
# Configure your environment variables
npm run dev
```

### Testing
```bash
npm test                # Run all tests
npm run test:unit       # Run unit tests only
npm run test:integration # Run integration tests only
```

### Building
```bash
npm run build          # Build for production
npm start              # Start production server
```

## Architecture

The service follows a layered architecture:

- **Controllers**: Handle HTTP requests and responses
- **Services**: Implement business logic and AI model interactions
- **Clients**: Manage AWS Bedrock SDK interactions
- **Config**: Centralized configuration management
- **Middleware**: Error handling and request processing

## Error Handling

The service implements comprehensive error handling:

- **Model Failures**: Automatic fallback to alternative models
- **Rate Limits**: Exponential backoff retry logic
- **Cost Limits**: Spending limit enforcement
- **Validation**: Request and configuration validation

## Monitoring

The service provides detailed monitoring through:

- **Cost Tracking**: Real-time cost monitoring and alerts
- **Performance Metrics**: Response times and cache hit rates
- **Error Tracking**: Detailed error logging with correlation IDs
- **Health Checks**: Service health and dependency status

## Security

- **Input Validation**: All inputs are validated and sanitized
- **Content Moderation**: AI-generated content is automatically moderated
- **Access Control**: Integration with PageFlow authentication system
- **Audit Logging**: All AI interactions are logged for audit purposes

## Deployment

The service is deployed as a containerized microservice on AWS ECS with:

- **Auto Scaling**: Based on CPU and memory utilization
- **Load Balancing**: Application Load Balancer for high availability
- **Health Checks**: Automated health monitoring
- **Blue/Green Deployment**: Zero-downtime deployments