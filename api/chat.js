const fetch = require('node-fetch');

const { applyCors, applySecurityHeaders, getAllowedOrigins, getClientIp, isBodyTooLarge, parsePositiveInt } = require('../lib/http-utils');
const { createRateLimiter, setRateLimitHeaders } = require('../lib/rate-limit');

const CHAT_RATE_LIMIT_WINDOW_MS = parsePositiveInt(process.env.CHAT_RATE_LIMIT_WINDOW_MS, 60 * 1000);
const CHAT_RATE_LIMIT_MAX = parsePositiveInt(process.env.CHAT_RATE_LIMIT_MAX, 20);
const CHAT_BODY_MAX_BYTES = parsePositiveInt(process.env.CHAT_BODY_MAX_BYTES, 32 * 1024);
const MAX_MESSAGE_CHARS = parsePositiveInt(process.env.CHAT_MESSAGE_MAX_CHARS, 4000);

const XAI_API_KEY = process.env.XAI_API_KEY;
const DEFAULT_MODEL = 'grok-2-1212';
const ALLOWED_ROLES = new Set(['system', 'user', 'assistant']);


const chatLimiter = createRateLimiter({
    windowMs: CHAT_RATE_LIMIT_WINDOW_MS,
    max: CHAT_RATE_LIMIT_MAX
});

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
    }
    return { ok: true };
}

module.exports = async function handler(req, res) {
    applySecurityHeaders(res);
    const allowed = applyCors(req, res, {
        methods: 'GET,POST,OPTIONS',
        allowedOrigins: getAllowedOrigins()
    });

    if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
    }

    if (req.method === 'GET') {
        res.status(200).json({
            status: 'Vercel AI Bridge is running',
            apiKeySet: !!XAI_API_KEY,
            corsAllowed: allowed,
            origin: req.headers.origin || 'unknown'
        });
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    if (!allowed) {
        res.status(403).json({ error: 'Origin not allowed by CORS', origin: req.headers.origin });
        return;
    }

    const ip = getClientIp(req);
    const rateState = chatLimiter.check(`chat:${ip}`);
    setRateLimitHeaders(res, rateState);

    if (!rateState.allowed) {
        res.status(429).json({ error: 'Too many chat requests. Please try again later.' });
        return;
    }

    if (!XAI_API_KEY) {
        res.status(500).json({ error: 'XAI_API_KEY is missing on server. Please add it to environment variables.' });
        return;
    }

    let messages = req.body.messages || req.body.input;
    if (typeof messages === 'string') {
        messages = [{ role: 'user', content: messages }];
    }

    const validation = validateMessages(messages);
    if (!validation.ok) {
        res.status(400).json({ error: validation.error });
        return;
    }

    try {
        const response = await fetch('https://api.x.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${XAI_API_KEY}`
            },
            body: JSON.stringify({
                model: DEFAULT_MODEL,
                messages,
                stream: false
            })
        });

        const data = await response.json().catch(() => ({}));
        
        if (!response.ok) {
            console.error('xAI API Error:', data);
            res.status(response.status).json({ 
                error: data.error?.message || 'Upstream API error', 
                status: response.status 
            });
            return;
        }

        res.status(200).json(data);
    } catch (error) {
        console.error('Vercel chat route error:', error);
        res.status(500).json({ error: 'Internal Server Error: ' + error.message });
    }
};
