# Use Bun official image
FROM jarredsumner/bun:latest

# Set working directory
WORKDIR /app

# Copy package.json and bun.lockb first (for caching deps)
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install

# Copy the rest of the code
COPY . .

# Expose the port your server listens on
EXPOSE 8080

# Start the server
CMD ["bun", "run", "start"]