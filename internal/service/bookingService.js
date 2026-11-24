import { Booking } from '../domain/booking.js';
import {
  ConflictError,
  InvalidInputError,
  NotFoundError,
} from '../domain/errors.js';

const ALLOWED_TRANSITIONS = {
  BOOKED: new Set(['ACTIVE', 'CANCELLED']),
  ACTIVE: new Set(['COMPLETED']),
  COMPLETED: new Set(),
  CANCELLED: new Set(),
};

export class BookingService {
  constructor({
    bookingRepository,
    carRepository,
    userRepository,
    tariffRepository,
    clock = () => new Date(),
  }) {
    this.bookings = bookingRepository;
    this.cars = carRepository;
    this.users = userRepository;
    this.tariffs = tariffRepository;
    this.clock = clock;
  }

  async create(input) {
    if (!input?.userId || !input?.carId || !input?.startTime) {
      throw new InvalidInputError(
        'Необходимо указать user_id, car_id и start_time',
      );
    }

    const start = new Date(input.startTime);

    if (!Number.isFinite(start.getTime())) {
      throw new InvalidInputError('Некорректное время начала бронирования');
    }

    if (start <= this.clock()) {
      throw new InvalidInputError(
        'Нельзя бронировать автомобиль на прошедшее время',
      );
    }

    if (!input.userId) {
      throw new InvalidInputError('Необходимо указать пользователя');
    }

    const user = await this.users.getById(input.userId);

    if (!user) {
      throw new NotFoundError('Пользователь не найден');
    }

    const car = await this.cars.getById(input.carId);

    if (car.status !== 'Available') {
      throw new ConflictError(
        'Автомобиль недоступен для бронирования',
      );
    }

    const tariff = await this.tariffs.getById(car.tariffId);

    if (await this.bookings.hasOpenBooking(input.carId)) {
      throw new ConflictError(
        'У автомобиля уже есть незавершённое бронирование',
      );
    }

    const booking = new Booking({
      userId: input.userId,
      carId: input.carId,
      startTime: start.toISOString(),
      status: 'BOOKED',
    });

    return this.bookings.create(booking, tariff.depositAmount);
  }

  get(id) {
    return this.bookings.getById(id);
  }

  list({ limit = 20, offset = 0, status } = {}) {
    if (
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100 ||
      !Number.isInteger(offset) ||
      offset < 0
    ) {
      throw new InvalidInputError('Некорректные параметры пагинации');
    }

    if (
      status &&
      !['BOOKED', 'ACTIVE', 'COMPLETED', 'CANCELLED'].includes(status)
    ) {
      throw new InvalidInputError(
        'Недопустимый фильтр статуса бронирования',
      );
    }

    return this.bookings.list(limit, offset, { status });
  }

  async changeStatus(id, nextStatus) {
    const booking = await this.bookings.getById(id);

    if (!Object.hasOwn(ALLOWED_TRANSITIONS, nextStatus)) {
      throw new InvalidInputError('Неизвестный статус бронирования');
    }

    if (!ALLOWED_TRANSITIONS[booking.status]?.has(nextStatus)) {
      throw new ConflictError(
        `Недопустимый переход статуса ${booking.status} -> ${nextStatus}`,
      );
    }

    const car = await this.cars.getById(booking.carId);

    if (nextStatus === 'ACTIVE' && car.status !== 'Available') {
      throw new ConflictError(
        'Автомобиль не находится в статусе Available',
      );
    }

    if (
      nextStatus === 'ACTIVE' &&
      new Date(booking.startTime) > this.clock()
    ) {
      throw new ConflictError(
        'Нельзя начать поездку раньше времени бронирования',
      );
    }

    if (
      nextStatus === 'COMPLETED' &&
      new Date(booking.startTime) > this.clock()
    ) {
      throw new ConflictError(
        'Нельзя завершить поездку до её начала',
      );
    }

    const tariff = await this.tariffs.getById(car.tariffId);
    const changedAt = this.clock();

    let totalCost = null;

    if (nextStatus === 'COMPLETED') {
      const minutes = Math.max(
        1,
        Math.ceil(
          (changedAt - new Date(booking.startTime)) / 60000,
        ),
      );

      totalCost = (
        minutes * Number(tariff.pricePerMinute)
      ).toFixed(2);
    }

    const carStatus =
      nextStatus === 'ACTIVE'
        ? 'Rented'
        : nextStatus === 'COMPLETED' || nextStatus === 'CANCELLED'
          ? 'Available'
          : car.status;

    return this.bookings.changeStatus(
      id,
      nextStatus,
      carStatus,
      changedAt.toISOString(),
      totalCost,
      tariff.depositAmount,
    );
  }
}