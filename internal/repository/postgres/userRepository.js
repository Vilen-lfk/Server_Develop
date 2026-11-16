import { User } from '../../domain/user.js';
import { UserRepository } from '../repository.js';
import { execOne, normalizePage, queryMany, queryOne, run } from './db.js';

const toUser = (row) =>
  new User({
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
    licenseNumber: row.license_number,
    createdAt: row.created_at,
  });

export class PgUserRepository extends UserRepository {
  #db;

  constructor(db) {
    super();
    this.#db = db;
  }

  async create(user) {
    const q = `INSERT INTO users (email, password_hash, role, license_number)
               VALUES ($1, $2, $3, $4)
               RETURNING id, role, created_at`;
    const { rows } = await run(this.#db, q, [
      user.email,
      user.passwordHash,
      user.role ?? 'DRIVER',
      user.licenseNumber ?? null,
    ]);
    user.id = rows[0].id;
    user.role = rows[0].role;
    user.createdAt = rows[0].created_at;
    return user;
  }

  getById(id) {
    const q = `SELECT id, email, password_hash, role, license_number, created_at
               FROM users
               WHERE id = $1`;
    return queryOne(this.#db, q, [id], toUser);
  }

  getByEmail(email) {
    const q = `SELECT id, email, password_hash, role, license_number, created_at
               FROM users
               WHERE email = $1`;
    return queryOne(this.#db, q, [email], toUser);
  }

  list(limit, offset) {
    const q = `SELECT id, email, password_hash, role, license_number, created_at
               FROM users
               ORDER BY created_at DESC, id
               LIMIT $1 OFFSET $2`;
    return queryMany(this.#db, q, normalizePage(limit, offset), toUser);
  }

  delete(id) {
    // 23503 -> ConflictError: у пользователя есть бронирования
    return execOne(this.#db, 'DELETE FROM users WHERE id = $1', [id]);
  }
}