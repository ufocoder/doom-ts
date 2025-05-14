export class Angle {
  private angle: number;

  constructor(angle: number = 0) {
    this.angle = angle;
    this.normalize360();
  }

  public getCosValue() {
    return Math.cos((this.angle * Math.PI) / 180);
  }

  public getSinValue() {
    return Math.sin((this.angle * Math.PI) / 180);
  }

  public getTanValue() {
    return Math.tan((this.angle * Math.PI) / 180);
  }

  public getSignedValue() {
    if (this.angle > 180) {
      return this.angle - 360;
    }
    return this.angle;
  }

  public assign(rhs: Angle): Angle;
  public assign(rhs: number): Angle;
  public assign(rhs: Angle | number): Angle {
    if (typeof rhs === "number") {
      this.angle = rhs;
    } else {
      this.angle = rhs.getValue();
    }
    this.normalize360();
    return this;
  }

  public add(rhs: Angle): Angle;
  public add(rhs: number): Angle;
  public add(rhs: Angle | number): Angle {
    if (typeof rhs === "number") {
      return new Angle(this.angle + rhs);
    }
    return new Angle(this.angle + rhs.angle);
  }

  public subtract(rhs: Angle): Angle;
  public subtract(rhs: number): Angle;
  public subtract(rhs: Angle | number): Angle {
    if (typeof rhs === "number") {
      return new Angle(this.angle - rhs);
    }
    return new Angle(this.angle - rhs.angle);
  }

  public devide(rhs: Angle): Angle;
  public devide(rhs: number): Angle;
  public devide(rhs: Angle | number): Angle {
    if (typeof rhs === "number") {
      return new Angle(this.angle / rhs);
    }
    return new Angle(this.angle / rhs.angle);
  }

  public negate(): Angle {
    return new Angle(360 - this.angle);
  }

  public getValue(): number {
    return this.angle;
  }

  private normalize360(): void {
    this.angle = this.angle % 360;
    if (this.angle < 0) {
      this.angle += 360;
    }
  }

  public addAssign(rhs: number): Angle {
    this.angle += rhs;
    this.normalize360();
    return this;
  }

  public subtractAssign(rhs: number): Angle {
    this.angle -= rhs;
    this.normalize360();
    return this;
  }

  public lessThan(rhs: Angle): boolean;
  public lessThan(rhs: number): boolean;
  public lessThan(rhs: Angle | number): boolean {
    if (typeof rhs === "number") {
      return this.angle < rhs;
    } else {
      return this.angle < rhs.angle;
    }
  }

  public lessThanOrEqual(rhs: Angle): boolean;
  public lessThanOrEqual(rhs: number): boolean;
  public lessThanOrEqual(rhs: Angle | number): boolean {
    if (typeof rhs === "number") {
      return this.angle <= rhs;
    } else {
      return this.angle <= rhs.angle;
    }
  }

  public greaterThan(rhs: Angle): boolean;
  public greaterThan(rhs: number): boolean;
  public greaterThan(rhs: Angle | number): boolean {
    if (typeof rhs === "number") {
      return this.angle > rhs;
    } else {
      return this.angle > rhs.angle;
    }
  }

  public greaterThanOrEqual(rhs: Angle): boolean;
  public greaterThanOrEqual(rhs: number): boolean;
  public greaterThanOrEqual(rhs: Angle | number): boolean {
    if (typeof rhs === "number") {
      return this.angle >= rhs;
    } else {
      return this.angle >= rhs.angle;
    }
  }
}
