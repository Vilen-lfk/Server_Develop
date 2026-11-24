import { Car } from '../../domain/car.js';
import { CarRepository } from '../repository.js';
import {
  execOne,
  normalizePage,
  queryMany,
  queryOne,
  run,
} from './db.js';

const SELECT_CAR = `
  SELECT c.id, c.vin, c.model_name, c.license_plate,
         c.current_mileage, c.fuel_level,
         s.name AS status, c.tariff_id, c.created_at
  FROM cars c
  JOIN car_statuses s ON s.id = c.status_id
`;

const toCar = (row) =>
  new Car({
    id: row.id,
    vin: row.vin,
    modelName: row.model_name,
    licensePlate: row.license_plate,
    currentMileage: row.current_mileage,
    fuelLevel: Number(row.fuel_level),
    status: row.status,
    tariffId: row.tariff_id,
    createdAt: row.created_at,
  });

export class PgCarRepository extends CarRepository {
  #db;

  constructor(db) {
    super();
    this.#db = db;
  }

  async create(car) {
    const q = `
      INSERT INTO cars
        (vin, model_name, license_plate, current_mileage,
         fuel_level, status_id, tariff_id)
      VALUES (
        $1, $2, $3, $4, $5,
        (SELECT id FROM car_statuses WHERE name = $6),
        $7
      )
      RETURNING id, created_at
    `;

    const { rows } = await run(this.#db, q, [
      car.vin,
      car.modelName,
      car.licensePlate,
      car.currentMileage ?? 0,
      car.fuelLevel ?? 100,
      car.status ?? 'Available',
      car.tariffId,
    ]);

    car.id = rows[0].id;
    car.createdAt = rows[0].created_at;

    return car;
  }

  getById(id) {
    return queryOne(
      this.#db,
      `${SELECT_CAR} WHERE c.id = $1`,
      [id],
      toCar,
    );
  }

  list(limit, offset, filters = {}) {
    const params = normalizePage(limit, offset);
    const conditions = [];

    if (filters.status) {
      params.push(filters.status);
      conditions.push(`s.name = $${params.length}`);
    }

    if (
      filters.minFuelLevel !== undefined &&
      filters.minFuelLevel !== ''
    ) {
      params.push(Number(filters.minFuelLevel));
      conditions.push(`c.fuel_level >= $${params.length}`);
    }

    const where = conditions.length
      ? ` WHERE ${conditions.join(' AND ')}`
      : '';

    const q = `
      ${SELECT_CAR}${where}
      ORDER BY c.created_at DESC, c.id
      LIMIT $1 OFFSET $2
    `;

    return queryMany(this.#db, q, params, toCar);
  }

  async update(car) {
    const q = `
      UPDATE cars
      SET vin = $1,
          model_name = $2,
          license_plate = $3,
          current_mileage = $4,
          fuel_level = $5,
          status_id = (
            SELECT id FROM car_statuses WHERE name = $6
          ),
          tariff_id = $7
      WHERE id = $8
    `;

    await execOne(this.#db, q, [
      car.vin,
      car.modelName,
      car.licensePlate,
      car.currentMileage,
      car.fuelLevel,
      car.status,
      car.tariffId,
      car.id,
    ]);

    return car;
  }

  async updateStatus(id, status) {
    const q = `
      UPDATE cars
      SET status_id = (
        SELECT id FROM car_statuses WHERE name = $1
      )
      WHERE id = $2
    `;

    await execOne(this.#db, q, [status, id]);
  }

  delete(id) {
    return execOne(
      this.#db,
      'DELETE FROM cars WHERE id = $1',
      [id],
    );
  }
}