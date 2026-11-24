import { readJson, sendJson } from './http.js';

import {
  bookingRequestToDomain,
  bookingToResponse,
} from '../dto/bookingDto.js';

export class BookingController {
  constructor(bookingService) {
    this.bookings = bookingService;
  }

  register(router) {
    router.get('/bookings', (req, res) => this.list(req, res));
    router.post('/bookings', (req, res) => this.create(req, res));
    router.get('/bookings/:id', (req, res) => this.get(req, res));
    router.patch('/bookings/:id/status', (req, res) =>
      this.changeStatus(req, res),
    );
  }

  async list(req, res) {
    const url = new URL(req.url, 'http://localhost');

    const items = await this.bookings.list({
      limit: Number(url.searchParams.get('limit') ?? 20),
      offset: Number(url.searchParams.get('offset') ?? 0),
      status: url.searchParams.get('status') || undefined,
    });

    sendJson(res, 200, items.map(bookingToResponse));
  }

  async create(req, res) {
    const booking = await this.bookings.create(
      bookingRequestToDomain(await readJson(req)),
    );

    sendJson(
      res,
      201,
      bookingToResponse(booking),
      { Location: `/api/v1/bookings/${booking.id}` },
    );
  }

  async get(req, res) {
    sendJson(
      res,
      200,
      bookingToResponse(
        await this.bookings.get(req.params.id),
      ),
    );
  }

  async changeStatus(req, res) {
    const body = await readJson(req);

    const booking = await this.bookings.changeStatus(
      req.params.id,
      body.status,
    );

    sendJson(res, 200, bookingToResponse(booking));
  }
}