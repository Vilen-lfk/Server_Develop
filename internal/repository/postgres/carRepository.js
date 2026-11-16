import { Car } from '../../domain/car.js';
import { CarRepository } from '../repository.js';
import { execOne, normalizePage, queryMany, queryOne, run } from './db.js';

// Статус читается из справочника car_statuses через JOIN
const SELECT_CAR = `SELECT c.id, c.vin, c.model_name, c.license_plate, c.current_mileage,
                           c.fuel_level, s.name AS status, c.tariff_id, c.created_at
                    FROM cars c
                    JOIN car_statuses s ON s.id = c.status_id`;

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
    // Неизвестное название статуса даст NULL и ошибку NOT NULL -> InvalidInputError
    const q = `INSERT INTO cars (vin, model_name, license_plate, current_mileage, fuel_level, status_id, tariff_id)
               VALUES ($1, $2, $3, $4, $5, (SELECT id FROM car_statuses WHERE name = $6), $7)
               RETURNING id, created_at`;
    const { rows } = await run(this.#db, q, [
      car.vin, car.modelName, car.licensePlate,
      car.currentMileage ?? 0, car.fuelLevel ?? 100,
      car.status ?? 'Available', car.tariffId,
    ]);
    car.id = rows[0].id;
    car.createdAt = rows[0].created_at;
    return car;
  }

  getById(id) {
    return queryOne(this.#db, `${SELECT_CAR} WHERE c.id = $1`, [id], toCar);
  }

  list(limit, offset) {
    const q = `${SELECT_CAR}
               ORDER BY c.created_at DESC, c.id
               LIMIT $1 OFFSET $2`;
    return queryMany(this.#db, q, normalizePage(limit, offset), toCar);
  }

  delete(id) {
    // 23503 -> ConflictError: у автомобиля есть бронирования
    return execOne(this.#db, 'DELETE FROM cars WHERE id = $1', [id]);
  }
}