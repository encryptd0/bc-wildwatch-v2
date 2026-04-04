document.addEventListener('DOMContentLoaded', function() {
  const input = document.getElementById('chatInput');
  const messages = document.getElementById('chatMessages');

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

    // Convert newlines and basic markdown to HTML
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

  window.sendMessage = async function() {
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    input.style.height = 'auto';
    addMessage(text, 'user');
    showTyping();

    document.getElementById('sendBtn').disabled = true;

    try {
      const res = await fetch('/chatbot/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      const data = await res.json();
      hideTyping();
      document.getElementById('sendBtn').disabled = false;

      if (data.success) {
        addMessage(data.reply, 'bot');
      } else {
        addMessage('Sorry, I encountered an error. Please try again.', 'bot');
      }
    } catch (err) {
      hideTyping();
      document.getElementById('sendBtn').disabled = false;
      addMessage('Connection error. Please check your internet connection.', 'bot');
    }
  };

  window.sendSuggestion = function(btn) {
    input.value = btn.textContent;
    sendMessage();
  };

  window.clearChat = function() {
    messages.innerHTML = `<div class="chat-message bot-message">
      <div class="message-avatar"><i class="fa-solid fa-robot"></i></div>
      <div class="message-bubble">
        <p>Chat cleared! How can I help you with campus animal safety?</p>
        <span class="message-time">${getTime()}</span>
      </div>
    </div>`;
  };

  window.handleKeyDown = function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  window.autoResize = function(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 150) + 'px';
  };
});
