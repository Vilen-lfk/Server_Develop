const notImplemented = (name) => {
  throw new Error(`${name}: not implemented`);
};

export class UserRepository {
  async create(user) { return notImplemented('UserRepository.create'); }
  async getById(id) { return notImplemented('UserRepository.getById'); }
  async getByEmail(email) { return notImplemented('UserRepository.getByEmail'); }
  async list(limit, offset) { return notImplemented('UserRepository.list'); }
  async delete(id) { return notImplemented('UserRepository.delete'); }
}

export class TariffRepository {
  async create(tariff) { return notImplemented('TariffRepository.create'); }
  async getById(id) { return notImplemented('TariffRepository.getById'); }
  async list(limit, offset) { return notImplemented('TariffRepository.list'); }
  async update(tariff) { return notImplemented('TariffRepository.update'); }
  async delete(id) { return notImplemented('TariffRepository.delete'); }
}

export class CarRepository {
  async create(car) { return notImplemented('CarRepository.create'); }
  async getById(id) { return notImplemented('CarRepository.getById'); }
  async list(limit, offset) { return notImplemented('CarRepository.list'); }
  async delete(id) { return notImplemented('CarRepository.delete'); }
}