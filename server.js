
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
  if (!API_KEY) {
    return res.status(500).json({ error: 'GROQ_API_KEY is missing on server' });
  }
  const { messages, model } = req.body;

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
