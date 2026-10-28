// Слой бизнес-логики (Service Layer).
// Ничего не знает про HTTP: принимает конфигурацию и возвращает обычный объект.

export class HealthService {
  #config;
  #now;
  #startedAt;

  /**
   * @param {{appName: string, appVersion: string, appEnv: string}} config
   * @param {() => number} [now] - источник времени (можно подменить в тестах)
   */
  constructor(config, now = Date.now) {
    this.#config = config;
    this.#now = now;
    this.#startedAt = now();
  }

  /** Возвращает состояние сервиса. */
  check() {
    return {
      status: 'pass',
      app_name: this.#config.appName,
      version: this.#config.appVersion,
      environment: this.#config.appEnv,
      uptime_seconds: Math.floor((this.#now() - this.#startedAt) / 1000),
    };
  }
}
