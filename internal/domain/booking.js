export class Booking {
  constructor({
    id = null,
    userId,
    carId,
    startTime,
    endTime = null,
    totalCost = null,
    status = 'BOOKED',
    createdAt = null,
  }) {
    this.id = id;
    this.userId = userId;
    this.carId = carId;
    this.startTime = startTime;
    this.endTime = endTime;
    this.totalCost = totalCost;
    this.status = status;
    this.createdAt = createdAt;
  }
}