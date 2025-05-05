FROM node:23-slim

# Set the working directory
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy package files and install dependencies
COPY package*.json ./

RUN pnpm install

# Copy the entire codebase
COPY . .

# Expose the port (optional: if your app runs on a specific port)
EXPOSE 3000

# Start the app (adjust as needed)
CMD ["pnpm", "start"]
