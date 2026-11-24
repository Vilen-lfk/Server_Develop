const notImplemented = (name) => {
  throw new Error(`${name}: not implemented`);
};

export class UserRepository {
  async create(user) {
    return notImplemented('UserRepository.create');
  }

  async getById(id) {
    return notImplemented('UserRepository.getById');
  }

  async getByEmail(email) {
    return notImplemented('UserRepository.getByEmail');
  }

  async list(limit, offset) {
    return notImplemented('UserRepository.list');
  }

  async delete(id) {
    return notImplemented('UserRepository.delete');
  }
}

export class TariffRepository {
  async create(tariff) {
    return notImplemented('TariffRepository.create');
  }

  async getById(id) {
    return notImplemented('TariffRepository.getById');
  }

  async list(limit, offset) {
    return notImplemented('TariffRepository.list');
  }

  async update(tariff) {
    return notImplemented('TariffRepository.update');
  }

  async delete(id) {
    return notImplemented('TariffRepository.delete');
  }
}

export class CarRepository {
  async create(car) {
    return notImplemented('CarRepository.create');
  }

  async getById(id) {
    return notImplemented('CarRepository.getById');
  }

  async list(limit, offset, filters) {
    return notImplemented('CarRepository.list');
  }

  async update(car) {
    return notImplemented('CarRepository.update');
  }

  async updateStatus(id, status) {
    return notImplemented('CarRepository.updateStatus');
  }

  async delete(id) {
    return notImplemented('CarRepository.delete');
  }
}

export class BookingRepository {
  async create(booking, depositAmount) {
    return notImplemented('BookingRepository.create');
  }

  async getById(id) {
    return notImplemented('BookingRepository.getById');
  }

  async list(limit, offset, filters) {
    return notImplemented('BookingRepository.list');
  }

  async hasOpenBooking(carId) {
    return notImplemented('BookingRepository.hasOpenBooking');
  }

  async changeStatus(id, status, carStatus, changedAt) {
    return notImplemented('BookingRepository.changeStatus');
  }
}