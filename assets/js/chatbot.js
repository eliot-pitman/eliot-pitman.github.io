// Chatbot Widget
document.addEventListener('DOMContentLoaded', function() {
  const chatToggle = document.getElementById('chat-toggle');
  const chatContainer = document.getElementById('chat-container');
  const closeChat = document.getElementById('close-chat');
  const sendBtn = document.getElementById('send-btn');
  const chatInput = document.getElementById('chat-input');
  const chatMessages = document.getElementById('chat-messages');

  const API_URL = 'https://zu8schqs01.execute-api.us-east-1.amazonaws.com/api/chat';

  // Toggle chat window
  chatToggle.addEventListener('click', function() {
    if (chatContainer.style.display === 'none') {
      chatContainer.style.display = 'flex';
      chatInput.focus();
    } else {
      chatContainer.style.display = 'none';
    }
  });

  // Close chat window
  closeChat.addEventListener('click', function() {
    chatContainer.style.display = 'none';
  });

  // Send message function
  function sendMessage() {
    const message = chatInput.value.trim();
    if (message === '') return;

    // Add user message to chat
    addMessageToChat(message, 'user');
    chatInput.value = '';

    // Send API request
    fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: message })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      // Add bot response to chat
      const botMessage = data.message || data.body || JSON.stringify(data);
      addMessageToChat(botMessage, 'bot');
    })
    .catch(error => {
      console.error('Error:', error);
      addMessageToChat('Sorry, there was an error processing your message.', 'bot');
    });
  }

  // Add message to chat display
  function addMessageToChat(message, sender) {
    const messageEl = document.createElement('div');
    messageEl.className = `chat-message ${sender}-message`;
    messageEl.textContent = message;
    chatMessages.appendChild(messageEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // Send on button click
  sendBtn.addEventListener('click', sendMessage);

  // Send on Enter key
  chatInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });
});
