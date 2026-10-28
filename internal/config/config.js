// Слой конфигурации: читает параметры из переменных окружения и файла .env.
// Остальные слои приложения получают готовый объект config и не обращаются к process.env.
import { existsSync, readFileSync } from 'node:fs';

/**
 * Минимальный парсер .env (KEY=VALUE, комментарии "#", значения в кавычках).
 * Уже заданные переменные окружения имеют приоритет над файлом.
 */
function loadDotEnv(path = '.env') {
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
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

/** Загружает и валидирует конфигурацию приложения. */
export function loadConfig() {
  loadDotEnv();

  const port = Number.parseInt(process.env.HTTP_PORT ?? '8080', 10);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`HTTP_PORT должен быть числом от 1 до 65535, получено: ${process.env.HTTP_PORT}`);
  }

  return Object.freeze({
    appName: process.env.APP_NAME ?? 'Carsharing Rental API',
    appVersion: process.env.APP_VERSION ?? '1.0.0',
    appEnv: process.env.APP_ENV ?? 'development',
    httpPort: port,
  });
}
