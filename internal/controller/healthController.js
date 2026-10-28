// Transport / HTTP-слой. Разбирает запрос, вызывает сервис, формирует HTTP-ответ.
// Зависит от абстракции "объект с методом check()", а не от конкретного класса.
import { sendJson } from './http.js';

export class HealthController {
  #healthService;

  /** @param {{check: () => object}} healthService */
  constructor(healthService) {
    this.#healthService = healthService;
  }

  /** GET /api/v1/health */
  handle(req, res) {
    sendJson(res, 200, this.#healthService.check());
  }
}
