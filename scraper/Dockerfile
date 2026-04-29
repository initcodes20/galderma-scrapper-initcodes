# Use the official Playwright image which includes all browser dependencies
FROM mcr.microsoft.com/playwright:v1.58.2-jammy

# Set the working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port your app runs on
EXPOSE 5001

# Start the server
CMD ["npm", "start"]
