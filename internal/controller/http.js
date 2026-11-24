export class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function sendJson(res, status, body, headers = {}) {
  const payload = JSON.stringify(body);

  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
    ...headers,
  });

  res.end(payload);
}

export function sendNoContent(res) {
  res.writeHead(204);
  res.end();
}

export function sendError(res, status, code, message) {
  sendJson(res, status, {
    code,
    message,
    timestamp: new Date().toISOString(),
  });
}

export async function readJson(req, maxBytes = 1_000_000) {
  const chunks = [];
  let size = 0;

  for await (const chunk of req) {
    size += chunk.length;

    if (size > maxBytes) {
      throw new HttpError(
        400,
        'INVALID_INPUT',
        'Тело запроса слишком большое',
      );
    }

    chunks.push(chunk);
  }

  if (size === 0) {
    throw new HttpError(
      400,
      'INVALID_INPUT',
      'Тело запроса пустое',
    );
  }

  try {
    return JSON.parse(
      Buffer.concat(chunks).toString('utf8'),
    );
  } catch {
    throw new HttpError(
      400,
      'INVALID_INPUT',
      'Некорректный JSON',
    );
  }
}