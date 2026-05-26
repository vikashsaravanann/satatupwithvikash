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
const ALLOWED_ROLES = new Set(['system', 'user', 'assistant']);
const ALLOWED_MODELS = new Set([
    'llama-3.3-70b-versatile',
    'llama-3.1-70b-versatile',
    'llama-3.1-8b-instant',
    'llama-3.2-90b-vision-preview',
    'llama-3.2-11b-vision-preview',
    'llama-3.2-3b-preview',
    'llama-3.2-1b-preview',
    'mixtral-8x7b-32768',
    'gemma2-9b-it',
    'gemma2-27b-it',
    'deepseek-r1-distill-llama-70b'
]);

const JSON_BODY_LIMIT = parsePositiveInt(process.env.JSON_BODY_LIMIT_BYTES, 64 * 1024);
const CONTACT_BODY_MAX_BYTES = parsePositiveInt(process.env.CONTACT_BODY_MAX_BYTES, 24 * 1024);
const CHAT_BODY_MAX_BYTES = parsePositiveInt(process.env.CHAT_BODY_MAX_BYTES, 32 * 1024);
const ANALYTICS_BODY_MAX_BYTES = parsePositiveInt(process.env.ANALYTICS_BODY_MAX_BYTES, 8 * 1024);
const MAX_MESSAGE_CHARS = parsePositiveInt(process.env.CHAT_MESSAGE_MAX_CHARS, 4000);

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
    exposedHeaders: ['x-model-used', 'x-fallback-used'],
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

function validateMessages(messages) {
    if (!Array.isArray(messages) || messages.length === 0) {
        return { ok: false, error: 'Messages array is required and cannot be empty.' };
    }

    for (const message of messages) {
        if (!message || typeof message !== 'object') {
            return { ok: false, error: 'Each message must be an object.' };
        }
        if (!ALLOWED_ROLES.has(message.role)) {
            return { ok: false, error: `Invalid message role: ${message.role}` };
        }
        if (typeof message.content !== 'string' || message.content.trim().length === 0) {
            return { ok: false, error: 'Each message must include non-empty content.' };
        }
        if (message.content.length > MAX_MESSAGE_CHARS) {
            return { ok: false, error: `Message content exceeds ${MAX_MESSAGE_CHARS} characters.` };
        }
        if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(message.content)) {
            return { ok: false, error: 'Message content contains unsupported control characters.' };
        }
    }

    return { ok: true };
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

app.get('/api/analytics', (req, res) => {
    res.status(200).json(getStats());
});

app.post('/api/analytics', (req, res) => {
    if (isBodyTooLarge(req.body, ANALYTICS_BODY_MAX_BYTES)) {
        res.status(413).json({
            error: 'Analytics payload is too large.'
        });
        return;
    }

    const result = recordEvent(req.body);
    if (!result.ok) {
        res.status(400).json({ error: result.error });
        return;
    }

    res.status(202).json({ success: true });
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
        if (result && result.status >= 200 && result.status < 300 && result.response?.success) {
            recordEvent({ type: 'contact_conversion' });
        }
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

    const validation = validateMessages(messages);
    if (!validation.ok) {
        res.status(400).json({ error: validation.error });
        return;
    }

    const model = req.body.model;
    let groqModel = typeof model === 'string' && ALLOWED_MODELS.has(model)
        ? model
        : DEFAULT_MODEL;
    const wantsStream = req.body.stream === true;
    let fallbackUsed = false;

    try {
        const requestGroq = (modelToUse) => fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: modelToUse,
                messages,
                stream: wantsStream
            })
        });

        let response = await requestGroq(groqModel);
        if (!response.ok && groqModel !== DEFAULT_MODEL) {
            fallbackUsed = true;
            groqModel = DEFAULT_MODEL;
            response = await requestGroq(groqModel);
        }

        res.setHeader('x-model-used', groqModel);
        res.setHeader('x-fallback-used', fallbackUsed ? 'true' : 'false');

        if (!response.ok) {
            const data = await response.json().catch(() => ({ error: 'Upstream error' }));
            console.error('Groq API Error:', data);
            res.status(response.status).json(data);
            return;
        }

        if (wantsStream) {
            res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
            res.setHeader('Cache-Control', 'no-cache, no-transform');
            res.setHeader('Connection', 'keep-alive');
            if (typeof res.flushHeaders === 'function') {
                res.flushHeaders();
            }
            if (!response.body) {
                res.status(502).json({ error: 'Upstream stream unavailable.' });
                return;
            }
            response.body.on('error', (error) => {
                console.error('Groq stream error:', error);
                res.end();
            });
            res.on('close', () => {
                response.body.destroy();
            });
            response.body.pipe(res);
            return;
        }

        const data = await response.json();
        data.model_used = groqModel;
        data.fallbackUsed = fallbackUsed;
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
