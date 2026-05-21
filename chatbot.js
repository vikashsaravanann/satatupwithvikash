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
  const XAI_MODEL = 'grok-4.20-reasoning';
  const API_URL = '/api/chat';
  const VERCEL_URL = 'https://portfolio-information.vercel.app';
  const LOCAL_API_URL = 'http://localhost:3000/api/chat';

  const SYSTEM_PROMPT = `You are Vikash's intelligent AI portfolio assistant. Be friendly, concise, and professional. Keep replies under 4 sentences unless listing items. Use emojis sparingly but effectively.

VIKASH SARAVANAN — FULL PROFILE:
• Degree: B.Tech in AI & Data Science, 1st Year (2025–2029)
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
• DevOps: Docker, Git, GitHub Pages, Vercel
• Data: Pandas, NumPy, Matplotlib, Power BI, Data Annotation

PROJECTS:
• HearWise — Production-ready AI-powered hearing assistance platform with ocean-themed UI
• AI Automation Systems — Enterprise-grade n8n workflow automations for businesses
• Portfolio Website — This site, built with vanilla HTML/CSS/JS with 30+ custom animations and AI chatbot

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
14. Introduction to Career Skills in Data Analytics — LinkedIn Learning
15. The Cybersecurity Threat Landscape — LinkedIn Learning

AVAILABILITY:
• Open for Remote & Coimbatore-based internships
• Interested in: Data Analysis, AI Engineering, Full-Stack Dev, Automation
• Currently building: Autonomous AI agents and scalable data pipelines

If asked something unrelated to Vikash, politely say: "I'm focused on helping you learn about Vikash! Try asking about his skills, projects, or how to contact him. 😊"`;

  /* ═══════════════════════════════════════════
     STATE MANAGEMENT & LOCAL STORAGE
     ═══════════════════════════════════════════ */
  let conversationHistory = [];
  try {
    const stored = localStorage.getItem('vikash_chat_history');
    if (stored) {
      conversationHistory = JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to parse chat history', e);
  }

  /* ═══════════════════════════════════════════
     DOM ELEMENTS
     ═══════════════════════════════════════════ */
  const toggle     = document.getElementById('ai-chat-toggle');
  const panel      = document.getElementById('ai-chat-panel');
  const closeBtn   = document.getElementById('ai-chat-close');
  const resetBtn   = document.getElementById('ai-chat-reset');
  const messagesEl = document.getElementById('chatMessages');
  const inputEl    = document.getElementById('chatInput');
  const sendBtn    = document.getElementById('chatSend');
  const chipsEl    = document.getElementById('chatChips');
  const micBtn     = document.getElementById('chatMic');
  const waveformEl = document.getElementById('chatWaveform');

  if (!toggle || !panel) return;

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

    micBtn.addEventListener('click', () => {
      if (micBtn.classList.contains('listening')) {
        recognition.stop();
      } else {
        // Stop any text-to-speech playing
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        if (waveformEl) waveformEl.classList.remove('active');
        recognition.start();
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
    resetBtn.addEventListener('click', () => {
      if (confirm('Clear entire conversation history?')) {
        // Cancel voice
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        if (waveformEl) waveformEl.classList.remove('active');
        if (recognition) recognition.stop();

        // Clear local storage and state
        localStorage.removeItem('vikash_chat_history');
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
  toggle.addEventListener('click', () => {
    panel.classList.toggle('open');
    if (panel.classList.contains('open')) {
      setTimeout(() => inputEl.focus(), 300);
    } else {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      if (waveformEl) waveformEl.classList.remove('active');
    }
  });

  closeBtn.addEventListener('click', () => {
    panel.classList.remove('open');
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (waveformEl) waveformEl.classList.remove('active');
  });

  /* ═══════════════════════════════════════════
     QUICK ACTION CHIPS
     ═══════════════════════════════════════════ */
  if (chipsEl) {
    chipsEl.querySelectorAll('.chat-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const msg = chip.getAttribute('data-msg');
        if (msg) triggerSend(msg);
      });
    });
  }

  /* ═══════════════════════════════════════════
     SEND MESSAGE LOGIC
     ═══════════════════════════════════════════ */
  sendBtn.addEventListener('click', () => triggerSend(inputEl.value));
  inputEl.addEventListener('keydown', e => { if (e.key === 'Enter') triggerSend(inputEl.value); });

  function triggerSend(text) {
    text = text.trim();
    if (!text) return;
    inputEl.value = '';
    inputEl.disabled = true;
    sendBtn.disabled = true;

    // Add user message to UI and history
    addMessage(text, 'user', false);
    conversationHistory.push({ role: 'user', content: text });
    saveHistory();

    // Hide chips container once chat starts
    if (chipsEl) chipsEl.style.display = 'none';

    // Show typing dots
    const typingEl = addTyping();

    callBridge().then(reply => {
      typingEl.remove();
      // Print message with smooth typing animation
      addMessage(reply, 'bot', true);
      conversationHistory.push({ role: 'assistant', content: reply });
      saveHistory();
    }).catch(() => {
      typingEl.remove();
      addMessage("Sorry, I'm having trouble connecting right now. Reach Vikash directly at vikash07052008@gmail.com 📧", 'bot', false);
    }).finally(() => {
      inputEl.disabled = false;
      sendBtn.disabled = false;
      inputEl.focus();
    });
  }

  function saveHistory() {
    try {
      localStorage.setItem('vikash_chat_history', JSON.stringify(conversationHistory));
    } catch (e) {
      console.error('Failed to save chat history', e);
    }
  }

  /* ═══════════════════════════════════════════
     TEXT TO SPEECH (VOICE RESPONSES & SIRI SYNC)
     ═══════════════════════════════════════════ */
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

    // Try to find a high-quality Siri-style English female voice
    const voices = window.speechSynthesis.getVoices();
    let femaleVoice = voices.find(v => {
      const name = v.name.toLowerCase();
      const lang = v.lang.toLowerCase();
      return lang.startsWith('en') && (
        name.includes('siri') ||
        name.includes('samantha') || 
        name.includes('zira') || 
        name.includes('google us english') || 
        name.includes('victoria') || 
        name.includes('tessa') || 
        name.includes('karen') ||
        name.includes('veena')
      );
    });

    if (!femaleVoice) {
      femaleVoice = voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('female'));
    }
    if (!femaleVoice) {
      femaleVoice = voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('google'));
    }
    if (!femaleVoice) {
      femaleVoice = voices.find(v => v.lang.startsWith('en'));
    }

    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }

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
        <h4>📩 Interactive Contact Form</h4>
        <p>Send a message directly to Vikash from here!</p>
        <form class="chat-contact-form">
          <input type="text" class="chat-form-input chat-form-name" placeholder="Your Name" required>
          <input type="email" class="chat-form-input chat-form-email" placeholder="Your Email Address" required>
          <input type="text" class="chat-form-input chat-form-subject" placeholder="Subject" required>
          <textarea class="chat-form-textarea chat-form-msg" placeholder="Your message here..." required></textarea>
          <button type="submit" class="chat-form-submit">Send Message</button>
        </form>
      `;

      // Bind the form action logic
      const form = container.querySelector('.chat-contact-form');
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const submitBtn = form.querySelector('.chat-form-submit');
        const name = form.querySelector('.chat-form-name').value;
        const email = form.querySelector('.chat-form-email').value;
        const subject = form.querySelector('.chat-form-subject').value;
        const msg = form.querySelector('.chat-form-msg').value;

        submitBtn.textContent = 'Launching Apps...';
        submitBtn.disabled = true;

        // Construct the unified message body
        const messageBody = `Hi Vikash,\n\nI am contacting you from your AI Chatbot.\n\nName: ${name}\nEmail: ${email}\n\nMessage:\n${msg}`;
        const encodedBody = encodeURIComponent(messageBody);
        const encodedSubject = encodeURIComponent(subject);

        // 1. WhatsApp Trigger (Opens in new tab/app)
        window.open(`https://wa.me/919342877474?text=${encodedBody}`, '_blank');

        // 2. Email Trigger (Opens default Mail app)
        setTimeout(() => {
            window.location.href = `mailto:vikash07052008@gmail.com?subject=${encodedSubject}&body=${encodedBody}`;
        }, 500);

        // 3. SMS Trigger (Opens default Messages app)
        setTimeout(() => {
            window.location.href = `sms:+919342877474?body=${encodedBody}`;
        }, 1000);

        // Show Success State on Button
        form.reset();
        submitBtn.textContent = 'Apps Launched!';
        addMessage("Awesome! I'm launching WhatsApp, SMS, and your Email app so you can send your message directly to Vikash! 🚀", 'bot', false);

        // Reset Button after a few seconds
        setTimeout(() => {
            submitBtn.textContent = 'Send Message';
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
  function addMessage(content, role, animate = false) {
    const wrap = document.createElement('div');
    wrap.className = `chat-msg ${role}`;

    const wrapper = document.createElement('div');
    wrapper.className = 'msg-wrapper';

    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';

    wrapper.appendChild(bubble);
    wrap.appendChild(wrapper);
    messagesEl.appendChild(wrap);

    if (role === 'bot') {
      // Add sound text-to-speech button under bubble
      const soundBtn = document.createElement('button');
      soundBtn.className = 'chat-sound-btn';
      soundBtn.innerHTML = '<i class="fas fa-volume-up"></i> Speak';
      soundBtn.addEventListener('click', () => speakMessage(content, soundBtn));
      wrapper.appendChild(soundBtn);
    }

    if (animate) {
      let i = 0;
      const interval = setInterval(() => {
        bubble.textContent += content[i];
        i++;
        messagesEl.scrollTop = messagesEl.scrollHeight;
        if (i >= content.length) {
          clearInterval(interval);
          // Check and append rich interactive cards / form if applicable
          const card = getRichCardElement(content);
          if (card) {
            wrapper.appendChild(card);
            messagesEl.scrollTop = messagesEl.scrollHeight;
          }
        }
      }, 15);
    } else {
      bubble.textContent = content;
      // Append rich cards immediately for loaded history
      const card = getRichCardElement(content);
      if (card) {
        wrapper.appendChild(card);
      }
    }

    messagesEl.scrollTop = messagesEl.scrollHeight;
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

  /* ═══════════════════════════════════════════
     API BRIDGE CALL WITH MULTI-TURN MEMORY
     ═══════════════════════════════════════════ */
  async function callBridge() {
    const relevantHistory = conversationHistory.slice(-10);

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...relevantHistory
    ];

    const body = { model: XAI_MODEL, input: messages };

    let url = API_URL;
    if (window.location.protocol === 'file:' ||
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1') {
      url = LOCAL_API_URL;
    } else if (window.location.hostname.includes('github.io')) {
      url = VERCEL_URL + API_URL;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error('Bridge error');
    const data = await res.json();
    return data.message?.content ||
           data.choices?.[0]?.message?.content ||
           data.response ||
           data.message ||
           "I'm not sure how to answer that.";
  }

})();
