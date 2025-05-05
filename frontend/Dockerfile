FROM node:23-slim

# Install pnpm
RUN npm install -g pnpm

# Set the working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./

RUN pnpm install

# Copy the entire codebase
COPY . .

# Expose the port (if necessary, depending on your backend's setup)
EXPOSE 5000

# Start the application
CMD ["pnpm", "run", "start"]
