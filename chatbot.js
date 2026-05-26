/**
 * VIKASH PORTFOLIO — AI CHATBOT (ULTIMATE UPGRADE EDITION)
 */

(function () {
  'use strict';

  const DEFAULT_MODEL = 'grok-beta';
  const API_URL = '/api/chat';
  const PRODUCTION_API_URL = 'https://portfolio-information.vercel.app';
  const LOCAL_API_BASE = 'http://localhost:3000';
  const MAX_USER_CHARS = 800;
  const CONTROL_CHAR_REGEX = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;
  const STORAGE_KEYS = {
    version: 'vikash_chat_version',
    history: 'vikash_chat_history',
    remember: 'vikash_chat_remember'
  };

  const SYSTEM_PROMPT = `You are Vikash's intelligent AI portfolio assistant. Be friendly, concise, and professional. Keep replies under 4 sentences unless listing items. Use emojis sparingly but effectively.

VIKASH SARAVANAN — FULL PROFILE:
• Degree: B.Tech in AI & Data Science (2024–2028)
• College: Rathinam Technical Campus, Coimbatore
• Native: Karur, Tamil Nadu, India
• Email: vikash07052008@gmail.com | Phone: +91 9342877474
• LinkedIn: linkedin.com/in/vikash-saravanan-j7528
• GitHub: github.com/vikashsaravanann
• Instagram: @startupwithvikash

TECHNICAL SKILLS:
• Languages: Python, JavaScript, TypeScript, SQL, HTML/CSS
• Frameworks: React, Next.js, Node.js, Flask
• AI/ML: PyTorch, TensorFlow, Computer Vision, NLP, LLMs, Generative AI
• Automation: n8n (workflow automation), web scraping, autonomous agents
• DevOps: Docker, Git, GitHub Pages
• Data: Pandas, NumPy, Matplotlib, Power BI, Data Annotation

ACHIEVEMENTS:
• Hackathon Finalist — Meta PyTorch (OpenEnv)
• 15+ Professional Certifications
• 3+ Live Production Architectures deployed
• 5000+ Lines of Code written

AVAILABILITY:
• Open for Remote & Coimbatore-based internships
• Interested in: Data Analysis, AI Engineering, Full-Stack Dev, Automation
• Currently building: Autonomous AI agents and scalable data pipelines

If asked something unrelated to Vikash, politely say: "I'm focused on helping you learn about Vikash! Try asking about his skills, projects, or how to contact him. 😊"`;

  let conversationHistory = [];
  const CHAT_VERSION = '1.3.2'; 
  let rememberHistory = true;

  try {
    const storedRemember = localStorage.getItem(STORAGE_KEYS.remember);
    if (storedRemember === 'false') {
      rememberHistory = false;
    }
    const storedVer = localStorage.getItem(STORAGE_KEYS.version);
    if (storedVer !== CHAT_VERSION) {
      localStorage.removeItem(STORAGE_KEYS.history);
      localStorage.setItem(STORAGE_KEYS.version, CHAT_VERSION);
    } else if (rememberHistory) {
      const stored = localStorage.getItem(STORAGE_KEYS.history);
      if (stored) {
        conversationHistory = JSON.parse(stored);
      }
    }
  } catch (e) {
    console.error('Failed to parse chat history', e);
  }

  const toggle      = document.getElementById('ai-chat-toggle');
  const panel       = document.getElementById('ai-chat-panel');
  const closeBtn    = document.getElementById('ai-chat-close');
  const resetBtn    = document.getElementById('ai-chat-reset');
  const memoryToggle = document.getElementById('ai-chat-memory');
  const messagesEl  = document.getElementById('chatMessages');
  const inputEl     = document.getElementById('chatInput');
  const sendBtn     = document.getElementById('chatSend');
  const chipsEl    = document.getElementById('chatChips');
  const micBtn     = document.getElementById('chatMic');
  const waveformEl = document.getElementById('chatWaveform');

  if (!toggle || !panel) return;

  function updateMemoryToggle() {
    if (!memoryToggle) return;
    memoryToggle.classList.toggle('active', rememberHistory);
    memoryToggle.setAttribute('title', rememberHistory ? 'Memory on' : 'Memory off');
  }

  updateMemoryToggle();

  if (memoryToggle) {
    memoryToggle.addEventListener('click', () => {
      rememberHistory = !rememberHistory;
      localStorage.setItem(STORAGE_KEYS.remember, rememberHistory ? 'true' : 'false');
      if (!rememberHistory) localStorage.removeItem(STORAGE_KEYS.history);
      else saveHistory();
      updateMemoryToggle();
    });
  }

  function initChat() {
    messagesEl.innerHTML = '';
    if (conversationHistory.length > 0) {
      if (chipsEl) chipsEl.style.display = 'none';
      conversationHistory.forEach(msg => addMessage(msg.content, msg.role, false));
    } else {
      if (chipsEl) chipsEl.style.display = 'flex';
      addMessage("Hey there! 👋 I'm Vikash's AI assistant. Ask me anything about him!", 'bot', false);
    }
  }

  initChat();

  if (resetBtn) {
    resetBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (confirm('Clear chat history?')) {
        localStorage.removeItem(STORAGE_KEYS.history);
        conversationHistory = [];
        initChat();
      }
    });
  }

  toggle.addEventListener('click', (e) => {
    e.preventDefault();
    panel.classList.toggle('open');
    if (panel.classList.contains('open')) setTimeout(() => inputEl.focus(), 300);
  });

  closeBtn.addEventListener('click', (e) => {
    e.preventDefault();
    panel.classList.remove('open');
  });

  if (chipsEl) {
    chipsEl.querySelectorAll('.chat-chip').forEach(chip => {
      chip.addEventListener('click', () => triggerSend(chip.getAttribute('data-msg')));
    });
  }

  sendBtn.addEventListener('click', (e) => { e.preventDefault(); triggerSend(inputEl.value); });
  inputEl.addEventListener('keydown', e => { if (e.key === 'Enter') triggerSend(inputEl.value); });

  function triggerSend(text) {
    text = text?.trim();
    if (!text) return;
    if (text.length > MAX_USER_CHARS) {
      addMessage(`Too long! Max ${MAX_USER_CHARS} chars.`, 'bot', false);
      return;
    }
    inputEl.value = '';
    inputEl.disabled = true;
    sendBtn.disabled = true;

    addMessage(text, 'user', false);
    conversationHistory.push({ role: 'user', content: text });
    saveHistory();

    if (chipsEl) chipsEl.style.display = 'none';
    const typingEl = addTyping();

    callBridge().then(({ content }) => {
      typingEl.remove();
      addMessage(content, 'bot', true);
      conversationHistory.push({ role: 'assistant', content });
      saveHistory();
    }).catch((err) => {
      console.error('Chat error:', err);
      typingEl.remove();
      addMessage(`Error: ${err.message}. Please try again later or reach out to vikash07052008@gmail.com.`, 'bot', false);
    }).finally(() => {
      inputEl.disabled = false;
      sendBtn.disabled = false;
      inputEl.focus();
    });
  }

  function saveHistory() {
    if (rememberHistory) localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(conversationHistory));
  }

  function parseMarkdown(text) {
    return text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
  }

  function addMessage(content, role, animate = false) {
    const uiRole = role === 'assistant' ? 'bot' : role;
    const wrap = document.createElement('div');
    wrap.className = `chat-msg ${uiRole}`;
    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';
    wrap.appendChild(bubble);
    messagesEl.appendChild(wrap);

    if (animate) {
      let i = 0;
      const interval = setInterval(() => {
        bubble.textContent = content.slice(0, ++i);
        messagesEl.scrollTop = messagesEl.scrollHeight;
        if (i >= content.length) {
          clearInterval(interval);
          bubble.innerHTML = parseMarkdown(content);
        }
      }, 10);
    } else {
      bubble.innerHTML = parseMarkdown(content);
    }
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return wrap;
  }

  function addTyping() {
    const wrap = document.createElement('div');
    wrap.className = 'chat-msg bot';
    wrap.innerHTML = '<div class="msg-bubble"><span class="typing-dots-chat"><span></span><span></span><span></span></span></div>';
    messagesEl.appendChild(wrap);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return wrap;
  }

  function resolveApiUrl(path) {
    const currentHost = window.location.hostname;
    if (currentHost === 'localhost' || currentHost === '127.0.0.1') return `${LOCAL_API_BASE}${path}`;
    return PRODUCTION_API_URL + path;
  }

  async function callBridge() {
    const messages = [{ role: 'system', content: SYSTEM_PROMPT }, ...conversationHistory.slice(-10)];
    const url = resolveApiUrl(API_URL);
    
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages })
      });

      const data = await res.json().catch(() => ({ error: 'Invalid JSON response from bridge' }));

      if (!res.ok) {
          throw new Error(data.error || `Server returned ${res.status}`);
      }

      const reply = data.choices?.[0]?.message?.content || data.message;
      if (!reply) throw new Error('Empty response from AI');
      
      return { content: reply };
    } catch (err) {
      throw new Error(`Connection failed: ${err.message}`);
    }
  }

})();
