import { sendJson } from './http.js';

export class HealthController {
  #healthService;

  constructor(healthService) {
    this.#healthService = healthService;
  }

  register(router) {
    router.get('/health', (req, res) => this.#handle(req, res));
  }

  // GET /api/v1/health: 200 если всё работает, 503 если недоступна БД
  async #handle(req, res) {
    const result = await this.#healthService.check();
    sendJson(res, result.status === 'pass' ? 200 : 503, result);
  }
}