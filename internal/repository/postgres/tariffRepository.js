import { Tariff } from '../../domain/tariff.js';
import { TariffRepository } from '../repository.js';
import { execOne, normalizePage, queryMany, queryOne, run } from './db.js';

const toTariff = (row) =>
  new Tariff({
    id: row.id,
    name: row.name,
    pricePerMinute: row.price_per_minute,
    pricePerDay: row.price_per_day,
    depositAmount: row.deposit_amount,
    createdAt: row.created_at,
  });

export class PgTariffRepository extends TariffRepository {
  #db;

  constructor(db) {
    super();
    this.#db = db;
  }

  async create(tariff) {
    const q = `INSERT INTO tariffs (name, price_per_minute, price_per_day, deposit_amount)
               VALUES ($1, $2, $3, $4)
               RETURNING id, created_at`;
    const { rows } = await run(this.#db, q, [
      tariff.name, tariff.pricePerMinute, tariff.pricePerDay, tariff.depositAmount,
    ]);
    tariff.id = rows[0].id;
    tariff.createdAt = rows[0].created_at;
    return tariff;
  }

  getById(id) {
    const q = `SELECT id, name, price_per_minute, price_per_day, deposit_amount, created_at
               FROM tariffs
               WHERE id = $1`;
    return queryOne(this.#db, q, [id], toTariff);
  }

  list(limit, offset) {
    const q = `SELECT id, name, price_per_minute, price_per_day, deposit_amount, created_at
               FROM tariffs
               ORDER BY created_at DESC, id
               LIMIT $1 OFFSET $2`;
    return queryMany(this.#db, q, normalizePage(limit, offset), toTariff);
  }

  async update(tariff) {
    const q = `UPDATE tariffs
               SET name = $1, price_per_minute = $2, price_per_day = $3, deposit_amount = $4
               WHERE id = $5`;
    await execOne(this.#db, q, [
      tariff.name, tariff.pricePerMinute, tariff.pricePerDay, tariff.depositAmount, tariff.id,
    ]);
    return tariff;
  }

  delete(id) {
    // 23503 -> ConflictError: на тариф ссылаются автомобили
    return execOne(this.#db, 'DELETE FROM tariffs WHERE id = $1', [id]);
  }
}