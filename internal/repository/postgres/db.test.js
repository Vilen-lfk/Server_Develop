import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  AlreadyExistsError, ConflictError, InvalidInputError, NotFoundError,
} from '../../domain/errors.js';
import { execOne, mapError, normalizePage, queryOne, withTx } from './db.js';
import { PgUserRepository } from './userRepository.js';

const pgError = (code, extra = {}) => Object.assign(new Error('pg failure'), { code, ...extra });

test('mapError: коды SQLSTATE -> доменные ошибки', () => {
  assert.ok(mapError(pgError('23505', { constraint: 'users_email_key' })) instanceof AlreadyExistsError);
  assert.ok(mapError(pgError('23503')) instanceof ConflictError);
  assert.ok(mapError(pgError('23514')) instanceof InvalidInputError);
  assert.ok(mapError(pgError('22P02')) instanceof InvalidInputError);
  assert.ok(mapError(pgError('23502')) instanceof InvalidInputError);
});

test('mapError: имя ограничения в сообщении, исходная ошибка в cause', () => {
  const original = pgError('23505', { constraint: 'users_email_key' });
  const mapped = mapError(original);
  assert.match(mapped.message, /users_email_key/);
  assert.equal(mapped.cause, original);
});

test('mapError: прочие ошибки оборачиваются, а не становятся доменными', () => {
  const mapped = mapError(new Error('ECONNREFUSED'));
  assert.ok(!(mapped instanceof NotFoundError));
  assert.match(mapped.message, /database error: ECONNREFUSED/);
});

test('queryOne: нет строк -> NotFoundError', async () => {
  const db = { query: async () => ({ rows: [], rowCount: 0 }) };
  await assert.rejects(queryOne(db, 'SELECT 1', [], (r) => r), NotFoundError);
});

test('execOne: 0 затронутых строк -> NotFoundError', async () => {
  await assert.rejects(execOne({ query: async () => ({ rowCount: 0 }) }, 'DELETE', []), NotFoundError);
  await execOne({ query: async () => ({ rowCount: 1 }) }, 'DELETE', []);
});

test('normalizePage ограничивает limit и offset', () => {
  assert.deepEqual(normalizePage(10, 5), [10, 5]);
  assert.deepEqual(normalizePage(1000, -3), [20, 0]);
  assert.deepEqual(normalizePage(0, 'x'), [20, 0]);
  assert.deepEqual(normalizePage(undefined, undefined), [20, 0]);
});

test('значения передаются параметрами, а не склеиваются в SQL', async () => {
  const calls = [];
  const db = { query: async (text, params) => { calls.push({ text, params }); return { rows: [], rowCount: 0 }; } };
  const evil = "' OR '1'='1";

  await assert.rejects(new PgUserRepository(db).getByEmail(evil), NotFoundError);

  assert.ok(!calls[0].text.includes(evil), 'ввод не должен попадать в текст SQL');
  assert.ok(calls[0].text.includes('$1'));
  assert.deepEqual(calls[0].params, [evil]);
  assert.ok(!/SELECT\s+\*/i.test(calls[0].text), 'нужен явный список столбцов');
});

test('withTx: COMMIT при успехе, ROLLBACK при ошибке, клиент освобождается', async () => {
  const log = [];
  const client = { query: async (text) => { log.push(text); return {}; }, release: () => log.push('release') };
  const pool = { connect: async () => client };

  assert.equal(await withTx(pool, async () => 'ok'), 'ok');
  assert.deepEqual(log, ['BEGIN', 'COMMIT', 'release']);

  log.length = 0;
  await assert.rejects(withTx(pool, async () => { throw new Error('boom'); }), /boom/);
  assert.deepEqual(log, ['BEGIN', 'ROLLBACK', 'release']);
});