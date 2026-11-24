import {
  readJson,
  sendJson,
  sendNoContent,
} from './http.js';

import {
  carRequestToDomain,
  carToResponse,
} from '../dto/carDto.js';

export class CarController {
  constructor(carService) {
    this.cars = carService;
  }

  register(router) {
    router.get('/cars', (req, res) => this.list(req, res));
    router.post('/cars', (req, res) => this.create(req, res));
    router.get('/cars/:id', (req, res) => this.get(req, res));
    router.put('/cars/:id', (req, res) => this.update(req, res));
    router.patch('/cars/:id/status', (req, res) => this.updateStatus(req, res));
    router.delete('/cars/:id', (req, res) => this.delete(req, res));
  }

  async list(req, res) {
    const url = new URL(req.url, 'http://localhost');

    const items = await this.cars.list({
      limit: numberParam(url.searchParams.get('limit'), 20),
      offset: numberParam(url.searchParams.get('offset'), 0),
      status: url.searchParams.get('status') || undefined,
      minFuelLevel: url.searchParams.get('min_fuel_level') || undefined,
    });

    sendJson(res, 200, items.map(carToResponse));
  }

  async create(req, res) {
    const car = await this.cars.create(
      carRequestToDomain(await readJson(req)),
    );

    sendJson(
      res,
      201,
      carToResponse(car),
      { Location: `/api/v1/cars/${car.id}` },
    );
  }

  async get(req, res) {
    sendJson(
      res,
      200,
      carToResponse(await this.cars.get(req.params.id)),
    );
  }

  async update(req, res) {
    const car = await this.cars.update(
      req.params.id,
      carRequestToDomain(await readJson(req)),
    );

    sendJson(res, 200, carToResponse(car));
  }

  async updateStatus(req, res) {
    const body = await readJson(req);

    const car = await this.cars.updateStatus(
      req.params.id,
      body.status,
    );

    sendJson(res, 200, carToResponse(car));
  }

  async delete(req, res) {
    await this.cars.delete(req.params.id);
    sendNoContent(res);
  }
}

function numberParam(value, fallback) {
  if (value === null) return fallback;

  const parsed = Number(value);

  return Number.isInteger(parsed) ? parsed : Number.NaN;
}