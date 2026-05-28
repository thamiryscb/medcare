function readEnv() {
  return {
    port: Number(process.env.PORT || 3333),
    corsOrigin: process.env.CORS_ORIGIN || '*',
    sessionTtlHours: Number(process.env.SESSION_TTL_HOURS || 24),
    databaseUrl: process.env.DATABASE_URL || null,
    store: process.env.MEDCARE_STORE || 'sqlite',
  };
}

module.exports = { readEnv };
