
const express = require('express');
const cors = require('cors');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
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

// Simple status check
app.get('/api/chat', (req, res) => {
  res.json({ 
    status: 'Bridge server (Groq) is running', 
    apiKeySet: !!API_KEY,
    usage: 'Send a POST request to this endpoint with { messages, model }'
  });
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

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: model || 'llama-3.3-70b-versatile', 
        messages: messages || [],
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
