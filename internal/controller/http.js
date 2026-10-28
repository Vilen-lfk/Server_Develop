// Вспомогательные функции HTTP-слоя.

export function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
  });
  res.end(payload);
}

// Формат ошибок совпадает со схемой ErrorResponse из openapi.yaml.
export function sendError(res, status, code, message) {
  sendJson(res, status, { code, message, timestamp: new Date().toISOString() });
}
