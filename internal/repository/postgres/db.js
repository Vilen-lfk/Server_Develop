import {
  AlreadyExistsError, ConflictError, DomainError, InvalidInputError, NotFoundError,
} from '../../domain/errors.js';

// Коды SQLSTATE PostgreSQL -> доменные ошибки
const SQLSTATE_TO_ERROR = {
  '23505': AlreadyExistsError, // unique_violation
  '23503': ConflictError,      // foreign_key_violation
  '23514': InvalidInputError,  // check_violation
  '23502': InvalidInputError,  // not_null_violation
  '22P02': InvalidInputError,  // invalid_text_representation (например, неверный UUID)
  '22001': InvalidInputError,  // string_data_right_truncation
};

/** Преобразует ошибку драйвера в доменную; прочие оборачивает, сохраняя причину. */
export function mapError(err) {
  if (err instanceof DomainError) return err;

  const ErrorClass = SQLSTATE_TO_ERROR[err?.code];
  if (ErrorClass) {
    const details = err.constraint ?? err.message;
    return new ErrorClass(`${new ErrorClass().message}: ${details}`, { cause: err });
  }
  return new Error(`database error: ${err?.message ?? err}`, { cause: err });
}

/** Выполняет параметризованный запрос; ошибки возвращает доменными. */
export async function run(db, text, params = []) {
  try {
    return await db.query(text, params);
  } catch (err) {
    throw mapError(err);
  }
}

/** Ровно одна строка: нет строк -> NotFoundError. */
export async function queryOne(db, text, params, mapRow) {
  const { rows } = await run(db, text, params);
  if (rows.length === 0) throw new NotFoundError();
  return mapRow(rows[0]);
}

export async function queryMany(db, text, params, mapRow) {
  const { rows } = await run(db, text, params);
  return rows.map(mapRow);
}

/** UPDATE / DELETE: ни одной затронутой строки -> NotFoundError. */
export async function execOne(db, text, params) {
  const result = await run(db, text, params);
  if (result.rowCount === 0) throw new NotFoundError();
}

/** Приводит limit и offset к допустимым значениям (limit не больше 100). */
export function normalizePage(limit, offset) {
  const safeLimit = Number.isInteger(limit) && limit > 0 && limit <= 100 ? limit : 20;
  const safeOffset = Number.isInteger(offset) && offset >= 0 ? offset : 0;
  return [safeLimit, safeOffset];
}

/** Транзакция: COMMIT при успехе, ROLLBACK при ошибке. fn получает клиента для репозиториев. */
export async function withTx(pool, fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // исходная ошибка важнее ошибки отката
    }
    throw err;
  } finally {
    client.release();
  }
}