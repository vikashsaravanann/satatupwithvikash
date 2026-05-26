const { applyCors, applySecurityHeaders, getAllowedOrigins, isBodyTooLarge, parsePositiveInt } = require('../lib/http-utils');
const { recordEvent, getStats } = require('../lib/analytics-store');

const ANALYTICS_BODY_MAX_BYTES = parsePositiveInt(process.env.ANALYTICS_BODY_MAX_BYTES, 8 * 1024);

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
        res.status(200).json(getStats());
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

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
};
