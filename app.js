import cors from 'cors';
import express from 'express';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Server } from 'socket.io';
import connection from 'mongoose';
import { connect, Schema, model } from 'mongoose';

const app = express();
const server = createServer(app);
const io = new Server(server);
app.use(cors());

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Use a fallback connection string for local development
const localMongoURI = 'mongodb+srv://elbasiriothman:othmanelbasiri@cluster0.vz3oynv.mongodb.net/?retryWrites=true&w=majority';

// Connect to MongoDB
connect(process.env.MONGODB_URI || localMongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

const db = connection;

const messageSchema = new Schema({
  senderId: String,
  username: String,
  text: String,
});

const Message = model('Message', messageSchema);

app.use(express.static(__dirname));

// Send stored messages when a user connects
const sendChatHistory = async () => {
  try {
    const messages = await Message.find({}).exec();
    io.emit('chat history', messages);
  } catch (err) {
    console.error('Error fetching chat history:', err);
  }
};

io.on('connection', (socket) => {
  console.log('a user connected');

  // Send stored messages when a user connects
  sendChatHistory();

  // Handle 'chat message' event
  const handleChatMessage = (data) => {
    // Save the message to the database
    const message = new Message({ senderId: data.senderId, username: data.username, text: data.text });
    message.save()
      .then(() => {
        console.log('Message saved to the database');
      })
      .catch((err) => {
        console.error('Error saving message to the database:', err);
      });

    // Emit the message along with sender's username and id to all connected clients
    io.emit('chat message', { senderId: data.senderId, username: data.username, text: data.text });
  };

  // Handle 'disconnect' event
  const handleDisconnect = () => {
    console.log('user disconnected');
  };

  // Event listeners
  socket.on('chat message', handleChatMessage);
  socket.on('disconnect', handleDisconnect);
});

// Handle unhandled promise rejections globally
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const port = process.env.PORT || 443;

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
