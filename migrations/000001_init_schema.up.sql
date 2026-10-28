-- gen_random_uuid() встроена в PostgreSQL начиная с версии 13.

CREATE TABLE IF NOT EXISTS users (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email          VARCHAR(255) NOT NULL UNIQUE,
    password_hash  VARCHAR(255) NOT NULL,
    role           VARCHAR(20)  NOT NULL DEFAULT 'DRIVER'
        CHECK (role IN ('DRIVER', 'OPERATOR')),
    license_number VARCHAR(50),
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tariffs (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name             VARCHAR(100)   NOT NULL UNIQUE,
    price_per_minute NUMERIC(10, 2) NOT NULL CHECK (price_per_minute >= 0),
    price_per_day    NUMERIC(10, 2) NOT NULL CHECK (price_per_day >= 0),
    deposit_amount   NUMERIC(10, 2) NOT NULL CHECK (deposit_amount >= 0),
    created_at       TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS car_statuses (
    id   SMALLINT PRIMARY KEY,
    name VARCHAR(30) NOT NULL UNIQUE
);

INSERT INTO car_statuses (id, name) VALUES
    (1, 'Available'),
    (2, 'Rented'),
    (3, 'Maintenance')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS cars (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vin             VARCHAR(17)   NOT NULL UNIQUE CHECK (char_length(vin) = 17),
    model_name      VARCHAR(100)  NOT NULL,
    license_plate   VARCHAR(20)   NOT NULL UNIQUE,
    current_mileage INT           NOT NULL DEFAULT 0 CHECK (current_mileage >= 0),
    fuel_level      NUMERIC(5, 2) NOT NULL DEFAULT 100
        CHECK (fuel_level BETWEEN 0 AND 100),
    status_id       SMALLINT      NOT NULL DEFAULT 1
        REFERENCES car_statuses(id) ON DELETE RESTRICT,
    tariff_id       UUID          NOT NULL
        REFERENCES tariffs(id) ON DELETE RESTRICT,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bookings (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    car_id     UUID NOT NULL REFERENCES cars(id)  ON DELETE RESTRICT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time   TIMESTAMPTZ,
    total_cost NUMERIC(12, 2) CHECK (total_cost >= 0),
    status     VARCHAR(20) NOT NULL DEFAULT 'BOOKED'
        CHECK (status IN ('BOOKED', 'ACTIVE', 'COMPLETED', 'CANCELLED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_booking_period CHECK (end_time IS NULL OR end_time > start_time)
);

CREATE TABLE IF NOT EXISTS transactions (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
    amount     NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    type       VARCHAR(20) NOT NULL
        CHECK (type IN ('DEPOSIT_HOLD', 'PAYMENT', 'REFUND')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cars_status_id       ON cars(status_id);
CREATE INDEX IF NOT EXISTS idx_cars_tariff_id       ON cars(tariff_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id     ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_car_start   ON bookings(car_id, start_time);
CREATE INDEX IF NOT EXISTS idx_transactions_booking ON transactions(booking_id);

-- У автомобиля может быть только одна незавершённая бронь
CREATE UNIQUE INDEX IF NOT EXISTS uq_bookings_car_open
    ON bookings(car_id) WHERE status IN ('BOOKED', 'ACTIVE');
