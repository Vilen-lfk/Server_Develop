// Точка входа и Composition Root: здесь создаются и связываются все слои.
import { createServer } from 'node:http';
import { loadConfig } from '../../internal/config/config.js';
import { HealthService } from '../../internal/service/healthService.js';
import { HealthController } from '../../internal/controller/healthController.js';
import { createRouter } from '../../internal/controller/router.js';

const config = loadConfig();

// Repository -> Service -> Controller (зависимости передаются снаружи)
const healthService = new HealthService(config);
const router = createRouter({ health: new HealthController(healthService) });

const server = createServer(router);

server.listen(config.httpPort, () => {
  console.log(`${config.appName} v${config.appVersion} [${config.appEnv}] listening on :${config.httpPort}`);
});

// Корректное завершение работы
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    console.log(`${signal} received, shutting down`);
    server.close(() => process.exit(0));
  });
}
