import React, { useEffect, useState } from 'react';

function Chat() {
  const [ws, setWs] = useState(null);
  const [Messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const email = localStorage.getItem('email');
  const sender = email.split("@")[0];

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:5000/');
    ws.onopen = () => console.log('WebSocket is open now.');
    ws.onclose = () => console.log('WebSocket is closed now.');
    ws.onerror = (error) => console.log('WebSocket error: ', error);
    setWs(ws);
    return () => {
        if (ws.readyState === 1) { // <-- This is important
            ws.close();
        }
    };
  }, []);


  useEffect(() => { 
    if (!ws) return;
    setMessages([])
    ws.onmessage = (event) => {
      if (typeof event.data === 'string') {
          try {
            const data = JSON.parse(event.data);
            setMessages((prevMessages) => [...prevMessages, data]);
          } catch (error) {
            console.error('Error parsing string data:', error);
          }
        } else if (event.data instanceof Blob) {
          const reader = new FileReader();
          reader.onload = function() {
            try {
              const data = JSON.parse(this.result);
              setMessages((prevMessages) => [...prevMessages, data]);
            } catch (error) {
              console.error('Error parsing Blob data:', error);
            }
          }
          reader.readAsText(event.data);
        } else {
          console.error('Received unknown data type:', event.data);
        }
  };
  

  }, [ws]); 

  const sendMessage = (event) => { 
    event.preventDefault();
    if (!ws || ws.readyState !== ws.OPEN) return;
    const message = { username: sender, text: newMessage };
  
    ws.send(JSON.stringify(message));
    
    // Update the Messages state with the new message
    setMessages((prevMessages) => [[message, ...prevMessages[0]]]);
  
    setNewMessage('');
  };    
   
  
      

  return (
<div className='chat'>
<ul>
  {Messages && Messages[0] && Messages[0].slice().reverse().map((message, index) => (
    <li key={index}>
      <strong>{message.username}:</strong> {message.text}
    </li>
  ))}
</ul>
  <form onSubmit={sendMessage}>
    <input
      required
      type="text"
      value={newMessage}
      onChange={(event) => setNewMessage(event.target.value)}
    />
    <button type="submit">Send</button>
  </form>
</div>

  
  );
}

export default Chat;
