FROM node:20-alpine AS base

RUN apk update && apk upgrade

WORKDIR /app

RUN corepack enable

COPY package*.json yarn.lock* ./

# Development stage
FROM base AS development

ENV NODE_ENV development
# Install all dependencies including dev dependencies
RUN yarn install --frozen-lockfile

COPY . .

EXPOSE 3000

# Start the application in development mode
CMD ["yarn", "dev"]

# Build stage
FROM base AS build

# Install all dependencies including dev dependencies for building
RUN yarn install --frozen-lockfile

COPY . .

RUN yarn build

# Production stage
FROM base AS production

ENV NODE_ENV production
# Install only production dependencies
RUN yarn install --frozen-lockfile --production

# Copy built assets from build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3000

CMD ["yarn", "start"]