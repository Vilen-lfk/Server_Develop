// Маршрутизация: сопоставляет метод и путь с обработчиком.
import { sendError } from './http.js';

const API_PREFIX = '/api/v1';

/**
 * @param {{health: {handle: Function}}} controllers
 * @returns {(req, res) => void} обработчик для http.createServer
 */
export function createRouter(controllers) {
  const routes = new Map([
    [`GET ${API_PREFIX}/health`, (req, res) => controllers.health.handle(req, res)],
  ]);

  return (req, res) => {
    const { pathname } = new URL(req.url, 'http://localhost');
    const handler = routes.get(`${req.method} ${pathname}`);

    if (handler) {
      try {
        return handler(req, res);
      } catch (err) {
        console.error(err);
        return sendError(res, 500, 'INTERNAL_ERROR', 'Внутренняя ошибка сервера');
      }
    }

    const knownPath = [...routes.keys()].some((key) => key.endsWith(` ${pathname}`));
    return knownPath
      ? sendError(res, 405, 'METHOD_NOT_ALLOWED', 'Метод не поддерживается')
      : sendError(res, 404, 'NOT_FOUND', 'Ресурс не найден');
  };
}
