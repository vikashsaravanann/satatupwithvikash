function createRateLimiter({ windowMs, max }) {
    const hits = new Map();

    return {
        check(key) {
            const now = Date.now();
            const current = hits.get(key);

            if (!current || now > current.resetAt) {
                const fresh = {
                    count: 1,
                    resetAt: now + windowMs
                };
                hits.set(key, fresh);
                return {
                    allowed: true,
                    limit: max,
                    remaining: Math.max(0, max - fresh.count),
                    resetAt: fresh.resetAt,
                    retryAfterMs: 0
                };
            }

            current.count += 1;
            hits.set(key, current);

            const allowed = current.count <= max;
            const remaining = Math.max(0, max - current.count);
            const retryAfterMs = allowed ? 0 : Math.max(0, current.resetAt - now);

            return {
                allowed,
                limit: max,
                remaining,
                resetAt: current.resetAt,
                retryAfterMs
            };
        },
        cleanup() {
            const now = Date.now();
            for (const [key, record] of hits.entries()) {
                if (now > record.resetAt) {
                    hits.delete(key);
                }
            }
        }
    };
}

function setRateLimitHeaders(res, rateState) {
    res.setHeader('X-RateLimit-Limit', String(rateState.limit));
    res.setHeader('X-RateLimit-Remaining', String(rateState.remaining));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(rateState.resetAt / 1000)));

    if (!rateState.allowed) {
        res.setHeader('Retry-After', String(Math.ceil(rateState.retryAfterMs / 1000)));
    }
}

module.exports = {
    createRateLimiter,
    setRateLimitHeaders
};
