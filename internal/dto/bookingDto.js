import { Booking } from '../domain/booking.js';

export function bookingRequestToDomain(body) {
  return new Booking({
    userId: body.user_id,
    carId: body.car_id,
    startTime: body.start_time,
  });
}

export function bookingToResponse(booking) {
  return {
    id: booking.id,
    user_id: booking.userId,
    car_id: booking.carId,
    start_time: booking.startTime,
    end_time: booking.endTime,
    total_cost: booking.totalCost,
    status: booking.status,
  };
}