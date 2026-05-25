const DEFAULT_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'https://vikashsaravanann.github.io'
];

function parsePositiveInt(value, fallback) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getAllowedOrigins() {
    const envOrigins = (process.env.CORS_ORIGINS || '')
        .split(',')
        .map(origin => origin.trim())
        .filter(Boolean);

    const allowlist = envOrigins.length > 0 ? envOrigins : DEFAULT_ALLOWED_ORIGINS;
    return new Set(allowlist);
}

function isOriginAllowed(origin, allowedOrigins = getAllowedOrigins()) {
    if (!origin) return true;
    if (allowedOrigins.has('*')) return true;
    return allowedOrigins.has(origin);
}

function applySecurityHeaders(res) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
}

function applyCors(req, res, options = {}) {
    const methods = options.methods || 'GET,POST,OPTIONS';
    const allowedOrigins = options.allowedOrigins || getAllowedOrigins();
    const origin = req.headers.origin;
    const allowed = isOriginAllowed(origin, allowedOrigins);

    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', methods);
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (origin && allowed) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }

    return allowed;
}

function getClientIp(req) {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
        return forwarded.split(',')[0].trim();
    }
    if (Array.isArray(forwarded) && forwarded.length > 0) {
        return forwarded[0].trim();
    }
    return req.ip || req.socket?.remoteAddress || 'unknown';
}

function isBodyTooLarge(body, maxBytes) {
    if (!body) return false;
    if (!Number.isFinite(maxBytes) || maxBytes <= 0) return false;

    try {
        return Buffer.byteLength(JSON.stringify(body), 'utf8') > maxBytes;
    } catch (error) {
        return true;
    }
}

module.exports = {
    applyCors,
    applySecurityHeaders,
    getAllowedOrigins,
    getClientIp,
    isBodyTooLarge,
    isOriginAllowed,
    parsePositiveInt
};
