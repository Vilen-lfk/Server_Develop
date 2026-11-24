import { createServer } from 'node:http';

import { loadConfig } from '../../internal/config/config.js';
import {
  connect,
  ping,
} from '../../internal/database/postgres.js';

import { HealthService } from '../../internal/service/healthService.js';
import { CarService } from '../../internal/service/carService.js';
import { BookingService } from '../../internal/service/bookingService.js';

import { HealthController } from '../../internal/controller/healthController.js';
import { CarController } from '../../internal/controller/carController.js';
import { BookingController } from '../../internal/controller/bookingController.js';

import { createRouter } from '../../internal/controller/router.js';

import { PgUserRepository } from '../../internal/repository/postgres/userRepository.js';
import { PgTariffRepository } from '../../internal/repository/postgres/tariffRepository.js';
import { PgCarRepository } from '../../internal/repository/postgres/carRepository.js';
import { PgBookingRepository } from '../../internal/repository/postgres/bookingRepository.js';

let config;

try {
  config = loadConfig();
  console.log('[CONFIG] Environment variables loaded successfully');
} catch (err) {
  console.error(`[CONFIG] ${err.message}`);
  process.exit(1);
}

let pool;

try {
  pool = await connect(config.db);
} catch (err) {
  console.error(`[DATABASE] ${err.message}`);
  process.exit(1);
}

const userRepo = new PgUserRepository(pool);
const tariffRepo = new PgTariffRepository(pool);
const carRepo = new PgCarRepository(pool);
const bookingRepo = new PgBookingRepository(pool);

const carService = new CarService(
  carRepo,
  tariffRepo,
);

const bookingService = new BookingService({
  bookingRepository: bookingRepo,
  carRepository: carRepo,
  userRepository: userRepo,
  tariffRepository: tariffRepo,
  clock: () => new Date(),
});

const healthService = new HealthService(config, {
  checkDatabase: () => ping(pool),
});

const router = createRouter({
  prefix: '/api/v1',
});

new HealthController(healthService).register(router);
new CarController(carService).register(router);
new BookingController(bookingService).register(router);

const server = createServer(router.handle);

server.listen(config.httpPort, () => {
  console.log(
    `[HTTP] ${config.appName} v${config.appVersion} ` +
    `[${config.appEnv}] listening on :${config.httpPort}`,
  );
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    console.log(`[APP] ${signal} received, shutting down`);

    server.close(async () => {
      await pool.end().catch(() => {});
      process.exit(0);
    });
  });
}