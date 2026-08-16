document.addEventListener('DOMContentLoaded', function () {
  const bubble = document.querySelector('.chat-widget-bubble');
  const modal = document.querySelector('.chat-widget-modal');
  const closeBtn = document.querySelector('.chat-widget-close');
  const inputField = document.querySelector('.chat-widget-input input');
  const sendBtn = document.querySelector('.chat-widget-input button');
  const messagesArea = document.querySelector('.chat-widget-messages');

  if (!bubble || !modal || !inputField || !sendBtn || !messagesArea) {
    return;
  }

  let isFirstOpen = true;
  const conversationMessages = [];

  function addMessage(text, sender) {
    const div = document.createElement('div');
    div.className = 'chat-widget-message ' + sender;
    div.textContent = text;
    messagesArea.appendChild(div);
    messagesArea.scrollTop = messagesArea.scrollHeight;
  }

  function openChat() {
    modal.classList.add('open');
    if (isFirstOpen) {
      isFirstOpen = false;
      setTimeout(function () {
        addMessage('Xin chào! 👋 Tôi là trợ lý AI của MindX Cinema. Bạn cần hỗ trợ gì?', 'bot');
      }, 250);
    }
  }

  function closeChat() {
    modal.classList.remove('open');
  }

  bubble.addEventListener('click', function () {
    if (modal.classList.contains('open')) {
      closeChat();
    } else {
      openChat();
      inputField.focus();
    }
  });

  closeBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    closeChat();
  });

  document.addEventListener('click', function (e) {
    if (modal.classList.contains('open') && !modal.contains(e.target) && !bubble.contains(e.target)) {
      closeChat();
    }
  });

  async function sendMessage() {
    const message = inputField.value.trim();
    if (!message) return;

    addMessage(message, 'user');
    inputField.value = '';
    addMessage('Đang trả lời...', 'bot');

    conversationMessages.push({ role: 'user', content: message });

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: conversationMessages })
      });

      const result = await response.json();
      const botMessages = messagesArea.querySelectorAll('.chat-widget-message.bot');
      const lastBotMessage = botMessages[botMessages.length - 1];

      if (!response.ok || !result.success) {
        if (lastBotMessage) {
          lastBotMessage.textContent = 'Xin lỗi, tôi chưa thể kết nối Chatbase. Vui lòng kiểm tra lại key trong file .env.';
        }
        return;
      }

      const botText = result.data?.text || 'Xin lỗi, tôi chưa có câu trả lời.';
      if (lastBotMessage) {
        lastBotMessage.textContent = botText;
      }
      conversationMessages.push({ role: 'assistant', content: botText });
    } catch (error) {
      const botMessages = messagesArea.querySelectorAll('.chat-widget-message.bot');
      const lastBotMessage = botMessages[botMessages.length - 1];
      if (lastBotMessage) {
        lastBotMessage.textContent = 'Lỗi kết nối tới server.';
      }
    }
  }

  sendBtn.addEventListener('click', sendMessage);
  inputField.addEventListener('keypress', function (event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  });
});
