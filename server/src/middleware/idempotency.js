const idempotencyStore = new Map();

function idempotencyMiddleware(req, res, next) {
    const key = req.headers['idempotency-key'];

    if (!key) {
        return res.status(400).json({
            success: false,
            message: 'Idempotency-Key header is required',
        });
    }

    if (idempotencyStore.has(key)) {
        const cached = idempotencyStore.get(key);
        return res.status(cached.statusCode).json(cached.body);
    }

    idempotencyStore.set(key, {
        statusCode: 202,
        body: {
            success: false,
            pending: true,
            message: 'Request is being processed',
        },
    });

    req.idempotencyKey = key;
    req.idempotencyStore = idempotencyStore;
    return next();
}

module.exports = idempotencyMiddleware;
