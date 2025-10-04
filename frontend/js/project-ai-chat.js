// Project AI Chat Assistant - Advanced, Responsive, Voice Ready
(function(){
  if (window.ProjectAIChatLoaded) return; window.ProjectAIChatLoaded = true;
  const btn = document.createElement('div');
  btn.id = 'projectAIChatBtn';
  btn.className = 'project-ai-chat-btn';
  btn.title = 'Project AI - Your Assistant';
  btn.innerHTML = '<i class="fas fa-robot"></i>';
  document.body.appendChild(btn);

  const popup = document.createElement('div');
  popup.id = 'projectAIChatPopup';
  popup.className = 'project-ai-chat-popup';
  popup.innerHTML = `
    <div class="chat-header">
      <span class="chat-title"><i class="fas fa-robot"></i> Project AI</span>
      <span style="display:flex;align-items:center;gap:2px;">
        <button class="chat-min" id="minProjectAIChat" title="Minimize">&#8211;</button>
        <button class="chat-close" id="closeProjectAIChat">&times;</button>
      </span>
    </div>
    <div class="chat-messages" id="projectAIChatMessages">
      <div class="chat-message ai">
        <div class="chat-bubble">Hi! I am <b>Project AI</b>.<br>How can I help you with your school projects?</div>
      </div>
    </div>
    <form class="chat-input-row" id="projectAIChatForm" autocomplete="off">
      <button type="button" class="voice-btn" id="projectAIChatVoice" title="Voice Input"><i class="fas fa-microphone"></i></button>
      <input type="text" id="projectAIChatInput" placeholder="Type or speak..." required />
      <button type="submit"><i class="fas fa-paper-plane"></i></button>
    </form>
  `;
  document.body.appendChild(popup);

  const chatBtn = btn;
  const chatPopup = popup;
  const chatClose = document.getElementById('closeProjectAIChat');
  const chatMin = document.getElementById('minProjectAIChat');
  const chatForm = document.getElementById('projectAIChatForm');
  const chatInput = document.getElementById('projectAIChatInput');
  const chatMessages = document.getElementById('projectAIChatMessages');
  const chatVoice = document.getElementById('projectAIChatVoice');

  let minimized = false;
  chatBtn.onclick = () => { chatPopup.classList.add('show'); chatInput.focus(); minimized = false; };
  chatClose.onclick = () => chatPopup.classList.remove('show');
  chatMin.onclick = () => { chatPopup.classList.remove('show'); minimized = true; };
  window.addEventListener('keydown', e => { if (e.key === 'Escape') chatPopup.classList.remove('show'); });

  chatForm.onsubmit = e => {
    e.preventDefault();
    const msg = chatInput.value.trim();
    if (!msg) return;
    chatMessages.innerHTML += `<div class='chat-message user'><div class='chat-bubble'>${msg}</div></div>`;
    chatInput.value = '';
    chatMessages.scrollTop = chatMessages.scrollHeight;
    // Placeholder for API integration
    setTimeout(() => {
      chatMessages.innerHTML += `<div class='chat-message ai'><div class='chat-bubble'>[Project AI will reply here]</div></div>`;
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 800);
  };

  // Voice input (SpeechRecognition)
  let recognizing = false;
  let recognition;
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    chatVoice.style.display = '';
    chatVoice.onclick = function() {
      if (recognizing) {
        recognition.stop();
        chatVoice.classList.remove('active');
        recognizing = false;
        return;
      }
      recognition.start();
      chatVoice.classList.add('active');
      recognizing = true;
    };
    recognition.onresult = function(event) {
      const transcript = event.results[0][0].transcript;
      chatInput.value = transcript;
      chatInput.focus();
      chatVoice.classList.remove('active');
      recognizing = false;
    };
    recognition.onerror = function() {
      chatVoice.classList.remove('active');
      recognizing = false;
    };
    recognition.onend = function() {
      chatVoice.classList.remove('active');
      recognizing = false;
    };
  } else {
    chatVoice.style.display = 'none';
  }

  // Auto-scroll on new message
  const observer = new MutationObserver(() => {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });
  observer.observe(chatMessages, { childList: true });
})();
