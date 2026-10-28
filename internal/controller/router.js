import { HttpError, sendError } from './http.js';

export function createRouter({ prefix = '' } = {}) {
  const routes = [];

  function add(method, path, handler) {
    const names = [];
    const pattern = (prefix + path)
      .replace(/\/+$/, '')
      .replace(/:([A-Za-z_]+)/g, (_, name) => {
        names.push(name);
        return '([^/]+)';
      });
    routes.push({ method, regex: new RegExp(`^${pattern}$`), names, handler });
  }

  async function handle(req, res) {
    const { pathname } = new URL(req.url, 'http://localhost');
    const path = pathname.replace(/\/+$/, '') || '/';

    let pathMatched = false;
    for (const route of routes) {
      const match = route.regex.exec(path);
      if (!match) continue;
      pathMatched = true;
      if (route.method !== req.method) continue;

      req.params = Object.fromEntries(
        route.names.map((name, i) => [name, decodeURIComponent(match[i + 1])]),
      );
      try {
        return await route.handler(req, res);
      } catch (err) {
        if (err instanceof HttpError) return sendError(res, err.status, err.code, err.message);
        console.error(err);
        return sendError(res, 500, 'INTERNAL_ERROR', 'Внутренняя ошибка сервера');
      }
    }

    return pathMatched
      ? sendError(res, 405, 'METHOD_NOT_ALLOWED', 'Метод не поддерживается')
      : sendError(res, 404, 'NOT_FOUND', 'Ресурс не найден');
  }

  return {
    get: (path, handler) => add('GET', path, handler),
    post: (path, handler) => add('POST', path, handler),
    put: (path, handler) => add('PUT', path, handler),
    patch: (path, handler) => add('PATCH', path, handler),
    delete: (path, handler) => add('DELETE', path, handler),
    handle,
  };
}