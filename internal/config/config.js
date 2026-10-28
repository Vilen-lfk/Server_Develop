import { existsSync, readFileSync } from 'node:fs';

function loadDotEnv(path, env) {
  if (!existsSync(path)) return;

  for (const rawLine of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const eq = line.indexOf('=');
    if (eq === -1) continue;

    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      value.length >= 2 &&
      ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'")))
    ) {
      value = value.slice(1, -1);
    }
    if (env[key] === undefined) env[key] = value;
  }
}

function parseInteger(env, name, fallback, { min, max }) {
  const raw = env[name] === undefined || env[name] === '' ? String(fallback) : env[name];
  const value = Number(raw);
  if (!/^\d+$/.test(raw) || value < min || value > max) {
    throw new Error(`${name} должен быть целым числом от ${min} до ${max}, получено: ${raw}`);
  }
  return value;
}

const REQUIRED_DB_VARS = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];

export function loadConfig({ env = process.env, envFile = '.env' } = {}) {
  if (envFile) loadDotEnv(envFile, env);

  const missing = REQUIRED_DB_VARS.filter((name) => !env[name]);
  if (missing.length > 0) {
    throw new Error(`Не заданы обязательные переменные окружения: ${missing.join(', ')}`);
  }

  return Object.freeze({
    appName: env.APP_NAME || 'Carsharing Rental API',
    appVersion: env.APP_VERSION || '1.0.0',
    appEnv: env.APP_ENV || 'development',
    httpPort: parseInteger(env, 'HTTP_PORT', 8080, { min: 1, max: 65535 }),
    db: Object.freeze({
      host: env.DB_HOST,
      port: parseInteger(env, 'DB_PORT', 5432, { min: 1, max: 65535 }),
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      name: env.DB_NAME,
      maxConns: parseInteger(env, 'DB_MAX_CONNS', 10, { min: 1, max: 1000 }),
    }),
  });
}