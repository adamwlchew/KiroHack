import { config } from 'dotenv';

// Load environment variables
config();

export interface ProgressServiceConfig {
  port: number;
  nodeEnv: string;
  aws: {
    region: string;
    dynamoDbTableName: string;
    endpoint?: string; // For local development
  };
  cors: {
    origin: string[];
    credentials: boolean;
  };
  rateLimit: {
    windowMs: number;
    max: number;
  };
  logging: {
    level: string;
  };
}

export const progressServiceConfig: ProgressServiceConfig = {
  port: parseInt(process.env.PORT || '3003', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    dynamoDbTableName: process.env.DYNAMODB_TABLE_NAME || 'pageflow-progress-dev',
    endpoint: process.env.DYNAMODB_ENDPOINT // For local development
  },
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10) // limit each IP to 100 requests per windowMs
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  }
};

export default progressServiceConfig;