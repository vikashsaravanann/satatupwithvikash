const cors = require('cors');
const express = require('express');
const fetch = require('node-fetch');
const helmet = require('helmet');

const { processContactSubmission } = require('./lib/contact-delivery');
const {
    applySecurityHeaders,
    getAllowedOrigins,
    getClientIp,
    isBodyTooLarge,
    parsePositiveInt
} = require('./lib/http-utils');
const { createRateLimiter, setRateLimitHeaders } = require('./lib/rate-limit');
const { recordEvent, getStats } = require('./lib/analytics-store');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const API_KEY = process.env.GROQ_API_KEY;
const API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

const JSON_BODY_LIMIT = parsePositiveInt(process.env.JSON_BODY_LIMIT_BYTES, 64 * 1024);
const CHAT_BODY_MAX_BYTES = parsePositiveInt(process.env.CHAT_BODY_MAX_BYTES, 32 * 1024);

const chatLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    max: 20
});

function rateLimitMiddleware(limiter, namespace) {
    return (req, res, next) => {
        const ip = getClientIp(req);
        const rateState = limiter.check(`${namespace}:${ip}`);
        setRateLimitHeaders(res, rateState);
        if (!rateState.allowed) {
            res.status(429).json({ error: 'Too many requests.' });
            return;
        }
        next();
    };
}

app.use((req, res, next) => {
    applySecurityHeaders(res);
    next();
});
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: JSON_BODY_LIMIT }));

app.get('/api/chat', (req, res) => {
    res.json({ status: 'Bridge server (Groq) is running', apiKeySet: !!API_KEY });
});

app.post('/api/chat', rateLimitMiddleware(chatLimiter, 'chat'), async (req, res) => {
    if (!API_KEY) {
        res.status(500).json({ error: 'GROQ_API_KEY is missing' });
        return;
    }

    let messages = req.body.messages || req.body.input;
    if (typeof messages === 'string') {
        messages = [{ role: 'user', content: messages }];
    }

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: req.body.model || DEFAULT_MODEL,
                messages,
                stream: false
            })
        });

        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/contact', async (req, res) => {
    const result = await processContactSubmission(req.body);
    res.status(result.status).json(result.response);
});

app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
