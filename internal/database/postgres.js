// Подключение к PostgreSQL через пул соединений (библиотека pg).

const MAX_ATTEMPTS = 10;
const defaultSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const describe = (err) => err?.message || err?.code || String(err);

export async function connect(
  db,
  { Pool, attempts = MAX_ATTEMPTS, sleep = defaultSleep, logger = console } = {},
) {
  const PoolClass = Pool ?? (await import('pg')).default.Pool;

  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const pool = new PoolClass({
      host: db.host,
      port: db.port,
      user: db.user,
      password: db.password,
      database: db.name,
      max: db.maxConns,
      idleTimeoutMillis: 5 * 60 * 1000,
      connectionTimeoutMillis: 3000,
      query_timeout: 5000,
      maxLifetimeSeconds: 30 * 60,
    });
    pool.on('error', (err) => logger.error(`[DATABASE] idle client error: ${describe(err)}`));

    try {
      await pool.query('SELECT 1');
      logger.log(`[DATABASE] Successfully connected to PostgreSQL at ${db.host}:${db.port}`);
      return pool;
    } catch (err) {
      lastError = err;
      await pool.end().catch(() => {});
      if (attempt < attempts) {
        const wait = attempt * 1000;
        logger.log(`[DATABASE] attempt ${attempt}/${attempts} failed: ${describe(err)}; retry in ${wait / 1000}s`);
        await sleep(wait);
      }
    }
  }
  throw new Error(`База данных недоступна после ${attempts} попыток: ${describe(lastError)}`);
}

export async function ping(pool, timeoutMs = 2000) {
  let timer;
  try {
    await Promise.race([
      pool.query('SELECT 1'),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('timeout')), timeoutMs);
      }),
    ]);
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}