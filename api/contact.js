const { processContactSubmission } = require('../lib/contact-delivery');
const { applyCors, applySecurityHeaders, getAllowedOrigins, getClientIp, isBodyTooLarge, parsePositiveInt } = require('../lib/http-utils');
const { createRateLimiter, setRateLimitHeaders } = require('../lib/rate-limit');

const CONTACT_RATE_LIMIT_WINDOW_MS = parsePositiveInt(
    process.env.CONTACT_RATE_LIMIT_WINDOW_MS,
    15 * 60 * 1000
);
const CONTACT_RATE_LIMIT_MAX = parsePositiveInt(process.env.CONTACT_RATE_LIMIT_MAX, 8);
const CONTACT_BODY_MAX_BYTES = parsePositiveInt(process.env.CONTACT_BODY_MAX_BYTES, 24 * 1024);

const contactLimiter = createRateLimiter({
    windowMs: CONTACT_RATE_LIMIT_WINDOW_MS,
    max: CONTACT_RATE_LIMIT_MAX
});

module.exports = async function handler(req, res) {
    applySecurityHeaders(res);
    const allowed = applyCors(req, res, {
        methods: 'POST,OPTIONS',
        allowedOrigins: getAllowedOrigins()
    });

    if (req.headers.origin && !allowed) {
        res.status(403).json({
            success: false,
            error: 'Origin is not allowed by CORS policy.'
        });
        return;
    }

    if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    if (isBodyTooLarge(req.body, CONTACT_BODY_MAX_BYTES)) {
        res.status(413).json({
            success: false,
            error: 'Contact payload is too large.'
        });
        return;
    }

    const ip = getClientIp(req);
    const rateState = contactLimiter.check(`contact:${ip}`);
    setRateLimitHeaders(res, rateState);

    if (!rateState.allowed) {
        res.status(429).json({
            success: false,
            error: 'Too many contact requests. Please try again later.'
        });
        return;
    }

    try {
        const result = await processContactSubmission(req.body);
        res.status(result.status).json(result.response);
    } catch (error) {
        console.error('Vercel contact route error:', error);
        res.status(500).json({
            success: false,
            error: 'Unexpected contact delivery error.'
        });
    }
};
