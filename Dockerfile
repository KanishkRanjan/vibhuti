FROM node:20-alpine

WORKDIR /app

# Copy the package.json and package-lock.json
COPY package*.json ./

# Install all dependencies (development and production)
# Dev dependencies are needed because drizzle-kit push and build scripts require them
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the client and server properly
RUN npm run build

# Expose the default listening port for the Express application
EXPOSE 5000

# Set environment to production by default
ENV NODE_ENV=production

# The start-up command runs pending database schema pushes, then starts our server
CMD ["sh", "-c", "npm run db:push && npm start"]
