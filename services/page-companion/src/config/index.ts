import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server configuration
  port: parseInt(process.env.PORT || '3006', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database configuration
  dynamodb: {
    region: process.env.AWS_REGION || 'us-east-1',
    endpoint: process.env.DYNAMODB_ENDPOINT,
    tableName: process.env.DYNAMODB_TABLE_NAME || 'pageflow-companions'
  },
  
  // AWS configuration
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  },
  
  // Bedrock integration
  bedrock: {
    serviceUrl: process.env.BEDROCK_SERVICE_URL || 'http://localhost:3005',
    apiKey: process.env.BEDROCK_API_KEY
  },
  
  // Companion configuration
  companion: {
    maxInteractionHistory: parseInt(process.env.MAX_INTERACTION_HISTORY || '1000', 10),
    maxKnowledgeItems: parseInt(process.env.MAX_KNOWLEDGE_ITEMS || '500', 10),
    emotionalDecayRate: parseFloat(process.env.EMOTIONAL_DECAY_RATE || '0.5'),
    defaultPersonality: (process.env.DEFAULT_PERSONALITY || 'FRIENDLY,ENCOURAGING').split(','),
    knowledgeConfidenceThreshold: parseInt(process.env.KNOWLEDGE_CONFIDENCE_THRESHOLD || '30', 10)
  },
  
  // Security configuration
  security: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10)
  },
  
  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json'
  }
};

export default config;