// WebSocket server using Node.js and the ws library
const WebSocket = require('ws');
const express = require('express');
const http = require('http');
const Redis = require('ioredis');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Redis Pub-Sub
const redisPublisher = new Redis();

// Store WebSocket connections associated with users
const userWebSocketMap = new Map();

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      const { recipient, text } = data;

      // Store the WebSocket connection for the sender
      userWebSocketMap.set(recipient, ws);

      // Publish the message to Redis with recipient information
      redisPublisher.publish(`chat:${recipient}`, JSON.stringify({ sender, text }));
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  ws.on('close', () => {
    // Remove the WebSocket connection from the userWebSocketMap
    // Clean up when the WebSocket connection is closed
    for (const [user, userWs] of userWebSocketMap.entries()) {
      if (userWs === ws) {
        userWebSocketMap.delete(user);
        break;
      }
    }
  });
});

// Redis Pub-Sub subscription for each user
wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    const data = JSON.parse(message);
    const { user } = data;

    const redisSubscription = new Redis();
    redisSubscription.subscribe(`chat:${user}`);
    redisSubscription.on('message', (channel, message) => {
      ws.send(message);
    });

    ws.on('close', () => {
      // Clean up when the WebSocket connection is closed
      redisSubscription.unsubscribe(`chat:${user}`);
      redisSubscription.quit();
    });
  });
});

// Handle other routes and static files here

server.listen(3000, () => {
  console.log('WebSocket server is running on port 3000');
});
