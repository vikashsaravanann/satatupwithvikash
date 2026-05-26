const fetch = require('node-fetch');

const { applyCors, applySecurityHeaders, getAllowedOrigins, getClientIp, isBodyTooLarge, parsePositiveInt } = require('../lib/http-utils');
const { createRateLimiter, setRateLimitHeaders } = require('../lib/rate-limit');

const CHAT_RATE_LIMIT_WINDOW_MS = parsePositiveInt(process.env.CHAT_RATE_LIMIT_WINDOW_MS, 60 * 1000);
const CHAT_RATE_LIMIT_MAX = parsePositiveInt(process.env.CHAT_RATE_LIMIT_MAX, 20);
const CHAT_BODY_MAX_BYTES = parsePositiveInt(process.env.CHAT_BODY_MAX_BYTES, 32 * 1024);
const MAX_MESSAGE_CHARS = parsePositiveInt(process.env.CHAT_MESSAGE_MAX_CHARS, 4000);

const XAI_API_KEY = process.env.XAI_API_KEY;
const DEFAULT_MODEL = 'grok-beta';
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
        if (message.content.length > MAX_MESSAGE_CHARS) {
            return { ok: false, error: `Message content exceeds ${MAX_MESSAGE_CHARS} characters.` };
        }
        if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(message.content)) {
            return { ok: false, error: 'Message content contains unsupported control characters.' };
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

    if (req.headers.origin && !allowed) {
        res.status(403).json({
            error: 'Origin is not allowed by CORS policy.'
        });
        return;
    }

    if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
    }

    if (req.method === 'GET') {
        res.status(200).json({
            status: 'Vercel AI Bridge is running',
            apiKeySet: !!XAI_API_KEY
        });
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    if (isBodyTooLarge(req.body, CHAT_BODY_MAX_BYTES)) {
        res.status(413).json({
            error: 'Chat payload is too large.'
        });
        return;
    }

    const ip = getClientIp(req);
    const rateState = chatLimiter.check(`chat:${ip}`);
    setRateLimitHeaders(res, rateState);

    if (!rateState.allowed) {
        res.status(429).json({
            error: 'Too many chat requests. Please try again later.'
        });
        return;
    }

    if (!XAI_API_KEY) {
        res.status(500).json({ error: 'XAI_API_KEY is missing on server' });
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

    const wantsStream = req.body.stream === true;

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
                stream: wantsStream
            })
        });

        res.setHeader('x-model-used', DEFAULT_MODEL);

        if (!response.ok) {
            const data = await response.json().catch(() => ({ error: 'Upstream error' }));
            console.error('xAI API Error:', data);
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
                console.error('xAI stream error:', error);
                res.end();
            });
            res.on('close', () => {
                response.body.destroy();
            });
            response.body.pipe(res);
            return;
        }

        const data = await response.json();
        data.model_used = DEFAULT_MODEL;
        res.status(200).json(data);
    } catch (error) {
        console.error('Vercel chat route error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
