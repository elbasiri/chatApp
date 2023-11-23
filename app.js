// app.js
import cors from 'cors';
import express from 'express';
import { createServer } from 'http';
import socketIo from 'socket.io';
import { connect, connection, Schema, model } from 'mongoose';

const app = express();
const server = createServer(app);
const io = socketIo(server);
app.use(cors());

// Use a fallback connection string for local development
const localMongoURI = 'mongodb+srv://elbasiriothman:othmanelbasiri@cluster0.vz3oynv.mongodb.net/?retryWrites=true&w=majority';

// Connect to MongoDB
connect(process.env.MONGODB_URI || localMongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

const db = connection;

db.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

const messageSchema = new Schema({
  senderId: String,
  username: String,
  text: String,
});


const Message = model('Message', messageSchema);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Set up Socket.IO
io.on('connection', (socket) => {
  console.log('a user connected');

  // Send stored messages when a user connects
  Message.find({})
    .exec()
    .then((messages) => {
      io.emit('chat history', messages);
    })
    .catch((err) => {
      console.error('Error fetching chat history:', err);
    });


// Update the 'chat message' event handling in your server
socket.on('chat message', (data) => {
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
});

  // Disconnect event
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

const port = process.env.PORT || 443;

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
