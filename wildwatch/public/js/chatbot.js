document.addEventListener('DOMContentLoaded', function() {
  const input = document.getElementById('chatInput');
  const messages = document.getElementById('chatMessages');
  const sendBtn = document.getElementById('sendBtn');
  const clearChatBtn = document.getElementById('clearChatBtn');

  // Client-side history for stateless serverless backend
  const chatHistory = [];

  function getTime() {
    return new Date().toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
  }

  function addMessage(text, role) {
    const div = document.createElement('div');
    div.className = `chat-message ${role === 'user' ? 'user-message' : 'bot-message'}`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = role === 'user' ? '<i class="fa-solid fa-user"></i>' : '<i class="fa-solid fa-robot"></i>';

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';

    const formatted = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');

    bubble.innerHTML = `<p>${formatted}</p><span class="message-time">${getTime()}</span>`;

    if (role === 'user') {
      div.appendChild(bubble);
      div.appendChild(avatar);
    } else {
      div.appendChild(avatar);
      div.appendChild(bubble);
    }

    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function showTyping() {
    document.getElementById('typingIndicator').style.display = 'flex';
    messages.scrollTop = messages.scrollHeight;
  }

  function hideTyping() {
    document.getElementById('typingIndicator').style.display = 'none';
  }

  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    input.style.height = 'auto';
    addMessage(text, 'user');
    showTyping();
    sendBtn.disabled = true;

    try {
      const res = await fetch('/chatbot/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: chatHistory })
      });
      const data = await res.json();
      hideTyping();
      sendBtn.disabled = false;

      if (data.success) {
        chatHistory.push({ role: 'user', parts: [{ text }] });
        chatHistory.push({ role: 'model', parts: [{ text: data.reply }] });
        if (chatHistory.length > 20) chatHistory.splice(0, 2);
        addMessage(data.reply, 'bot');
      } else {
        addMessage('Sorry, I encountered an error. Please try again.', 'bot');
      }
    } catch (err) {
      hideTyping();
      sendBtn.disabled = false;
      addMessage('Connection error. Please check your internet connection.', 'bot');
    }
  }

  // Send button
  sendBtn.addEventListener('click', sendMessage);

  // Enter key (Shift+Enter for newline)
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Auto-resize textarea
  input.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 150) + 'px';
  });

  // Suggestion buttons
  document.querySelectorAll('.suggestion-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      input.value = btn.textContent;
      sendMessage();
    });
  });

  // Clear chat
  if (clearChatBtn) {
    clearChatBtn.addEventListener('click', function() {
      chatHistory.length = 0;
      messages.innerHTML = `<div class="chat-message bot-message">
        <div class="message-avatar"><i class="fa-solid fa-robot"></i></div>
        <div class="message-bubble">
          <p>Chat cleared! How can I help you with campus animal safety?</p>
          <span class="message-time">${getTime()}</span>
        </div>
      </div>`;
    });
  }
});
