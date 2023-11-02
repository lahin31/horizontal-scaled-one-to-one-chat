# Use an official Node.js runtime as a parent image
FROM node:16.19.0

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install application dependencies
RUN npm install

# Bundle app source
COPY . .

# Expose the port on which your WebSocket server runs
EXPOSE 3000

# Define the command to start your WebSocket server
CMD [ "node", "app.js" ]
