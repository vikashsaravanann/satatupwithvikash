const fetch = require('node-fetch');

const { applyCors, applySecurityHeaders, getAllowedOrigins, getClientIp, isBodyTooLarge, parsePositiveInt } = require('../lib/http-utils');
const { createRateLimiter, setRateLimitHeaders } = require('../lib/rate-limit');

const CHAT_RATE_LIMIT_WINDOW_MS = parsePositiveInt(process.env.CHAT_RATE_LIMIT_WINDOW_MS, 60 * 1000);
const CHAT_RATE_LIMIT_MAX = parsePositiveInt(process.env.CHAT_RATE_LIMIT_MAX, 20);
const CHAT_BODY_MAX_BYTES = parsePositiveInt(process.env.CHAT_BODY_MAX_BYTES, 32 * 1024);
const MAX_MESSAGE_CHARS = parsePositiveInt(process.env.CHAT_MESSAGE_MAX_CHARS, 4000);
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';
const ALLOWED_ROLES = new Set(['system', 'user', 'assistant']);
const SUPPORTED_MODELS = new Set([
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
            apiKeySet: !!process.env.GROQ_API_KEY
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

    const API_KEY = process.env.GROQ_API_KEY;
    if (!API_KEY) {
        res.status(500).json({ error: 'GROQ_API_KEY is missing on server' });
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
    let groqModel = typeof model === 'string' && SUPPORTED_MODELS.has(model)
        ? model
        : DEFAULT_MODEL;
    const wantsStream = req.body.stream === true;
    let fallbackUsed = false;

    try {
        const requestGroq = (modelToUse) => fetch('https://api.groq.com/openai/v1/chat/completions', {
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
        res.status(200).json(data);
    } catch (error) {
        console.error('Vercel chat route error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
