/**
 * VIKASH PORTFOLIO — AI CHATBOT (ULTIMATE UPGRADE EDITION)
 * ✅ Conversation Memory & Session Persistence (localStorage)
 * ✅ Text-To-Speech Voice Synthesis (Web Speech API) with Siri Waveform Sync
 * ✅ Voice Input / Speech-to-Text Dictation (Web Speech Recognition API)
 * ✅ Clear Chat Memory Reset Action
 * ✅ Proactive Welcome Greeting (Auto-open after 8s) & Time-Based Greetings
 * ✅ Rich Interactive Contact Form Bubble & Cards
 */

(function () {
  'use strict';

  /* ═══════════════════════════════════════════
     CONFIGURATION
     ═══════════════════════════════════════════ */
  const DEFAULT_MODEL = 'grok-beta';
  const API_URL = '/api/chat';
  const ANALYTICS_URL = '/api/analytics';
  const CONTACT_URL = '/api/contact';
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

PROJECTS & GITHUB REPOSITORIES (16 total):
Always provide the relevant GitHub or Live URL when mentioning these projects.
1. Portfolio_Information: Personal portfolio website with an AI assistant. GitHub: github.com/vikashsaravanann/Portfolio_Information | Live: vikashsaravanann.github.io/Portfolio_Information/
2. HearWise Child Health: Mobile-first clinical hearing screening platform. GitHub: github.com/vikashsaravanann/hearwise-child-health | Live: vikashsaravanann.github.io/hearwise-child-health/
3. OpenEnv-Debugger: Simulation environment for training AI agents (Meta Hackathon). GitHub: github.com/vikashsaravanann/OpenEnv-Debugger | Live API: huggingface.co/spaces/vikashsaravanan/openenv-support-triage
4. AI Traffic Management System: Adaptive Arduino LED control via React dashboard and YOLOv8. GitHub: github.com/vikashsaravanann/AI-Traffic-Management-system
5. Dropout Alert System: Edge AI predictive system using TFLite/ONNX on Android. GitHub: github.com/vikashsaravanann/dropout-alert-system
6. IPL Data Analysis Project: Comprehensive EDA of IPL cricket data (2008–2020). GitHub: github.com/vikashsaravanann/IPL-Data-Analysis-Project
7. GameHub: Console-based Python arcade featuring multi-user profiles. GitHub: github.com/vikashsaravanann/gamehub
8. FCC Mean-Variance Calculator: Python certification function calculating statistical metrics. GitHub: github.com/vikashsaravanann/fcc-mean-variance-calculator
9. FCC Demographic Data Analyzer: Analysis of 1994 US census dataset. GitHub: github.com/vikashsaravanann/fcc-demographic-data-analyzer
10. FCC Medical Data Visualizer: Medical examination datasets using Seaborn heatmaps. GitHub: github.com/vikashsaravanann/fcc-medical-data-visualizer
11. FCC Page View Time Series: Time series visualization of forum page views. GitHub: github.com/vikashsaravanann/fcc-page-view-time-series-visualizer
12. FCC Sea Level Predictor: Scientific modeling predicting sea level rise. GitHub: github.com/vikashsaravanann/fcc-sea-level-predictor
13. Logic-Intelligence: Early frontend layouts for agency workflows. GitHub: github.com/vikashsaravanann/Logic-Intelligence
14. BroadcastAI-Portfolio: Private branding repository configuring an AI broadcasting concept. GitHub: github.com/vikashsaravanann/BroadcastAI-Portfolio
15. Web-Development: Early responsive single-page HTML structures. GitHub: github.com/vikashsaravanann/Web-Development
16. portfolio.vikashsaravanan: Archived asset repository for legacy profile data. GitHub: github.com/vikashsaravanann/portfolio.vikashsaravanan
ACHIEVEMENTS:
• Hackathon Finalist — Meta PyTorch (OpenEnv)
• 15+ Professional Certifications
• 3+ Live Production Architectures deployed
• 5000+ Lines of Code written

CERTIFICATIONS (all 15):
1. Data Analysis — Microsoft & LinkedIn
2. Coding Essentials — Scaler
3. Full-Stack Development — Rathinam Workshop
4. Data Analytics 1 — LinkedIn
5. Data Analytics 2 — LinkedIn
6. Data Analysis with Python — freeCodeCamp
7. Networking Basics & Troubleshooting — Cisco Academy
8. Design Thinking — IIT Bombay
9. Career Essentials in Data Analysis — Microsoft & LinkedIn
10. Applied Machine Learning: Ensemble Learning — LinkedIn Learning
11. Generative AI vs. Traditional AI — LinkedIn Learning
12. Generative AI vs. Traditional AI (NASBA) — LinkedIn Learning
13. Hands-On Data Annotation: Applied Machine Learning — LinkedIn Learning
14. Certified Ethical Hacker (CEH) — LinkedIn Learning
15. The Cybersecurity Threat Landscape — LinkedIn Learning
16. Introduction to Career Skills in Data Analytics — LinkedIn Learning

AVAILABILITY:
• Open for Remote & Coimbatore-based internships
• Interested in: Data Analysis, AI Engineering, Full-Stack Dev, Automation
• Currently building: Autonomous AI agents and scalable data pipelines

If asked something unrelated to Vikash, politely say: "I'm focused on helping you learn about Vikash! Try asking about his skills, projects, or how to contact him. 😊"`;

  /* ═══════════════════════════════════════════
     STATE MANAGEMENT & LOCAL STORAGE
     ═══════════════════════════════════════════ */
  let conversationHistory = [];
  const CHAT_VERSION = '1.3.1'; 
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

  /* ═══════════════════════════════════════════
     DOM ELEMENTS
     ═══════════════════════════════════════════ */
  const toggle      = document.getElementById('ai-chat-toggle');
  const panel       = document.getElementById('ai-chat-panel');
  const closeBtn    = document.getElementById('ai-chat-close');
  const resetBtn    = document.getElementById('ai-chat-reset');
  const memoryToggle = document.getElementById('ai-chat-memory');
  const exportBtn    = document.getElementById('ai-chat-export');
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
    memoryToggle.setAttribute(
      'title',
      rememberHistory ? 'Memory on (saving chat history)' : 'Memory off (forget on close)'
    );
  }

  updateMemoryToggle();

  if (memoryToggle) {
    memoryToggle.addEventListener('click', () => {
      rememberHistory = !rememberHistory;
      try {
        localStorage.setItem(STORAGE_KEYS.remember, rememberHistory ? 'true' : 'false');
        if (!rememberHistory) {
          localStorage.removeItem(STORAGE_KEYS.history);
        } else {
          saveHistory();
        }
      } catch (err) {
        console.warn('Failed to update memory preference', err);
      }
      updateMemoryToggle();
    });
  }

  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      if (conversationHistory.length === 0) {
        addMessage('There is no chat history to export yet.', 'bot', false);
        return;
      }
      const payload = {
        exportedAt: new Date().toISOString(),
        history: conversationHistory
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'vikash-chat-history.json';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    });
  }

  // Speech recognition global variable
  let recognition = null;
  // Speech synthesis global variable
  let currentUtterance = null;

  /* ═══════════════════════════════════════════
     SPEECH TO TEXT (MICROPHONE DICTATION)
     ═══════════════════════════════════════════ */
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => {
      micBtn.classList.add('listening');
      inputEl.placeholder = 'Listening... Speak now';
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      inputEl.value = transcript;
    };

    recognition.onerror = (event) => {
      console.warn('Speech Recognition Error: ', event.error);
      micBtn.classList.remove('listening');
      inputEl.placeholder = 'Ask me anything about Vikash...';
    };

    recognition.onend = () => {
      micBtn.classList.remove('listening');
      inputEl.placeholder = 'Ask me anything about Vikash...';
    };

    micBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (micBtn.classList.contains('listening')) {
        try { recognition.stop(); } catch(err) {}
      } else {
        if (window.speechSynthesis) {
            try { window.speechSynthesis.cancel(); } catch(err) {}
        }
        if (waveformEl) waveformEl.classList.remove('active');
        try { recognition.start(); } catch(err) {}
      }
    });
  } else {
    if (micBtn) micBtn.style.display = 'none';
  }

  /* ═══════════════════════════════════════════
     INITIALIZE GREETINGS & MEMORY
     ═══════════════════════════════════════════ */
  function getDynamicGreeting() {
    const hour = new Date().getHours();
    let timeGreeting = "Hey there! 👋";
    if (hour >= 5 && hour < 12) timeGreeting = "Good morning! 🌅";
    else if (hour >= 12 && hour < 17) timeGreeting = "Good afternoon! ☀️";
    else if (hour >= 17 && hour < 22) timeGreeting = "Good evening! 🌃";
    else timeGreeting = "Burning the midnight oil? 🌌";

    return `${timeGreeting} I'm Vikash's AI assistant. Ask me anything about his projects, skills, or certifications. I can read my answers out loud too!`;
  }

  function initChat() {
    messagesEl.innerHTML = '';
    if (conversationHistory.length > 0) {
      if (chipsEl) chipsEl.style.display = 'none';
      conversationHistory.forEach(msg => {
        addMessage(msg.content, msg.role, false);
      });
    } else {
      if (chipsEl) chipsEl.style.display = 'flex';
      const greeting = getDynamicGreeting();
      addMessage(greeting, 'bot', false);
    }
  }

  initChat();

  /* ═══════════════════════════════════════════
     CLEAR CHAT (RESET SYSTEM)
     ═══════════════════════════════════════════ */
  if (resetBtn) {
    resetBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (confirm('Clear entire conversation history?')) {
        if (window.speechSynthesis) {
            try { window.speechSynthesis.cancel(); } catch(err) {}
        }
        if (waveformEl) waveformEl.classList.remove('active');
        
        if (recognition) {
            try { recognition.stop(); } catch(err) {}
        }

        try {
            localStorage.removeItem(STORAGE_KEYS.history);
        } catch(err) {
            console.warn('LocalStorage error', err);
        }
        conversationHistory = [];
        initChat();
      }
    });
  }

  /* ═══════════════════════════════════════════
     PROACTIVE AUTO-OPEN TIMER (8 seconds)
     ═══════════════════════════════════════════ */
  const autoOpenKey = 'vikash_chat_auto_opened';
  if (!sessionStorage.getItem(autoOpenKey) && conversationHistory.length === 0) {
    setTimeout(() => {
      if (!panel.classList.contains('open')) {
        panel.classList.add('open');
        sessionStorage.setItem(autoOpenKey, 'true');
        setTimeout(() => inputEl.focus(), 300);
      }
    }, 8000);
  }

  /* ═══════════════════════════════════════════
     TOGGLE PANEL
     ═══════════════════════════════════════════ */
  toggle.addEventListener('click', (e) => {
    e.preventDefault();
    panel.classList.toggle('open');
    if (panel.classList.contains('open')) {
      setTimeout(() => inputEl.focus(), 300);
    } else {
      if (window.speechSynthesis) {
          try { window.speechSynthesis.cancel(); } catch(err) {}
      }
      if (waveformEl) waveformEl.classList.remove('active');
      if (!rememberHistory) {
        conversationHistory = [];
        initChat();
      }
    }
  });

  closeBtn.addEventListener('click', (e) => {
    e.preventDefault();
    panel.classList.remove('open');
    if (window.speechSynthesis) {
        try { window.speechSynthesis.cancel(); } catch(err) {}
    }
    if (waveformEl) waveformEl.classList.remove('active');
    if (recognition) {
        try { recognition.stop(); } catch(err) {}
    }
    if (!rememberHistory) {
      conversationHistory = [];
      initChat();
    }
  });

  /* ═══════════════════════════════════════════
     QUICK ACTION CHIPS
     ═══════════════════════════════════════════ */
  if (chipsEl) {
    chipsEl.querySelectorAll('.chat-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        e.preventDefault();
        const msg = chip.getAttribute('data-msg');
        if (msg) {
          triggerSend(msg);
        }
      });
    });
  }

  /* ═══════════════════════════════════════════
     SEND MESSAGE LOGIC
     ═══════════════════════════════════════════ */
  sendBtn.addEventListener('click', (e) => {
    e.preventDefault();
    triggerSend(inputEl.value);
  });
  inputEl.addEventListener('keydown', e => { if (e.key === 'Enter') triggerSend(inputEl.value); });

  function triggerSend(text) {
    text = text.trim();
    if (!text) return;
    if (text.length > MAX_USER_CHARS) {
      addMessage(`Please keep messages under ${MAX_USER_CHARS} characters.`, 'bot', false);
      return;
    }
    if (CONTROL_CHAR_REGEX.test(text)) {
      addMessage('Please remove unsupported control characters and try again.', 'bot', false);
      return;
    }
    inputEl.value = '';
    inputEl.disabled = true;
    sendBtn.disabled = true;
    if (micBtn) micBtn.disabled = true;

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
      const errorMsg = err.message || "Unknown error";
      const userFriendlyMsg = errorMsg.includes('401') 
        ? "API Key Error: Grok AI returned 401. Please check XAI_API_KEY." 
        : "Sorry, I'm having trouble connecting to Grok AI. 📧 vikash07052008@gmail.com";
      addMessage(userFriendlyMsg, 'bot', false);
    }).finally(() => {
      inputEl.disabled = false;
      sendBtn.disabled = false;
      if (micBtn) micBtn.disabled = false;
      inputEl.focus();
    });
  }

  function saveHistory() {
    if (!rememberHistory) return;
    try {
      localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(conversationHistory));
    } catch (e) {
      console.error('Failed to save chat history', e);
    }
  }

  /* ═══════════════════════════════════════════
     TEXT TO SPEECH (VOICE RESPONSES & SIRI SYNC)
     ═══════════════════════════════════════════ */
  let cachedFemaleVoice = null;
  const PREFERRED_VOICES = ['samantha', 'siri', 'zarvox', 'victoria', 'google us english', 'microsoft zira'];

  function selectBestFemaleVoice() {
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return null;
    for (const preferred of PREFERRED_VOICES) {
      const match = voices.find(v => {
        const name = v.name.toLowerCase();
        const lang = v.lang.toLowerCase();
        return lang.startsWith('en') && name.includes(preferred);
      });
      if (match) return match;
    }
    return voices.find(v => v.lang.startsWith('en')) || voices[0];
  }

  function loadVoices() {
    cachedFemaleVoice = selectBestFemaleVoice();
  }

  if (window.speechSynthesis) {
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }

  function speakMessage(text, buttonElement) {
    if (!window.speechSynthesis) return;
    if (window.speechSynthesis.speaking && currentUtterance && currentUtterance.text === text) {
      window.speechSynthesis.cancel();
      buttonElement.innerHTML = '<i class="fas fa-volume-up"></i> Speak';
      buttonElement.classList.remove('speaking');
      if (waveformEl) waveformEl.classList.remove('active');
      return;
    }
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '')
                          .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    currentUtterance = utterance;
    if (!cachedFemaleVoice) loadVoices();
    if (cachedFemaleVoice) utterance.voice = cachedFemaleVoice;
    utterance.pitch = 1.15;
    utterance.rate = 0.95;

    utterance.onstart = () => {
      buttonElement.innerHTML = '<i class="fas fa-volume-mute"></i> Mute';
      buttonElement.classList.add('speaking');
      if (waveformEl) waveformEl.classList.add('active');
    };
    utterance.onend = () => {
      buttonElement.innerHTML = '<i class="fas fa-volume-up"></i> Speak';
      buttonElement.classList.remove('speaking');
      if (waveformEl) waveformEl.classList.remove('active');
    };
    window.speechSynthesis.speak(utterance);
  }

  /* ═══════════════════════════════════════════
     RICH UI CARD & FORM GENERATOR
     ═══════════════════════════════════════════ */
  function getRichCardElement(text) {
    const lower = text.toLowerCase();
    const container = document.createElement('div');
    if (lower.includes('hearwise')) {
      container.className = 'chat-rich-card';
      container.innerHTML = `<h4>🚀 HearWise</h4><p>AI-powered hearing screening.</p><a href="index.html#hearwise" class="chat-rich-btn">Details</a>`;
      return container;
    }
    if (lower.includes('contact')) {
      container.className = 'chat-rich-card';
      container.innerHTML = `<h4>📩 Contact</h4><form class="chat-contact-form"><input type="text" class="chat-form-input chat-form-name" placeholder="Name" required><input type="email" class="chat-form-input chat-form-email" placeholder="Email" required><textarea class="chat-form-textarea chat-form-msg" placeholder="Message" required></textarea><button type="submit" class="chat-form-submit">Send</button></form>`;
      return container;
    }
    return null;
  }

  function parseMarkdown(text) {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="chat-link">$1</a>')
      .replace(/\n/g, '<br>');
  }

  function createMessageShell(role) {
    const uiRole = role === 'assistant' ? 'bot' : role;
    const wrap = document.createElement('div');
    wrap.className = `chat-msg ${uiRole}`;
    const wrapper = document.createElement('div');
    wrapper.className = 'msg-wrapper';
    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';
    wrapper.appendChild(bubble);
    wrap.appendChild(wrapper);
    messagesEl.appendChild(wrap);
    if (uiRole === 'bot') {
      const soundBtn = document.createElement('button');
      soundBtn.className = 'chat-sound-btn';
      soundBtn.innerHTML = '<i class="fas fa-volume-up"></i><span>Speak</span>';
      wrapper.appendChild(soundBtn);
    }
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return { wrap, wrapper, bubble };
  }

  function addMessage(content, role, animate = false) {
    const { wrap, wrapper, bubble } = createMessageShell(role);
    const soundBtn = wrapper.querySelector('.chat-sound-btn');
    if (soundBtn) soundBtn.addEventListener('click', () => speakMessage(content, soundBtn));
    if (animate) {
      let i = 0;
      const interval = setInterval(() => {
        bubble.textContent = content.slice(0, ++i);
        messagesEl.scrollTop = messagesEl.scrollHeight;
        if (i >= content.length) {
          clearInterval(interval);
          bubble.innerHTML = parseMarkdown(content);
          const card = getRichCardElement(content);
          if (card) wrapper.appendChild(card);
        }
      }, 15);
    } else {
      bubble.innerHTML = parseMarkdown(content);
      const card = getRichCardElement(content);
      if (card) wrapper.appendChild(card);
    }
    return wrap;
  }

  function addTyping() {
    const wrap = document.createElement('div');
    wrap.className = 'chat-msg bot';
    wrap.innerHTML = '<div class="msg-wrapper"><div class="msg-bubble"><span class="typing-dots-chat"><span></span><span></span><span></span></span></div></div>';
    messagesEl.appendChild(wrap);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return wrap;
  }

  function resolveApiUrl(path) {
    if (window.location.protocol === 'file:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return `${LOCAL_API_BASE}${path}`;
    }
    return PRODUCTION_API_URL + path;
  }

  async function callBridge() {
    const messages = [{ role: 'system', content: SYSTEM_PROMPT }, ...conversationHistory.slice(-10)];
    const body = { messages, stream: false };
    const url = resolveApiUrl(API_URL);
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Bridge error');
    }
    const data = await res.json();
    return { content: data.choices?.[0]?.message?.content || data.message || "I'm not sure." };
  }

})();
