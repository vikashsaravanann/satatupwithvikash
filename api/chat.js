const fetch = require('node-fetch');

const { applyCors, applySecurityHeaders, getAllowedOrigins, getClientIp, isBodyTooLarge, parsePositiveInt } = require('../lib/http-utils');
const { createRateLimiter, setRateLimitHeaders } = require('../lib/rate-limit');

const CHAT_RATE_LIMIT_WINDOW_MS = parsePositiveInt(process.env.CHAT_RATE_LIMIT_WINDOW_MS, 60 * 1000);
const CHAT_RATE_LIMIT_MAX = parsePositiveInt(process.env.CHAT_RATE_LIMIT_MAX, 20);
const CHAT_BODY_MAX_BYTES = parsePositiveInt(process.env.CHAT_BODY_MAX_BYTES, 32 * 1024);

const XAI_API_KEY = process.env.XAI_API_KEY;
const DEFAULT_MODEL = 'grok-2-1212';

const chatLimiter = createRateLimiter({
    windowMs: CHAT_RATE_LIMIT_WINDOW_MS,
    max: CHAT_RATE_LIMIT_MAX
});

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

    if (!Array.isArray(messages) || messages.length === 0) {
        res.status(400).json({ error: 'Messages array is required and cannot be empty.' });
        return;
    }

    const model = req.body.model || DEFAULT_MODEL;

    try {
        const response = await fetch('https://api.x.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${XAI_API_KEY}`
            },
            body: JSON.stringify({
                model: model,
                messages,
                stream: false
            })
        });

        const data = await response.json();
        if (!response.ok) {
            console.error('xAI API Error:', data);
            res.status(response.status).json(data);
            return;
        }

        res.status(200).json(data);
    } catch (error) {
        console.error('Vercel chat route error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
