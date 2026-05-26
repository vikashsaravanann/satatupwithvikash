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
  const CHAT_VERSION = '1.2'; // Update this to clear old cached conversations
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
  const modelSelect = document.getElementById('modelSelect');
  const fallbackBadge = document.getElementById('modelFallbackBadge');
  const inputEl     = document.getElementById('chatInput');
  const sendBtn     = document.getElementById('chatSend');
  const chipsEl    = document.getElementById('chatChips');
  const micBtn     = document.getElementById('chatMic');
  const waveformEl = document.getElementById('chatWaveform');

  if (!toggle || !panel) return;

  // Load preferred model from localStorage
  if (modelSelect) {
    const savedModel = localStorage.getItem(STORAGE_KEYS.model);
    if (savedModel) {
      modelSelect.value = savedModel;
    }
    modelSelect.addEventListener('change', () => {
      localStorage.setItem(STORAGE_KEYS.model, modelSelect.value);
      trackEvent('model_change', { model: modelSelect.value });
    });
  }

  function updateMemoryToggle() {
    if (!memoryToggle) return;
    memoryToggle.classList.toggle('active', rememberHistory);
    memoryToggle.setAttribute(
      'title',
      rememberHistory ? 'Memory on (saving chat history)' : 'Memory off (forget on close)'
    );
  }

  updateMemoryToggle();
  updateFallbackBadge(false);

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
        model: modelSelect?.value || DEFAULT_MODEL,
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
        // Stop any text-to-speech playing
        if (window.speechSynthesis) {
            try { window.speechSynthesis.cancel(); } catch(err) {}
        }
        if (waveformEl) waveformEl.classList.remove('active');
        try { recognition.start(); } catch(err) {}
      }
    });
  } else {
    // Hide mic button if SpeechRecognition is not supported in browser
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
        // Cancel voice
        if (window.speechSynthesis) {
            try { window.speechSynthesis.cancel(); } catch(err) {}
        }
        if (waveformEl) waveformEl.classList.remove('active');
        
        if (recognition) {
            try { recognition.stop(); } catch(err) {}
        }

        // Clear local storage and state
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
          trackEvent('quick_chip', { label: msg });
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
    updateFallbackBadge(false);
    inputEl.value = '';
    inputEl.disabled = true;
    sendBtn.disabled = true;
    if (micBtn) micBtn.disabled = true; // Disable mic while bot is responding

    // Add user message to UI and history
    addMessage(text, 'user', false);
    conversationHistory.push({ role: 'user', content: text });
    saveHistory();
    trackEvent('chat_message', { length: text.length, model: modelSelect?.value || DEFAULT_MODEL });

    // Hide chips container once chat starts
    if (chipsEl) chipsEl.style.display = 'none';

    // Show typing dots
    const typingEl = addTyping();
    let streamTarget = null;
    let streamedText = '';

    callBridge((delta) => {
      if (!streamTarget) {
        typingEl.remove();
        streamTarget = createMessageShell('assistant');
      }
      streamedText += delta;
      streamTarget.bubble.textContent = streamedText;
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }).then(({ content }) => {
      const reply = streamedText || content;
      if (streamTarget) {
        finalizeStreamingMessage(streamTarget, reply);
      } else {
        typingEl.remove();
        addMessage(reply, 'bot', true);
      }
      conversationHistory.push({ role: 'assistant', content: reply });
      saveHistory();
      trackEvent('chat_response', { length: reply.length });
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
      if (micBtn) micBtn.disabled = false; // Re-enable mic when bot is done
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

  // Pre-load and cache the best available female voice
  let cachedFemaleVoice = null;

  // Siri-style female voice priority list (highest priority first)
  const PREFERRED_VOICES = [
    'samantha',          // macOS/iOS Siri female
    'siri',             // Siri variants
    'zarvox',           // macOS
    'victoria',         // macOS
    'karen',            // macOS Australian
    'tessa',            // macOS South African
    'fiona',            // macOS UK
    'moira',            // macOS Irish
    'google us english', // Chrome high-quality
    'google uk english female',
    'microsoft zira',    // Windows
    'microsoft hazel',   // Windows UK
    'female',
  ];

  function selectBestFemaleVoice() {
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return null;

    // Try each preferred voice name in priority order
    for (const preferred of PREFERRED_VOICES) {
      const match = voices.find(v => {
        const name = v.name.toLowerCase();
        const lang = v.lang.toLowerCase();
        return lang.startsWith('en') && name.includes(preferred);
      });
      if (match) return match;
    }

    // Fallback: any English voice
    return voices.find(v => v.lang.startsWith('en')) || voices[0];
  }

  // Load voices as soon as they become available
  function loadVoices() {
    cachedFemaleVoice = selectBestFemaleVoice();
    if (cachedFemaleVoice) {
      console.log('🎙️ AI Voice selected:', cachedFemaleVoice.name, `(${cachedFemaleVoice.lang})`);
    }
  }

  // Voices load asynchronously — listen for the event
  if (window.speechSynthesis) {
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }

  function speakMessage(text, buttonElement) {
    if (!window.speechSynthesis) return;

    // If currently speaking the SAME text, stop it
    if (window.speechSynthesis.speaking && currentUtterance && currentUtterance.text === text) {
      window.speechSynthesis.cancel();
      buttonElement.innerHTML = '<i class="fas fa-volume-up"></i> Speak';
      buttonElement.classList.remove('speaking');
      if (waveformEl) waveformEl.classList.remove('active');
      return;
    }

    // Cancel any current speech
    window.speechSynthesis.cancel();
    document.querySelectorAll('.chat-sound-btn').forEach(btn => {
      btn.innerHTML = '<i class="fas fa-volume-up"></i> Speak';
      btn.classList.remove('speaking');
    });

    // Clean emojis & formatting links out of speech text for better pronunciation
    const cleanText = text.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '')
                          .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    currentUtterance = utterance;

    // Set the cached Siri-style female voice
    if (!cachedFemaleVoice) loadVoices(); // retry if not loaded yet
    if (cachedFemaleVoice) {
      utterance.voice = cachedFemaleVoice;
    }

    // Tune for clear, natural female Siri-style delivery
    utterance.pitch = 1.15;   // Slightly higher pitch for feminine clarity
    utterance.rate = 0.95;    // Slightly slower for professional clarity
    utterance.volume = 1.0;

    utterance.onstart = () => {
      buttonElement.innerHTML = '<i class="fas fa-volume-mute"></i> Mute';
      buttonElement.classList.add('speaking');
      if (waveformEl) waveformEl.classList.add('active'); // Activate glowing audio waveform
    };

    utterance.onend = () => {
      buttonElement.innerHTML = '<i class="fas fa-volume-up"></i> Speak';
      buttonElement.classList.remove('speaking');
      if (waveformEl) waveformEl.classList.remove('active'); // Disable waveform
    };

    utterance.onerror = () => {
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
      container.innerHTML = `
        <h4>🚀 HearWise Platform</h4>
        <p>AI-powered hearing screening & interactive gamified ocean platform designed for children.</p>
        <a href="index.html#hearwise" class="chat-rich-btn"><i class="fas fa-external-link-alt"></i> View Project details</a>
      `;
      return container;
    }
    if (lower.includes('certifications') || lower.includes('certification') || lower.includes('certs')) {
      container.className = 'chat-rich-card';
      container.innerHTML = `
        <h4>🏆 Certificates Gallery</h4>
        <p>Explore Vikash's 15+ verified certifications in AI, Data Science & Networks.</p>
        <a href="certifications.html" class="chat-rich-btn"><i class="fas fa-award"></i> Open Gallery</a>
      `;
      return container;
    }
    if (lower.includes('contact') || lower.includes('email') || lower.includes('hire') || lower.includes('phone')) {
      container.className = 'chat-rich-card';
      container.innerHTML = `
        <h4 style="font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 1.25rem;">📩 Quick Contact</h4>
        <p style="font-family: 'Inter', sans-serif; font-weight: 600; font-size: 0.95rem; color: rgba(255, 255, 255, 0.9); line-height: 1.5; margin-bottom: 16px;">
          Hi, I am Vikash! If you have an opportunity or want to collaborate, fill out this form to contact me directly via WhatsApp, SMS, and Email.
        </p>
        <form class="chat-contact-form">
          <input type="text" class="chat-form-input chat-form-name" placeholder="Full Name" required>
          <input type="email" class="chat-form-input chat-form-email" placeholder="Email Address" required>
          <input type="text" class="chat-form-input chat-form-subject" placeholder="Subject (e.g. Internship)" required>
          <textarea class="chat-form-textarea chat-form-msg" placeholder="Describe your inquiry..." required></textarea>
          <button type="submit" class="chat-form-submit"><i class="fas fa-paper-plane" style="margin-right:6px;"></i>Send Message</button>
        </form>
      `;

      // Bind the form action logic
      const form = container.querySelector('.chat-contact-form');
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = form.querySelector('.chat-form-submit');
        const name = form.querySelector('.chat-form-name').value;
        const email = form.querySelector('.chat-form-email').value;
        const subject = form.querySelector('.chat-form-subject').value;
        const msg = form.querySelector('.chat-form-msg').value;

        submitBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Sending...';
        submitBtn.disabled = true;

        const messageBody = `Hi Vikash,\n\nNew inquiry via AI Chatbot.\n\nName: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${msg}`;

        try {
            const url = resolveApiUrl(CONTACT_URL);
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, subject, message: messageBody })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                form.reset();
                submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> Sent!';
                addMessage("Your message has been successfully delivered to Vikash! 🚀✅", 'bot', false);
            } else {
                throw new Error(data.error || 'Failed to send message');
            }
        } catch (err) {
            console.warn('API delivery failed:', err);
            submitBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Failed';
            addMessage("Delivery failed. I've opened your mail app to complete the email manually. 📧", 'bot', false);
            setTimeout(() => {
                window.location.href = `mailto:vikash07052008@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(messageBody)}`;
            }, 800);
        }

        setTimeout(() => {
            submitBtn.innerHTML = '<i class="fas fa-paper-plane" style="margin-right:6px;"></i>Send Message';
            submitBtn.disabled = false;
        }, 4000);
      });

      return container;
    }
    return null;
  }

  /* ═══════════════════════════════════════════
     DOM CREATION HELPERS
     ═══════════════════════════════════════════ */
  /* ═══════════════════════════════════════════
     MARKDOWN TO HTML PARSER
     Converts **bold**, [link](url), and \n to styled HTML
     ═══════════════════════════════════════════ */
  function parseMarkdown(text) {
    // First, extract code blocks to avoid them being messed up by other formatting
    const codeBlocks = [];
    text = text.replace(/```([\s\S]*?)```/g, (match, code) => {
        const id = `__CODE_BLOCK_${codeBlocks.length}__`;
        // Escape HTML tags in code
        const safeCode = code.replace(/</g, '&lt;').replace(/>/g, '&gt;').trim();
        codeBlocks.push(`<pre style="background: #1f2937; color: #e5e7eb; padding: 12px; border-radius: 8px; overflow-x: auto; font-family: 'Fira Code', monospace; margin: 10px 0; border: 1px solid #374151;"><code>${safeCode}</code></pre>`);
        return id;
    });

    // Extract inline code
    const inlineCodes = [];
    text = text.replace(/`([^`]+)`/g, (match, code) => {
        const id = `__INLINE_CODE_${inlineCodes.length}__`;
        const safeCode = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        inlineCodes.push(`<code style="background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; font-family: 'Fira Code', monospace; color: #60a5fa;">${safeCode}</code>`);
        return id;
    });

    text = text
      // Bold: **text**
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // Italic: *text*
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Links: [label](url)
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="chat-link">$1 <i class="fas fa-external-link-alt" style="font-size:0.65rem;"></i></a>')
      // Newlines
      .replace(/\n/g, '<br>');

    // Re-insert inline code
    inlineCodes.forEach((html, index) => {
        text = text.replace(`__INLINE_CODE_${index}__`, html);
    });

    // Re-insert code blocks
    codeBlocks.forEach((html, index) => {
        text = text.replace(`__CODE_BLOCK_${index}__`, html);
    });

    return text;
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

    let soundBtn = null;
    if (uiRole === 'bot') {
      soundBtn = document.createElement('button');
      soundBtn.className = 'chat-sound-btn';
      soundBtn.setAttribute('title', 'Read aloud');
      soundBtn.innerHTML = '<i class="fas fa-volume-up"></i><span>Speak</span>';
      wrapper.appendChild(soundBtn);
    }

    messagesEl.scrollTop = messagesEl.scrollHeight;

    return { wrap, wrapper, bubble, soundBtn, uiRole };
  }

  function addMessage(content, role, animate = false) {
    const { wrap, wrapper, bubble, soundBtn } = createMessageShell(role);
    if (soundBtn) {
      soundBtn.addEventListener('click', () => speakMessage(content, soundBtn));
    }

    if (animate) {
      let i = 0;
      const interval = setInterval(() => {
        i++;
        // Stream raw text first, then parse markdown at the end to avoid broken mid-tag renders
        bubble.textContent = content.slice(0, i);
        messagesEl.scrollTop = messagesEl.scrollHeight;
        if (i >= content.length) {
          clearInterval(interval);
          // Now render with Markdown once streaming is complete
          bubble.innerHTML = parseMarkdown(content);
          // Check and append rich interactive cards / form if applicable
          const card = getRichCardElement(content);
          if (card) {
            wrapper.appendChild(card);
            messagesEl.scrollTop = messagesEl.scrollHeight;
          }
        }
      }, 15);
    } else {
      bubble.innerHTML = parseMarkdown(content);
      // Append rich cards immediately for loaded history
      const card = getRichCardElement(content);
      if (card) {
        wrapper.appendChild(card);
      }
    }

    messagesEl.scrollTop = messagesEl.scrollHeight;
    return wrap;
  }

  function finalizeStreamingMessage(target, content) {
    target.bubble.innerHTML = parseMarkdown(content);
    if (target.soundBtn) {
      target.soundBtn.onclick = () => speakMessage(content, target.soundBtn);
    }
    const card = getRichCardElement(content);
    if (card) {
      target.wrapper.appendChild(card);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }
  }

  function addTyping() {
    const wrap = document.createElement('div');
    wrap.className = 'chat-msg bot';
    wrap.innerHTML = '<div class="msg-wrapper"><div class="msg-bubble"><span class="typing-dots-chat"><span></span><span></span><span></span></span></div></div>';
    messagesEl.appendChild(wrap);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return wrap;
  }

  /* ═══════════════════════════════════════════
     API BRIDGE CALL WITH MULTI-TURN MEMORY
     ═══════════════════════════════════════════ */
  function resolveApiUrl(path) {
    if (window.location.protocol === 'file:' ||
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1') {
      return `${LOCAL_API_BASE}${path}`;
    }
    if (window.location.hostname.includes('github.io') ||
        (window.location.hostname && window.location.hostname !== new URL(PRODUCTION_API_URL).hostname)) {
      return PRODUCTION_API_URL + path;
    }
    return path;
  }

  function updateFallbackBadge(fallbackUsed, modelUsed) {
    if (!fallbackBadge) return;
    if (fallbackUsed) {
      fallbackBadge.textContent = `Fallback: ${modelUsed || DEFAULT_MODEL}`;
      fallbackBadge.hidden = false;
    } else {
      fallbackBadge.hidden = true;
    }
  }

  function trackEvent(type, data = {}) {
    const payload = { type, data, ts: new Date().toISOString() };
    fetch(resolveApiUrl(ANALYTICS_URL), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true
    }).catch(() => {});
  }

  async function streamResponse(body, onDelta) {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        if (trimmed === 'data: [DONE]') {
          return fullText;
        }
        if (!trimmed.startsWith('data:')) continue;
        const payload = trimmed.replace(/^data:\s*/, '');
        try {
          const chunk = JSON.parse(payload);
          const delta = chunk.choices?.[0]?.delta?.content ||
                        chunk.choices?.[0]?.message?.content ||
                        '';
          if (delta) {
            fullText += delta;
            onDelta(delta);
          }
        } catch (err) {
          console.warn('Stream parse error:', err);
        }
      }
    }

    return fullText;
  }

  async function parseBridgeResponse(res, onDelta, fallbackModel) {
    const meta = {
      fallbackUsed: res.headers.get('x-fallback-used') === 'true',
      modelUsed: res.headers.get('x-model-used') || fallbackModel
    };

    const isStream = res.headers.get('content-type')?.includes('text/event-stream');
    if (isStream && res.body && typeof onDelta === 'function') {
      const content = await streamResponse(res.body, onDelta);
      return { content, meta };
    }

    const data = await res.json();
    meta.fallbackUsed = typeof data.fallbackUsed === 'boolean' ? data.fallbackUsed : meta.fallbackUsed;
    meta.modelUsed = data.model_used || meta.modelUsed;
    return { content: extractContent(data), meta };
  }

  async function callBridge(onDelta) {
    const relevantHistory = conversationHistory.slice(-10);

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...relevantHistory
    ];

    const wantsStream = typeof ReadableStream !== 'undefined';
    const body = { input: messages, stream: wantsStream };
    const primaryUrl = resolveApiUrl(API_URL);
    const isLocal = primaryUrl.startsWith(LOCAL_API_BASE);

    try {
      const res = await fetch(primaryUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        // If local API call fails, fall back to the production API bridge
        if (isLocal) {
          console.warn('Local API unavailable, falling back to production API bridge...');
          const fallbackRes = await fetch(PRODUCTION_API_URL + API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });
          if (!fallbackRes.ok) throw new Error('Production API bridge error');
          return await parseBridgeResponse(fallbackRes, onDelta);
        }
        throw new Error('Bridge error');
      }

      return await parseBridgeResponse(res, onDelta);
    } catch (err) {
      // Catch network/connection errors (e.g. local server not running)
      if (isLocal) {
        console.warn('Local API connection failed, falling back to production API bridge...', err);
        try {
          const fallbackRes = await fetch(PRODUCTION_API_URL + API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });
          if (!fallbackRes.ok) throw new Error('Production API bridge error');
          return await parseBridgeResponse(fallbackRes, onDelta);
        } catch (fallbackErr) {
          throw fallbackErr;
        }
      }
      throw err;
    }
  }

  function extractContent(data) {
    return data.message?.content ||
           data.choices?.[0]?.message?.content ||
           data.choices?.[0]?.delta?.content ||
           data.response ||
           data.message ||
           "I'm not sure how to answer that.";
  }

})();
    data.message ||
           "I'm not sure how to answer that.";
  }

})();


})();
";
  }

})();
t.";
  }

})();
 that.";
  }

})();


})();
";
  }

})();
t.";
  }

})();
