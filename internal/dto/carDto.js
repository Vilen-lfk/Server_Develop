import { Car } from '../domain/car.js';

export function carRequestToDomain(body) {
  return new Car({
    vin: body.vin,
    modelName: body.model_name,
    licensePlate: body.license_plate,
    currentMileage: body.current_mileage ?? 0,
    fuelLevel: body.fuel_level ?? 100,
    status: body.status ?? 'Available',
    tariffId: body.tariff_id,
  });
}

export function carToResponse(car) {
  return {
    id: car.id,
    vin: car.vin,
    model_name: car.modelName,
    license_plate: car.licensePlate,
    current_mileage: car.currentMileage,
    fuel_level: car.fuelLevel,
    status: car.status,
    tariff_id: car.tariffId,
  };
}