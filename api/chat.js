
export default async function handler(req, res) {
  // 1. Enable CORS for local development
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    return res.status(200).json({ 
      status: 'Vercel AI Bridge is running', 
      apiKeySet: !!process.env.GROQ_API_KEY 
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let messages = req.body.messages;
  if (!messages && req.body.input) {
    messages = Array.isArray(req.body.input) ? req.body.input : [{ role: 'user', content: req.body.input }];
  }

  if (!messages || messages.length === 0) {
    return res.status(400).json({ error: 'Messages array is required' });
  }

  // Force a Groq-compatible model
  const groqModel = (model && model.includes('llama')) ? model : 'llama-3.3-70b-versatile';

  const API_KEY = process.env.GROQ_API_KEY;
  const API_URL = 'https://api.groq.com/openai/v1/chat/completions';

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

    if (!response.ok) {
      const errorText = await response.text();
      console.error('XAI API Error:', errorText);
      return res.status(response.status).json({ error: 'XAI API Error', details: errorText });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
