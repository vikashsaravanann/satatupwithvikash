const fetch = require('node-fetch');

const { applyCors, applySecurityHeaders, getAllowedOrigins, getClientIp, isBodyTooLarge, parsePositiveInt } = require('../lib/http-utils');
const { createRateLimiter, setRateLimitHeaders } = require('../lib/rate-limit');

const CHAT_RATE_LIMIT_WINDOW_MS = parsePositiveInt(process.env.CHAT_RATE_LIMIT_WINDOW_MS, 60 * 1000);
const CHAT_RATE_LIMIT_MAX = parsePositiveInt(process.env.CHAT_RATE_LIMIT_MAX, 20);
const CHAT_BODY_MAX_BYTES = parsePositiveInt(process.env.CHAT_BODY_MAX_BYTES, 32 * 1024);

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

    if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
    }

    if (req.method === 'GET') {
        res.status(200).json({
            status: 'Vercel AI Bridge (Groq) is running',
            apiKeySet: !!process.env.GROQ_API_KEY
        });
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    if (isBodyTooLarge(req.body, CHAT_BODY_MAX_BYTES)) {
        res.status(413).json({ error: 'Chat payload is too large.' });
        return;
    }

    const ip = getClientIp(req);
    const rateState = chatLimiter.check(`chat:${ip}`);
    setRateLimitHeaders(res, rateState);

    if (!rateState.allowed) {
        res.status(429).json({ error: 'Too many chat requests.' });
        return;
    }

    const API_KEY = process.env.GROQ_API_KEY;
    if (!API_KEY) {
        res.status(500).json({ error: 'GROQ_API_KEY is missing on server' });
        return;
    }

    let messages = req.body.messages || req.body.input;
    if (typeof messages === 'string') {
        messages = [{ role: 'user', content: messages }];
    }

    const model = req.body.model || 'llama-3.3-70b-versatile';

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: model,
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

        res.status(200).json(data);
    } catch (error) {
        console.error('Vercel chat route error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
