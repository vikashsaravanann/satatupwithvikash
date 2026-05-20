/**
 * VIKASH PORTFOLIO — AI CHATBOT (UPGRADED)
 * ✅ Conversation Memory (multi-turn context)
 * ✅ Quick-Action Chips
 * ✅ Enriched System Prompt with latest 15 certs
 * ✅ Smooth streaming-style reply animation
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
     CONVERSATION HISTORY (MEMORY)
     ═══════════════════════════════════════════ */
  const conversationHistory = [];

  /* ═══════════════════════════════════════════
     DOM ELEMENTS
     ═══════════════════════════════════════════ */
  const toggle   = document.getElementById('ai-chat-toggle');
  const panel    = document.getElementById('ai-chat-panel');
  const closeBtn = document.getElementById('ai-chat-close');
  const messagesEl = document.getElementById('chatMessages');
  const inputEl  = document.getElementById('chatInput');
  const sendBtn  = document.getElementById('chatSend');
  const chipsEl  = document.getElementById('chatChips');

  if (!toggle || !panel) return;

  let greetingSent = false;

  /* ═══════════════════════════════════════════
     TOGGLE PANEL OPEN/CLOSE
     ═══════════════════════════════════════════ */
  toggle.addEventListener('click', () => {
    panel.classList.toggle('open');
    if (panel.classList.contains('open')) {
      setTimeout(() => inputEl.focus(), 300);
      if (!greetingSent) {
        setTimeout(() => {
          addMessage("Hey there! 👋 I'm Vikash's AI assistant. I know everything about his skills, projects, and 15 certifications. What would you like to know?", 'bot');
          greetingSent = true;
        }, 500);
      }
    }
  });

  closeBtn.addEventListener('click', () => panel.classList.remove('open'));

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
     SEND MESSAGE
     ═══════════════════════════════════════════ */
  sendBtn.addEventListener('click', () => triggerSend(inputEl.value));
  inputEl.addEventListener('keydown', e => { if (e.key === 'Enter') triggerSend(inputEl.value); });

  function triggerSend(text) {
    text = text.trim();
    if (!text) return;
    inputEl.value = '';
    inputEl.disabled = true;
    sendBtn.disabled = true;

    addMessage(text, 'user');

    // Hide chips after first interaction
    if (chipsEl) chipsEl.style.display = 'none';

    // Add to conversation history
    conversationHistory.push({ role: 'user', content: text });

    // Show typing indicator
    const typingEl = addTyping();

    callBridge().then(reply => {
      typingEl.remove();
      // Animate the reply character-by-character
      addAnimatedMessage(reply, 'bot');
      // Add reply to memory
      conversationHistory.push({ role: 'assistant', content: reply });
    }).catch(() => {
      typingEl.remove();
      addMessage("Sorry, I'm having trouble connecting right now. Reach Vikash directly at vikash07052008@gmail.com 📧", 'bot');
    }).finally(() => {
      inputEl.disabled = false;
      sendBtn.disabled = false;
      inputEl.focus();
    });
  }

  /* ═══════════════════════════════════════════
     ADD MESSAGE HELPERS
     ═══════════════════════════════════════════ */
  function addMessage(content, role) {
    const wrap = document.createElement('div');
    wrap.className = `chat-msg ${role}`;
    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';
    bubble.textContent = content;
    wrap.appendChild(bubble);
    messagesEl.appendChild(wrap);
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

  function addAnimatedMessage(content, role) {
    const wrap = document.createElement('div');
    wrap.className = `chat-msg ${role}`;
    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';
    wrap.appendChild(bubble);
    messagesEl.appendChild(wrap);

    let i = 0;
    const interval = setInterval(() => {
      bubble.textContent += content[i];
      i++;
      messagesEl.scrollTop = messagesEl.scrollHeight;
      if (i >= content.length) clearInterval(interval);
    }, 18);
    return wrap;
  }

  /* ═══════════════════════════════════════════
     API CALL WITH CONVERSATION MEMORY
     ═══════════════════════════════════════════ */
  async function callBridge() {
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...conversationHistory
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
