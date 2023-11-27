import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import authRoutes from './auth.js';
import { WebSocketServer } from 'ws';

const app = express();
app.use(cors());

// Connect to MongoDB Atlas
mongoose.connect('mongodb+srv://elbasiriothman:othmanelbasiri@cluster0.vz3oynv.mongodb.net/?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define a Mongoose schema for chat messages
const messageSchema = new mongoose.Schema({
  username: String,
  text: String,
  timestamp: Date,
});

// Create a Mongoose model from the schema
const Message = mongoose.model('Message', messageSchema);

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

// Set up WebSocket server
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
    // Send the last 10 messages to the client
    Message.find().sort('-timestamp').limit(20).then((messages) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify(messages));
      }
    });
  
    ws.on('message', (message) => {
      // Parse the message and store it in the database
      const { username, text } = JSON.parse(message);
      const newMessage = new Message({ username, text, timestamp: new Date() });
      newMessage.save();
  
      // Broadcast the message to all clients
      wss.clients.forEach((client) => {
        if (client.readyState === ws.OPEN) {
          client.send(message);
        }
      });
    });
  
    ws.on('close', () => {
      console.log('Connection closed');
    });
  });
  
  