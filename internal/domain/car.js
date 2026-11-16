export class Car {
  /** status - название из справочника car_statuses: Available, Rented, Maintenance */
  constructor({
    id = null, vin, modelName, licensePlate, currentMileage = 0, fuelLevel = 100,
    status = 'Available', tariffId, createdAt = null,
  }) {
    this.id = id;
    this.vin = vin;
    this.modelName = modelName;
    this.licensePlate = licensePlate;
    this.currentMileage = currentMileage;
    this.fuelLevel = fuelLevel;
    this.status = status;
    this.tariffId = tariffId;
    this.createdAt = createdAt;
  }

  toJSON() {
    return {
      id: this.id,
      vin: this.vin,
      model_name: this.modelName,
      license_plate: this.licensePlate,
      current_mileage: this.currentMileage,
      fuel_level: this.fuelLevel,
      status: this.status,
      tariff_id: this.tariffId,
    };
  }
}