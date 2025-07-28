import { logger } from '@pageflow/utils';

export interface BedrockConfig {
  region: string;
  models: {
    claude: {
      modelId: string;
      fallbackModelId?: string;
      maxTokens: number;
      temperature: number;
      topP: number;
      topK: number;
    };
    titan: {
      modelId: string;
      fallbackModelId?: string;
      maxTokens: number;
      temperature: number;
      topP: number;
    };
    stableDiffusion: {
      modelId: string;
      fallbackModelId?: string;
      width: number;
      height: number;
      cfgScale: number;
      steps: number;
    };
    cohere: {
      modelId: string;
      fallbackModelId?: string;
      maxTokens: number;
      temperature: number;
      p: number;
      k: number;
    };
  };
  costLimits: {
    dailyLimit: number; // in USD
    monthlyLimit: number; // in USD
    warningThreshold: number; // percentage of limit
  };
  caching: {
    enabled: boolean;
    ttl: number; // in seconds
    maxSize: number; // max cache entries
  };
  retryPolicy: {
    maxRetries: number;
    baseDelay: number; // in milliseconds
    maxDelay: number; // in milliseconds
  };
}

const config: BedrockConfig = {
  region: process.env.AWS_REGION || 'ap-southeast-2',
  models: {
    claude: {
      modelId: process.env.CLAUDE_MODEL_ID || 'anthropic.claude-3-sonnet-20240229-v1:0',
      fallbackModelId: process.env.CLAUDE_FALLBACK_MODEL_ID || 'anthropic.claude-3-haiku-20240307-v1:0',
      maxTokens: parseInt(process.env.CLAUDE_MAX_TOKENS || '4000'),
      temperature: parseFloat(process.env.CLAUDE_TEMPERATURE || '0.7'),
      topP: parseFloat(process.env.CLAUDE_TOP_P || '1'),
      topK: parseInt(process.env.CLAUDE_TOP_K || '250'),
    },
    titan: {
      modelId: process.env.TITAN_MODEL_ID || 'amazon.titan-text-express-v1',
      fallbackModelId: process.env.TITAN_FALLBACK_MODEL_ID || 'amazon.titan-text-lite-v1',
      maxTokens: parseInt(process.env.TITAN_MAX_TOKENS || '3000'),
      temperature: parseFloat(process.env.TITAN_TEMPERATURE || '0.7'),
      topP: parseFloat(process.env.TITAN_TOP_P || '1'),
    },
    stableDiffusion: {
      modelId: process.env.STABLE_DIFFUSION_MODEL_ID || 'stability.stable-diffusion-xl-v1',
      fallbackModelId: process.env.STABLE_DIFFUSION_FALLBACK_MODEL_ID,
      width: parseInt(process.env.STABLE_DIFFUSION_WIDTH || '1024'),
      height: parseInt(process.env.STABLE_DIFFUSION_HEIGHT || '1024'),
      cfgScale: parseFloat(process.env.STABLE_DIFFUSION_CFG_SCALE || '7'),
      steps: parseInt(process.env.STABLE_DIFFUSION_STEPS || '30'),
    },
    cohere: {
      modelId: process.env.COHERE_MODEL_ID || 'cohere.command-text-v14',
      fallbackModelId: process.env.COHERE_FALLBACK_MODEL_ID || 'cohere.command-light-text-v14',
      maxTokens: parseInt(process.env.COHERE_MAX_TOKENS || '2000'),
      temperature: parseFloat(process.env.COHERE_TEMPERATURE || '0.7'),
      p: parseFloat(process.env.COHERE_P || '0.75'),
      k: parseInt(process.env.COHERE_K || '0'),
    },
  },
  costLimits: {
    dailyLimit: parseFloat(process.env.BEDROCK_DAILY_LIMIT || '100'),
    monthlyLimit: parseFloat(process.env.BEDROCK_MONTHLY_LIMIT || '2000'),
    warningThreshold: parseFloat(process.env.BEDROCK_WARNING_THRESHOLD || '80'),
  },
  caching: {
    enabled: process.env.BEDROCK_CACHE_ENABLED !== 'false',
    ttl: parseInt(process.env.BEDROCK_CACHE_TTL || '3600'),
    maxSize: parseInt(process.env.BEDROCK_CACHE_MAX_SIZE || '1000'),
  },
  retryPolicy: {
    maxRetries: parseInt(process.env.BEDROCK_MAX_RETRIES || '3'),
    baseDelay: parseInt(process.env.BEDROCK_BASE_DELAY || '1000'),
    maxDelay: parseInt(process.env.BEDROCK_MAX_DELAY || '10000'),
  },
};

// Validate configuration
function validateConfig(config: BedrockConfig): void {
  const errors: string[] = [];

  if (!config.region) {
    errors.push('AWS region is required');
  }

  if (config.costLimits.dailyLimit <= 0) {
    errors.push('Daily cost limit must be positive');
  }

  if (config.costLimits.monthlyLimit <= 0) {
    errors.push('Monthly cost limit must be positive');
  }

  if (config.costLimits.warningThreshold < 0 || config.costLimits.warningThreshold > 100) {
    errors.push('Warning threshold must be between 0 and 100');
  }

  if (errors.length > 0) {
    logger.error({ message: 'Bedrock configuration validation failed', errors });
    throw new Error(`Configuration validation failed: ${errors.join(', ')}`);
  }
}

validateConfig(config);

export { config };