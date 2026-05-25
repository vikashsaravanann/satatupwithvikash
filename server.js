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

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const API_KEY = process.env.GROQ_API_KEY;
const API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const JSON_BODY_LIMIT = parsePositiveInt(process.env.JSON_BODY_LIMIT_BYTES, 64 * 1024);
const CONTACT_BODY_MAX_BYTES = parsePositiveInt(process.env.CONTACT_BODY_MAX_BYTES, 24 * 1024);
const CHAT_BODY_MAX_BYTES = parsePositiveInt(process.env.CHAT_BODY_MAX_BYTES, 32 * 1024);

const CONTACT_RATE_LIMIT_WINDOW_MS = parsePositiveInt(
    process.env.CONTACT_RATE_LIMIT_WINDOW_MS,
    15 * 60 * 1000
);
const CONTACT_RATE_LIMIT_MAX = parsePositiveInt(process.env.CONTACT_RATE_LIMIT_MAX, 8);
const CHAT_RATE_LIMIT_WINDOW_MS = parsePositiveInt(process.env.CHAT_RATE_LIMIT_WINDOW_MS, 60 * 1000);
const CHAT_RATE_LIMIT_MAX = parsePositiveInt(process.env.CHAT_RATE_LIMIT_MAX, 20);

const allowedOrigins = getAllowedOrigins();
const allowAnyOrigin = allowedOrigins.has('*');

const corsOptions = {
    origin(origin, callback) {
        if (!origin || allowAnyOrigin || allowedOrigins.has(origin)) {
            callback(null, true);
            return;
        }
        callback(null, false);
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};

const contactLimiter = createRateLimiter({
    windowMs: CONTACT_RATE_LIMIT_WINDOW_MS,
    max: CONTACT_RATE_LIMIT_MAX
});
const chatLimiter = createRateLimiter({
    windowMs: CHAT_RATE_LIMIT_WINDOW_MS,
    max: CHAT_RATE_LIMIT_MAX
});

function rateLimitMiddleware(limiter, namespace) {
    return (req, res, next) => {
        const ip = getClientIp(req);
        const rateState = limiter.check(`${namespace}:${ip}`);
        setRateLimitHeaders(res, rateState);

        if (!rateState.allowed) {
            res.status(429).json({
                success: false,
                error: 'Too many requests. Please try again later.'
            });
            return;
        }

        next();
    };
}

app.use((req, res, next) => {
    applySecurityHeaders(res);
    next();
});
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));
app.use(cors(corsOptions));
app.use(express.json({ limit: JSON_BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: JSON_BODY_LIMIT }));

if (!API_KEY) {
    console.warn('⚠️ WARNING: GROQ_API_KEY is not set in .env file!');
}

app.get('/api/chat', (req, res) => {
    res.json({
        status: 'Bridge server (Groq) is running',
        apiKeySet: !!API_KEY,
        usage: 'Send a POST request with { messages, model }'
    });
});

app.post('/api/contact', rateLimitMiddleware(contactLimiter, 'contact'), async (req, res) => {
    if (isBodyTooLarge(req.body, CONTACT_BODY_MAX_BYTES)) {
        res.status(413).json({
            success: false,
            error: 'Contact payload is too large.'
        });
        return;
    }

    try {
        const result = await processContactSubmission(req.body);
        res.status(result.status).json(result.response);
    } catch (error) {
        console.error('Contact route error:', error);
        res.status(500).json({
            success: false,
            error: 'Unexpected contact delivery error.'
        });
    }
});

app.post('/api/chat', rateLimitMiddleware(chatLimiter, 'chat'), async (req, res) => {
    if (!API_KEY) {
        res.status(500).json({ error: 'GROQ_API_KEY is missing on server' });
        return;
    }

    if (isBodyTooLarge(req.body, CHAT_BODY_MAX_BYTES)) {
        res.status(413).json({
            error: 'Chat payload is too large.'
        });
        return;
    }

    let messages = req.body.messages;
    if (!messages && req.body.input) {
        messages = Array.isArray(req.body.input)
            ? req.body.input
            : [{ role: 'user', content: req.body.input }];
    }

    if (!Array.isArray(messages) || messages.length === 0) {
        res.status(400).json({ error: 'Messages array is required and cannot be empty.' });
        return;
    }

    const model = req.body.model;
    const groqModel = typeof model === 'string' && model.includes('llama')
        ? model
        : 'llama-3.3-70b-versatile';

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: groqModel,
                messages,
                stream: false
            })
        });

        const data = await response.json();
        if (!response.ok) {
            console.error('Groq API Error:', data);
            res.status(response.status).json(data);
            return;
        }

        res.json(data);
    } catch (error) {
        console.error('Chat route error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Bridge server running at http://localhost:${PORT}`);
    console.log(`📡 Status check: http://localhost:${PORT}/api/chat`);
});
