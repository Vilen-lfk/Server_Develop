import { BookingRepository } from '../repository.js';
import { NotFoundError } from '../../domain/errors.js';
import {
  normalizePage,
  run,
  withTx,
} from './db.js';

const SELECT_BOOKING = `
  SELECT id, user_id, car_id, start_time, end_time,
         total_cost, status, created_at
  FROM bookings
`;

const toBooking = (row) => ({
  id: row.id,
  userId: row.user_id,
  carId: row.car_id,
  startTime: row.start_time,
  endTime: row.end_time,
  totalCost: row.total_cost === null
    ? null
    : Number(row.total_cost),
  status: row.status,
  createdAt: row.created_at,
});

export class PgBookingRepository extends BookingRepository {
  #db;

  constructor(db) {
    super();
    this.#db = db;
  }

  async create(booking, depositAmount = 0) {
    return withTx(this.#db, async (client) => {
      const { rows } = await run(
        client,
        `INSERT INTO bookings
          (user_id, car_id, start_time, status)
         VALUES ($1, $2, $3, 'BOOKED')
         RETURNING id, user_id, car_id, start_time,
                   end_time, total_cost, status, created_at`,
        [
          booking.userId,
          booking.carId,
          booking.startTime,
        ],
      );

      const created = toBooking(rows[0]);

      if (Number(depositAmount) > 0) {
        await run(
          client,
          `INSERT INTO transactions
            (booking_id, amount, type)
           VALUES ($1, $2, 'DEPOSIT_HOLD')`,
          [created.id, depositAmount],
        );
      }

      return created;
    });
  }

  async getById(id) {
    const { rows } = await run(
      this.#db,
      `${SELECT_BOOKING} WHERE id = $1`,
      [id],
    );

    if (!rows.length) {
      throw new NotFoundError('Бронирование не найдено');
    }

    return toBooking(rows[0]);
  }

  async list(limit, offset, filters = {}) {
    const params = normalizePage(limit, offset);

    const where = filters.status
      ? ' WHERE status = $3'
      : '';

    if (filters.status) {
      params.push(filters.status);
    }

    const { rows } = await run(
      this.#db,
      `${SELECT_BOOKING}${where}
       ORDER BY created_at DESC, id
       LIMIT $1 OFFSET $2`,
      params,
    );

    return rows.map(toBooking);
  }

  async hasOpenBooking(carId) {
    const { rows } = await run(
      this.#db,
      `SELECT 1 FROM bookings
       WHERE car_id = $1
       AND status IN ('BOOKED', 'ACTIVE')
       LIMIT 1`,
      [carId],
    );

    return rows.length > 0;
  }

  async changeStatus(
    id,
    status,
    carStatus,
    changedAt,
    totalCost = null,
    depositAmount = 0,
  ) {
    return withTx(this.#db, async (client) => {
      const { rows } = await run(
        client,
        `UPDATE bookings
         SET status = $1,
             end_time = CASE
               WHEN $1 IN ('COMPLETED', 'CANCELLED')
               THEN $2 ELSE end_time END,
             total_cost = CASE
               WHEN $1 = 'COMPLETED'
               THEN $3 ELSE total_cost END
         WHERE id = $4
         RETURNING id, user_id, car_id, start_time,
                   end_time, total_cost, status, created_at`,
        [status, changedAt, totalCost, id],
      );

      if (!rows.length) {
        throw new NotFoundError('Бронирование не найдено');
      }

      const booking = toBooking(rows[0]);

      await run(
        client,
        `UPDATE cars
         SET status_id = (
           SELECT id FROM car_statuses WHERE name = $1
         )
         WHERE id = $2`,
        [carStatus, booking.carId],
      );

      if (status === 'COMPLETED' && Number(totalCost) > 0) {
        await run(
          client,
          `INSERT INTO transactions
            (booking_id, amount, type)
           VALUES ($1, $2, 'PAYMENT')`,
          [id, totalCost],
        );
      } else if (
        status === 'CANCELLED' &&
        Number(depositAmount) > 0
      ) {
        await run(
          client,
          `INSERT INTO transactions
            (booking_id, amount, type)
           VALUES ($1, $2, 'REFUND')`,
          [id, depositAmount],
        );
      }

      return booking;
    });
  }
}