export class User {
  constructor({ id = null, email, passwordHash, role = 'DRIVER', licenseNumber = null, createdAt = null }) {
    this.id = id;
    this.email = email;
    this.passwordHash = passwordHash;
    this.role = role;
    this.licenseNumber = licenseNumber;
    this.createdAt = createdAt;
  }

  /** Вид для клиента (UserResponse из openapi.yaml). Хеш пароля не отдаётся. */
  toJSON() {
    return {
      id: this.id,
      email: this.email,
      role: this.role,
      license_number: this.licenseNumber,
      created_at: this.createdAt,
    };
  }
}