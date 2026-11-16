export class DomainError extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = this.constructor.name;
  }
}

/** Запись не найдена -> 404 */
export class NotFoundError extends DomainError {
  code = 'NOT_FOUND';
  constructor(message = 'not found', options) {
    super(message, options);
  }
}

/** Нарушение уникальности -> 409 */
export class AlreadyExistsError extends DomainError {
  code = 'ALREADY_EXISTS';
  constructor(message = 'already exists', options) {
    super(message, options);
  }
}

/** Нарушение связей, занятый ресурс -> 409 */
export class ConflictError extends DomainError {
  code = 'CONFLICT';
  constructor(message = 'conflict', options) {
    super(message, options);
  }
}

/** Нарушение CHECK / NOT NULL, неверный формат значения -> 400 */
export class InvalidInputError extends DomainError {
  code = 'INVALID_INPUT';
  constructor(message = 'invalid input', options) {
    super(message, options);
  }
}