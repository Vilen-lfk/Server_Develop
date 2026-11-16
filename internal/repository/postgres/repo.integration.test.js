import { test, after, before } from 'node:test';
import assert from 'node:assert/strict';
import {
  AlreadyExistsError, ConflictError, InvalidInputError, NotFoundError,
} from '../../domain/errors.js';
import { Car } from '../../domain/car.js';
import { Tariff } from '../../domain/tariff.js';
import { User } from '../../domain/user.js';
import { PgCarRepository } from './carRepository.js';
import { PgTariffRepository } from './tariffRepository.js';
import { PgUserRepository } from './userRepository.js';

const dsn = process.env.TEST_DATABASE_URL;
const skip = dsn ? false : 'TEST_DATABASE_URL не задан';

let pool;
let users;
let tariffs;
let cars;

before(async () => {
  if (!dsn) return;
  const { default: pg } = await import('pg');
  pool = new pg.Pool({ connectionString: dsn, max: 5 });
  users = new PgUserRepository(pool);
  tariffs = new PgTariffRepository(pool);
  cars = new PgCarRepository(pool);
});
after(async () => { await pool?.end(); });

const uniq = (prefix) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
const newUser = () => new User({ email: `${uniq('user')}@example.com`, passwordHash: 'hash' });
const newTariff = () => new Tariff({ name: uniq('tariff'), pricePerMinute: '12.50', pricePerDay: '3500.00', depositAmount: '5000.00' });
const vin = () => String(Date.now()).padStart(17, 'X').slice(-17);

test('User: create заполняет id и createdAt, getById возвращает запись', { skip }, async () => {
  const u = await users.create(newUser());
  assert.ok(u.id && u.createdAt, 'id и createdAt заполняет СУБД');
  assert.equal(u.role, 'DRIVER');
  assert.equal((await users.getById(u.id)).email, u.email);
  await users.delete(u.id);
});

test('User: несуществующая запись -> NotFoundError', { skip }, async () => {
  await assert.rejects(users.getById('00000000-0000-0000-0000-000000000000'), NotFoundError);
});

test('User: неверный UUID -> InvalidInputError (а не 500)', { skip }, async () => {
  await assert.rejects(users.getById('abc'), InvalidInputError);
});

test('User: повторный email -> AlreadyExistsError', { skip }, async () => {
  const first = await users.create(newUser());
  await assert.rejects(users.create(new User({ email: first.email, passwordHash: 'x' })), AlreadyExistsError);
  await users.delete(first.id);
});

test('User: после удаления чтение и повторное удаление -> NotFoundError', { skip }, async () => {
  const u = await users.create(newUser());
  await users.delete(u.id);
  await assert.rejects(users.getById(u.id), NotFoundError);
  await assert.rejects(users.delete(u.id), NotFoundError);
});

test('User: SQL-инъекция в getByEmail -> NotFoundError', { skip }, async () => {
  const u = await users.create(newUser());
  await assert.rejects(users.getByEmail("' OR '1'='1"), NotFoundError);
  await users.delete(u.id);
});

test('User: list возвращает не больше limit записей', { skip }, async () => {
  const created = [];
  for (let i = 0; i < 3; i++) created.push(await users.create(newUser()));
  assert.ok((await users.list(2, 0)).length <= 2);
  assert.ok((await users.list(1000, 0)).length <= 100);
  for (const u of created) await users.delete(u.id);
});

test('User: toJSON не содержит хеш пароля', { skip }, async () => {
  const u = await users.create(newUser());
  assert.ok(!('passwordHash' in u.toJSON()) && !('password_hash' in u.toJSON()));
  await users.delete(u.id);
});

test('Tariff: create, update, delete; деньги не теряют точность', { skip }, async () => {
  const t = await tariffs.create(newTariff());
  assert.equal((await tariffs.getById(t.id)).pricePerMinute, '12.50');

  t.pricePerMinute = '15.00';
  await tariffs.update(t);
  assert.equal((await tariffs.getById(t.id)).pricePerMinute, '15.00');

  await tariffs.delete(t.id);
  await assert.rejects(tariffs.getById(t.id), NotFoundError);
});

test('Tariff: update несуществующей записи -> NotFoundError', { skip }, async () => {
  const ghost = newTariff();
  ghost.id = '00000000-0000-0000-0000-000000000000';
  await assert.rejects(tariffs.update(ghost), NotFoundError);
});

test('Tariff: отрицательная цена -> InvalidInputError (CHECK)', { skip }, async () => {
  const bad = newTariff();
  bad.pricePerMinute = '-10';
  await assert.rejects(tariffs.create(bad), InvalidInputError);
});

test('Car: create/get с JOIN; удаление тарифа с авто -> ConflictError', { skip }, async () => {
  const t = await tariffs.create(newTariff());
  const car = await cars.create(new Car({
    vin: vin(), modelName: 'Kia Rio', licensePlate: uniq('A').slice(0, 20), tariffId: t.id,
  }));
  const got = await cars.getById(car.id);
  assert.equal(got.status, 'Available');
  assert.equal(got.modelName, 'Kia Rio');

  await assert.rejects(tariffs.delete(t.id), ConflictError); // ON DELETE RESTRICT

  await cars.delete(car.id);
  await tariffs.delete(t.id);
});

test('Car: неизвестный статус -> InvalidInputError', { skip }, async () => {
  const t = await tariffs.create(newTariff());
  const car = new Car({ vin: vin(), modelName: 'X', licensePlate: uniq('B').slice(0, 20), tariffId: t.id, status: 'Flying' });
  await assert.rejects(cars.create(car), InvalidInputError);
  await tariffs.delete(t.id);
});