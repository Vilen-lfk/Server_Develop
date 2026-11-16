// Деньги хранятся строкой: pg возвращает NUMERIC строкой, это исключает ошибки округления float.
export class Tariff {
  constructor({ id = null, name, pricePerMinute, pricePerDay, depositAmount, createdAt = null }) {
    this.id = id;
    this.name = name;
    this.pricePerMinute = pricePerMinute;
    this.pricePerDay = pricePerDay;
    this.depositAmount = depositAmount;
    this.createdAt = createdAt;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      price_per_minute: this.pricePerMinute,
      price_per_day: this.pricePerDay,
      deposit_amount: this.depositAmount,
    };
  }
}