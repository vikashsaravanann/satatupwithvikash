
const express = require('express');
const cors = require('cors');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const API_KEY = process.env.GROQ_API_KEY;
const API_URL = 'https://api.groq.com/openai/v1/chat/completions';

if (!API_KEY) {
  console.warn('⚠️ WARNING: GROQ_API_KEY is not set in .env file!');
}

// Status check for chatbot API
app.get('/api/chat', (req, res) => {
  res.json({ 
    status: 'Bridge server (Groq) is running', 
    apiKeySet: !!API_KEY,
    usage: 'Send a POST request to this endpoint with { messages, model }'
  });
});

// Endpoint to handle contact form submissions
app.post('/api/contact', async (req, res) => {
  console.log('Incoming contact submission:', req.body);
  const { name, email, subject, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }

  const emailSubject = subject || `Contact Form Submission from ${name}`;
  let sent = false;
  const deliveryErrors = {};

  // 1. DISCORD WEBHOOK INTEGRATION
  if (process.env.DISCORD_WEBHOOK_URL) {
    try {
      const response = await fetch(process.env.DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [{
            title: `New Message from ${name}`,
            color: 14210087, // Blue Accent color
            fields: [
              { name: 'Sender Name', value: name, inline: true },
              { name: 'Sender Email', value: email, inline: true },
              { name: 'Subject', value: emailSubject },
              { name: 'Message', value: message }
            ],
            timestamp: new Date().toISOString()
          }]
        })
      });
      if (response.ok) sent = true;
      else deliveryErrors.discord = `Discord Webhook returned status ${response.status}`;
    } catch (e) {
      deliveryErrors.discord = e.message;
    }
  }

  // 2. TELEGRAM BOT INTEGRATION
  if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
    try {
      const formattedMessage = `<b>📩 New Contact Message</b>\n\n<b>Name:</b> ${name}\n<b>Email:</b> ${email}\n<b>Subject:</b> ${emailSubject}\n\n<b>Message:</b>\n${message}`;
      const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: process.env.TELEGRAM_CHAT_ID,
          text: formattedMessage,
          parse_mode: 'HTML'
        })
      });
      if (response.ok) sent = true;
      else deliveryErrors.telegram = `Telegram API returned status ${response.status}`;
    } catch (e) {
      deliveryErrors.telegram = e.message;
    }
  }

  // 3. SMTP NODEMAILER EMAIL INTEGRATION
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465', // true for 465, false for others
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const receiver = process.env.CONTACT_RECEIVER_EMAIL || 'vikash07052008@gmail.com';

      await transporter.sendMail({
        from: `"${name}" <${process.env.SMTP_USER}>`,
        to: receiver,
        replyTo: email,
        subject: emailSubject,
        text: `New Contact Message from:\nName: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
        html: `<div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #0ea5e9; margin-top: 0;">New Contact Form Message</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          <p><strong>Subject:</strong> ${emailSubject}</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="white-space: pre-wrap; line-height: 1.6;">${message}</p>
        </div>`
      });

      sent = true;
    } catch (e) {
      deliveryErrors.email = e.message;
    }
  }

  // 4. ZERO-CONFIG FALLBACK ROUTING (FormSubmit.co AJAX API)
  // If no Telegram bot, Discord Webhook, or SMTP keys are set, this delivers messages
  // directly to your default inbox for free without requiring signup or authentication.
  if (!sent) {
    try {
      const receiver = process.env.CONTACT_RECEIVER_EMAIL || 'vikash07052008@gmail.com';
      const response = await fetch(`https://formsubmit.co/ajax/${receiver}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: name,
          email: email,
          subject: emailSubject,
          message: message
        })
      });
      
      const resData = await response.json();
      if (response.ok && (resData.success === 'true' || resData.success === true)) {
        sent = true;
      } else {
        deliveryErrors.fallback = resData.message || `FormSubmit API returned status ${response.status}`;
      }
    } catch (e) {
      deliveryErrors.fallback = e.message;
    }
  }

  if (sent) {
    return res.status(200).json({ success: true, message: 'Message sent successfully!' });
  } else {
    return res.status(500).json({
      success: false,
      error: 'Failed to deliver message via all configured channels.',
      details: deliveryErrors
    });
  }
});

app.post('/api/chat', async (req, res) => {
  console.log('Incoming request body:', JSON.stringify(req.body, null, 2));
  if (!API_KEY) {
    return res.status(500).json({ error: 'GROQ_API_KEY is missing on server' });
  }
  
  // Handle both 'messages' (new) and 'input' (old) formats
  let messages = req.body.messages;
  if (!messages && req.body.input) {
    messages = Array.isArray(req.body.input) ? req.body.input : [{ role: 'user', content: req.body.input }];
  }

  if (!messages || messages.length === 0) {
     return res.status(400).json({ error: 'Messages array is required and cannot be empty' });
  }

  const model = req.body.model;
  // Force a Groq-compatible model (ignore old grok-4.20-reasoning from cached clients)
  const groqModel = (model && model.includes('llama')) ? model : 'llama-3.3-70b-versatile';

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: groqModel, 
        messages: messages,
        stream: false
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Groq API Error:', data);
      return res.status(response.status).json(data);
    }
    res.json(data);
  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Bridge server running at http://localhost:${PORT}`);
  console.log(`📡 Status check: http://localhost:${PORT}/api/chat`);
});
