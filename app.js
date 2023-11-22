// app.js

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Use a fallback connection string for local development
const localMongoURI = 'mongodb+srv://elbasiriothman:othmanelbasiri@cluster0.vz3oynv.mongodb.net/?retryWrites=true&w=majority';

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || localMongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;

db.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

const messageSchema = new mongoose.Schema({
  senderId: String,
  username: String,
  text: String,
});


const Message = mongoose.model('Message', messageSchema);

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

const port = process.env.PORT || 3000;

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
