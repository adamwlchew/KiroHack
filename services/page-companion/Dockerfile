# Use Node.js 18 Alpine as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/types/package*.json ./packages/types/
COPY packages/utils/package*.json ./packages/utils/
COPY services/page-companion/package*.json ./services/page-companion/

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY packages/types ./packages/types
COPY packages/utils ./packages/utils
COPY services/page-companion ./services/page-companion

# Build packages
RUN npm run build --workspace=@pageflow/types
RUN npm run build --workspace=@pageflow/utils
RUN npm run build --workspace=@pageflow/page-companion-service

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3005

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3005/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["npm", "start", "--workspace=@pageflow/page-companion-service"] 