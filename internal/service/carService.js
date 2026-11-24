import { Car } from '../domain/car.js';
import { InvalidInputError } from '../domain/errors.js';

const STATUSES = new Set(['Available', 'Rented', 'Maintenance']);

export class CarService {
  constructor(carRepository, tariffRepository) {
    this.cars = carRepository;
    this.tariffs = tariffRepository;
  }

  async create(car) {
    this.#validate(car);
    await this.tariffs.getById(car.tariffId);
    return this.cars.create(car);
  }

  get(id) {
    return this.cars.getById(id);
  }

  list({ limit = 20, offset = 0, status, minFuelLevel } = {}) {
    if (status && !STATUSES.has(status)) {
      throw new InvalidInputError('Недопустимый фильтр статуса автомобиля');
    }

    if (
      minFuelLevel !== undefined &&
      (!Number.isFinite(Number(minFuelLevel)) ||
        Number(minFuelLevel) < 0 ||
        Number(minFuelLevel) > 100)
    ) {
      throw new InvalidInputError('min_fuel_level должен быть от 0 до 100');
    }

    if (
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100 ||
      !Number.isInteger(offset) ||
      offset < 0
    ) {
      throw new InvalidInputError('Некорректные параметры пагинации');
    }

    return this.cars.list(limit, offset, { status, minFuelLevel });
  }

  async update(id, input) {
    this.#validate(input);
    await this.tariffs.getById(input.tariffId);

    const car = new Car({ ...input, id });

    await this.cars.update(car);

    return this.cars.getById(id);
  }

  async updateStatus(id, status) {
    if (!STATUSES.has(status)) {
      throw new InvalidInputError('Недопустимый статус автомобиля');
    }

    await this.cars.getById(id);
    await this.cars.updateStatus(id, status);

    return this.cars.getById(id);
  }

  delete(id) {
    return this.cars.delete(id);
  }

  #validate(car) {
    if (!car.vin || car.vin.length !== 17) {
      throw new InvalidInputError('VIN должен содержать 17 символов');
    }

    if (!car.modelName || !car.licensePlate || !car.tariffId) {
      throw new InvalidInputError('Необходимо указать модель, госномер и тариф');
    }

    if (!Number.isInteger(car.currentMileage) || car.currentMileage < 0) {
      throw new InvalidInputError('Пробег должен быть неотрицательным целым числом');
    }

    if (
      !Number.isFinite(Number(car.fuelLevel)) ||
      car.fuelLevel < 0 ||
      car.fuelLevel > 100
    ) {
      throw new InvalidInputError('Уровень топлива должен быть от 0 до 100');
    }

    if (!STATUSES.has(car.status)) {
      throw new InvalidInputError('Недопустимый статус автомобиля');
    }
  }
}