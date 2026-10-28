export class HealthService {
  #config;
  #checkDatabase;
  #now;
  #startedAt;

  constructor(config, { checkDatabase = async () => true, now = Date.now } = {}) {
    this.#config = config;
    this.#checkDatabase = checkDatabase;
    this.#now = now;
    this.#startedAt = now();
  }

  async check() {
    const dbUp = await this.#checkDatabase();
    return {
      status: dbUp ? 'pass' : 'fail',
      app_name: this.#config.appName,
      version: this.#config.appVersion,
      environment: this.#config.appEnv,
      db: dbUp ? 'up' : 'down',
      uptime_seconds: Math.floor((this.#now() - this.#startedAt) / 1000),
    };
  }
}