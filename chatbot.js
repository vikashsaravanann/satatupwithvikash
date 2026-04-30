/**
 * VIKASH PORTFOLIO — AI CHATBOT + VISITOR COUNTER
 * Powered by Google Gemini API
 */

(function () {
  'use strict';

  /* ═══════════════════════════════════════════
     CONFIGURATION
     ═══════════════════════════════════════════ */
  const XAI_MODEL = 'grok-4.20-reasoning';
  // Point to our new bridge server (works for local node or Vercel /api/chat)
  const API_URL = '/api/chat'; 
  
  // For local testing without Vercel, use: http://localhost:3000/api/chat
  const LOCAL_API_URL = 'http://localhost:3000/api/chat';

  const SYSTEM_PROMPT = `You are Vikash's AI portfolio assistant. Answer questions about Vikash Saravanan in a friendly, professional tone. Keep replies concise (2-4 sentences max). Use emojis sparingly.

VIKASH SARAVANAN — PROFILE:
• B.Tech AI & Data Science, 1st Year, Rathinam Technical Campus, Coimbatore (2025-2029)
• Native: Karur, Tamil Nadu, India
• Email: vikash07052008@gmail.com | Phone: +91 9342877474
• LinkedIn: linkedin.com/in/vikash-saravanan-j7528
• GitHub: github.com/vikashsaravanann
• Instagram: @startupwithvikash

SKILLS:
• Languages: Python, JavaScript, SQL, HTML/CSS
• Frameworks: React, Next.js, Node.js, Flask
• AI/ML: PyTorch, TensorFlow, Computer Vision, NLP, LLMs
• Automation: n8n (workflow automation), web scraping
• DevOps: Docker, Git, GitHub Pages
• Data: Pandas, NumPy, Matplotlib, Power BI

PROJECTS:
• HearWise — Production-ready hearing assistance app using AI for real-time audio processing
• AI Automation Systems — Enterprise-grade n8n workflow automations
• Portfolio Website — This site, built with vanilla HTML/CSS/JS with 30+ custom animations

ACHIEVEMENTS:
• Hackathon Finalist — Meta PyTorch (OpenEnv)
• 9+ Professional Certifications (Google, Microsoft, IBM, Coursera)
• 3+ Live Production Architectures
• 5000+ Lines of Code written

AVAILABILITY:
• Open for Remote & Coimbatore-based internships
• Interested in: Data Analysis, AI Engineering, Full-Stack Development, Automation
• Currently building: Autonomous AI agents and scalable data pipelines

If asked something unrelated to Vikash, politely redirect: "I'm here to help you learn about Vikash! Try asking about his skills, projects, or how to hire him."`;

  /* ═══════════════════════════════════════════
     CHAT WIDGET LOGIC
     ═══════════════════════════════════════════ */
  const toggle = document.getElementById('ai-chat-toggle');
  const panel = document.getElementById('ai-chat-panel');
  const closeBtn = document.getElementById('ai-chat-close');
  const messagesEl = document.getElementById('chatMessages');
  const inputEl = document.getElementById('chatInput');
  const sendBtn = document.getElementById('chatSend');

  if (!toggle || !panel) return;

  // Toggle panel
  toggle.addEventListener('click', () => {
    panel.classList.toggle('open');
    if (panel.classList.contains('open')) {
      setTimeout(() => inputEl.focus(), 300);
    }
  });

  closeBtn.addEventListener('click', () => panel.classList.remove('open'));

  // Send message
  function sendMessage() {
    const text = inputEl.value.trim();
    if (!text) return;
    addMessage(text, 'user');
    inputEl.value = '';
    inputEl.disabled = true;
    sendBtn.disabled = true;

    // Show typing indicator
    const typingEl = addMessage('<span class="typing-dots-chat"><span></span><span></span><span></span></span>', 'bot', true);

    callBridge(text).then(reply => {
      typingEl.remove();
      addMessage(reply, 'bot');
    }).catch(err => {
      console.error('Bridge Error:', err);
      typingEl.remove();
      addMessage("Sorry, I couldn't connect right now. You can reach Vikash directly at vikash07052008@gmail.com 📧", 'bot');
    }).finally(() => {
      inputEl.disabled = false;
      sendBtn.disabled = false;
      inputEl.focus();
    });
  }

  sendBtn.addEventListener('click', sendMessage);
  inputEl.addEventListener('keydown', e => {
    if (e.key === 'Enter') sendMessage();
  });

  function addMessage(content, role, isHTML = false) {
    const wrap = document.createElement('div');
    wrap.className = `chat-msg ${role}`;
    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';
    if (isHTML) bubble.innerHTML = content;
    else bubble.textContent = content;
    wrap.appendChild(bubble);
    messagesEl.appendChild(wrap);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return wrap;
  }

  async function callBridge(userMessage) {
    const body = {
      model: XAI_MODEL,
      input: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage }
      ]
    };

    // Try relative URL first (Vercel), then local fallback
    let url = API_URL;
    if (window.location.protocol === 'file:') {
        url = LOCAL_API_URL;
    }

    try {
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
    } catch (err) {
      console.warn('Primary API failed, trying fallback...');
      if (url !== LOCAL_API_URL) {
          const fallbackRes = await fetch(LOCAL_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });
          const fallbackData = await fallbackRes.json();
          return fallbackData.message?.content || fallbackData.response || fallbackData.message;
      }
      throw err;
    }
  }


  /* ═══════════════════════════════════════════
     END
     ═══════════════════════════════════════════ */

})();
