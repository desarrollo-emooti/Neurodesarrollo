FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci

# Copy backend application files
COPY backend/ ./

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript to JavaScript
RUN npm run build

# Remove devDependencies to reduce image size
RUN npm prune --production

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
