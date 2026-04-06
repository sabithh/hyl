import dotenv from 'dotenv';
dotenv.config();

const skipDbConnect = String(process.env.SKIP_DB_CONNECT || 'false').toLowerCase() === 'true';
const databaseUrl = process.env.DATABASE_URL || '';
const isPostgresDatabaseUrl = /^postgres(?:ql)?:\/\//i.test(databaseUrl);
const jwtSecret = process.env.JWT_SECRET;
const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;

if (!skipDbConnect && (!databaseUrl || !isPostgresDatabaseUrl)) {
    throw new Error(
        'DATABASE_URL must be a PostgreSQL URL when SKIP_DB_CONNECT is false.'
    );
}

if (!jwtSecret || !jwtRefreshSecret) {
    throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be set.');
}

if (
    jwtSecret.includes('replace-with') ||
    jwtRefreshSecret.includes('replace-with')
) {
    throw new Error('JWT secrets are using placeholder values. Please set real secrets.');
}

const config = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '5000', 10),
    skipDbConnect,

    // Database
    databaseUrl,

    // JWT
    jwt: {
        secret: jwtSecret,
        refreshSecret: jwtRefreshSecret,
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    },

    // Redis
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

    // CORS
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',

    // Rate Limiting
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000', 10),
        authMaxRequests: parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || '100', 10),
    },
};

export default config;
